import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch available products and pricing
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profile = []; }
    
    if (profile.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const reseller = profile[0] as any;
    const discountRate = reseller.discount_rate || 10;
    
    // Get available result checker cards by type
    const cardCounts = await sql`
      SELECT exam_type, COUNT(*) as count
      FROM result_checker_cards
      WHERE status = 'available'
      GROUP BY exam_type
    `;
    
    // Get sample cards for pricing
    const sampleCards = await sql`
      SELECT exam_type, wholesale_price, selling_price
      FROM result_checker_cards
      WHERE status = 'available'
      LIMIT 10
    `;
    
    return NextResponse.json({
      success: true,
      discountRate,
      resellerCode: reseller.reseller_code,
      resultCheckerCards: cardCounts,
      samplePricing: sampleCards,
      networks: [
        { id: 'mtn', name: 'MTN', color: '#006994' },
        { id: 'vodafone', name: 'Vodafone', color: '#E60000' },
        { id: 'airteltigo', name: 'AirtelTigo', color: '#0099CC' }
      ],
      dataBundles: [
        { id: '1gb', name: '1GB', size: '1GB', price: 5.00 },
        { id: '2gb', name: '2GB', size: '2GB', price: 8.00 },
        { id: '3gb', name: '3GB', size: '3GB', price: 11.00 },
        { id: '5gb', name: '5GB', size: '5GB', price: 16.00 },
        { id: '10gb', name: '10GB', size: '10GB', price: 30.00 },
        { id: '20gb', name: '20GB', size: '20GB', price: 55.00 }
      ]
    });
    
  } catch (error) {
    console.error("Reseller purchase GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a wholesale purchase
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profile = []; }
    
    if (profile.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const reseller = profile[0] as any;
    const discountRate = reseller.discount_rate || 10;
    
    const body = await request.json();
    const { type, network, phone, amount, bundleId, bundlePrice, examType, quantity } = body;
    
    let saleData: any = {
      reseller_id: reseller.id,
      product_type: type,
      status: 'pending'
    };
    
    let totalCost = 0;
    let sellingPrice = 0;
    
    if (type === 'airtime') {
      // Airtime purchase
      const discountedAmount = parseFloat(amount) * (1 - discountRate / 100);
      totalCost = discountedAmount;
      sellingPrice = parseFloat(amount);
      
      saleData = {
        ...saleData,
        customer_phone: phone,
        network,
        amount: sellingPrice,
        cost_price: totalCost,
        selling_price: sellingPrice,
        profit: sellingPrice - totalCost
      };
    } else if (type === 'data') {
      // Data bundle purchase
      const discountedPrice = bundlePrice * (1 - discountRate / 100);
      totalCost = discountedPrice;
      sellingPrice = bundlePrice;
      
      saleData = {
        ...saleData,
        customer_phone: phone,
        network,
        bundle_id: bundleId,
        amount: sellingPrice,
        cost_price: totalCost,
        selling_price: sellingPrice,
        profit: sellingPrice - totalCost
      };
    } else if (type === 'result_checker') {
      // Result checker cards
      const cards = await sql`
        SELECT * FROM result_checker_cards
        WHERE exam_type = ${examType} AND status = 'available'
        LIMIT ${parseInt(quantity || '1')}
      `;
      
      if (cards.length < parseInt(quantity || '1')) {
        return NextResponse.json(
          { success: false, error: `Only ${cards.length} cards available` },
          { status: 400 }
        );
      }
      
      const cardTotal = cards.reduce((sum, c) => sum + parseFloat(c.wholesale_price || c.selling_price), 0);
      totalCost = cardTotal;
      sellingPrice = cards.reduce((sum, c) => sum + parseFloat(c.selling_price), 0);
      
      saleData = {
        ...saleData,
        amount: sellingPrice,
        cost_price: totalCost,
        selling_price: sellingPrice,
        profit: sellingPrice - totalCost,
        cards: cards.map(c => c.id)
      };
    }
    
    // Create the sale record
    const saleResult = await sql`
      INSERT INTO reseller_sales (
        reseller_id,
        customer_phone,
        product_type,
        network,
        bundle_id,
        amount,
        cost_price,
        selling_price,
        profit,
        status,
        reference
      ) VALUES (
        ${saleData.reseller_id},
        ${saleData.customer_phone || null},
        ${saleData.product_type},
        ${saleData.network || null},
        ${saleData.bundle_id || null},
        ${saleData.amount},
        ${saleData.cost_price},
        ${saleData.selling_price},
        ${saleData.profit},
        'pending',
        ${'SALE-' + Date.now()}
      )
      RETURNING *
    `;
    
    // For result checker cards, reserve them
    if (type === 'result_checker' && saleData.cards) {
      for (const cardId of saleData.cards) {
        await sql`
          UPDATE result_checker_cards
          SET status = 'reserved'
          WHERE id = ${cardId}
        `;
        
        // Add to reseller inventory
        await sql`
          INSERT INTO reseller_inventory (
            reseller_id,
            card_id,
            cost_price,
            selling_price,
            status
          ) VALUES (
            ${reseller.id},
            ${cardId},
            (SELECT wholesale_price FROM result_checker_cards WHERE id = ${cardId}),
            (SELECT selling_price FROM result_checker_cards WHERE id = ${cardId}),
            'available'
          )
        `;
      }
    }
    
    // Update reseller totals
    await sql`
      UPDATE reseller_profiles
      SET total_sales = total_sales + ${sellingPrice}
      WHERE id = ${reseller.id}
    `;
    
    return NextResponse.json({
      success: true,
      sale: saleResult[0],
      totalCost,
      sellingPrice,
      discountApplied: discountRate
    });
    
  } catch (error) {
    console.error("Reseller purchase POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
