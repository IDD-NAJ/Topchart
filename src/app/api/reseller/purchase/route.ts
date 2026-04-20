import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, purchaseSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch available products and pricing
async function GETHandler(request: NextRequest) {
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
    
    // Get active data bundles
    const activeDataBundles = await sql`
      SELECT id, network, name, price, price_override, is_active 
      FROM data_bundles
      WHERE is_active = true
      ORDER BY price ASC
    `;

    const formattedDataBundles = activeDataBundles.map((b: any) => ({
      id: b.id,
      network: b.network.toLowerCase(),
      name: b.name,
      size: b.name,
      price: b.price_override || b.price
    }));

    // Get unique networks from data bundles
    const uniqueNetworks = [...new Set(activeDataBundles.map((b: any) => b.network.toLowerCase()))];
    const networkColors: Record<string, string> = {
      mtn: '#0052CC',
      vodafone: '#E60000',
      airteltigo: '#0099CC',
      telecel: '#0099CC',
      glo: '#009900'
    };
    const formattedNetworks = uniqueNetworks.map(id => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      color: networkColors[id] || '#666666'
    }));
    
    return NextResponse.json({
      success: true,
      discountRate,
      resellerCode: reseller.reseller_code,
      walletBalance: reseller.wallet_balance || 0,
      resultCheckerCards: cardCounts,
      samplePricing: sampleCards,
      networks: formattedNetworks.length > 0 ? formattedNetworks : [
        { id: 'mtn', name: 'MTN', color: '#0052CC' },
        { id: 'vodafone', name: 'Vodafone', color: '#E60000' },
        { id: 'airteltigo', name: 'AirtelTigo', color: '#0099CC' }
      ],
      dataBundles: formattedDataBundles
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
async function POSTHandler(request: NextRequest) {
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
    
    // Validate input
    const validation = validateRequest(purchaseSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          errors: formatZodError(validation.errors!),
        },
        { status: 400 }
      );
    }
    
    const payload = validation.data!;
    const { type } = payload;

    const rawIdempotencyKey = request.headers.get("x-idempotency-key")?.trim() || null;
    const idempotencyKey = rawIdempotencyKey && rawIdempotencyKey.length >= 8 ? rawIdempotencyKey : randomUUID();
    const reference = `RS-${reseller.id}-${idempotencyKey}`;

    const existingSale = await sql`
      SELECT *
      FROM reseller_sales
      WHERE reseller_id = ${reseller.id} AND reference = ${reference}
      LIMIT 1
    `;

    if (existingSale.length) {
      const sale = existingSale[0] as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        sale,
        totalCost: Number(sale.cost_price || 0),
        sellingPrice: Number(sale.amount || sale.selling_price || 0),
        discountApplied: discountRate,
        duplicate: true,
      });
    }

    let saleData: any = {
      reseller_id: reseller.id,
      product_type: type,
      status: 'pending',
      reference
    };
    
    let totalCost = 0;
    let sellingPrice = 0;
    
    if (type === 'data') {
      const data = payload as {
        type: 'data';
        network: string;
        phone: string;
        bundleId?: string;
        bundle_id?: string;
        amount?: number;
      };

      const bundleId = data.bundleId || data.bundle_id;

      if (!bundleId) {
        return NextResponse.json({ success: false, error: "Bundle ID is required" }, { status: 400 });
      }

      const [bundleRow] = await sql`
        SELECT 
          id,
          network,
          price,
          price_override as "priceOverride",
          is_active as "isActive"
        FROM data_bundles
        WHERE id = ${bundleId}
        LIMIT 1
      `;

      if (!bundleRow) {
        return NextResponse.json({ success: false, error: "Data bundle not found" }, { status: 404 });
      }

      if (!(bundleRow as { isActive: boolean }).isActive) {
        return NextResponse.json({ success: false, error: "Selected bundle is unavailable" }, { status: 400 });
      }

      const bundle = bundleRow as {
        id: string;
        network: string;
        price: number | string;
        priceOverride: number | string | null;
      };

      const basePrice = bundle.priceOverride ? Number(bundle.priceOverride) : Number(bundle.price);

      if (Number.isNaN(basePrice) || basePrice <= 0) {
        return NextResponse.json({ success: false, error: "Invalid bundle pricing" }, { status: 400 });
      }

      const normalizedNetwork = (bundle.network || data.network).toLowerCase();

      if (data.network && data.network !== normalizedNetwork) {
        return NextResponse.json({ success: false, error: "Selected bundle does not match network" }, { status: 400 });
      }
      const effectiveDiscount = discountRate;
      const discountedPrice = basePrice * (1 - effectiveDiscount / 100);

      totalCost = Math.max(0, Number(discountedPrice.toFixed(2)));
      sellingPrice = Number(basePrice.toFixed(2));
      
      saleData = {
        ...saleData,
        customer_phone: data.phone,
        network: normalizedNetwork,
        bundle_id: bundle.id,
        amount: sellingPrice,
        cost_price: totalCost,
        selling_price: sellingPrice,
        profit: sellingPrice - totalCost
      };
    } else if (type === 'result_checker') {
      const data = payload as {
        type: 'result_checker';
        examType?: string;
        exam_type?: string;
        quantity: number;
      };

      const examType = data.examType || data.exam_type;

      if (!examType) {
        return NextResponse.json({ success: false, error: "Exam type is required" }, { status: 400 });
      }
      // Result checker cards
      const cards = await sql`
        SELECT * FROM result_checker_cards
        WHERE exam_type = ${examType} AND status = 'available'
        LIMIT ${data.quantity}
      `;
      
      if (cards.length < data.quantity) {
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

    if (totalCost > Number(reseller.wallet_balance || 0)) {
      return NextResponse.json({ success: false, error: "Insufficient wallet balance" }, { status: 400 });
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
        ${reference}
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

// Export GET and POST with rate limiting
export const GET = withRateLimit({ type: "api" })(GETHandler);
export const POST = withRateLimit({ type: "api" })(POSTHandler);
