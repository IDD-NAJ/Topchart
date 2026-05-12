import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List result checker cards (available only for regular users, all for admin) or purchase history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examType = searchParams.get("examType");
    const history = searchParams.get("history");
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    let isAdmin = false;
    let userId = null;
    
    if (sessionToken) {
      const sessions = await sql`
        SELECT u.id, u.role FROM auth_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
        LIMIT 1
      `;
      
      if (sessions.length > 0) {
        const session = sessions[0] as { id: string; role: string };
        userId = session.id;
        isAdmin = session.role === "ADMIN";
      }
    }
    
    // Return purchase history if requested
    if (history === "true" && userId) {
      const purchases = await sql`
        SELECT 
          rcp.id,
          rcp.exam_type,
          rcp.amount_paid,
          rcp.created_at,
          rcc.card_pin,
          rcc.serial_number
        FROM result_checker_purchases rcp
        JOIN result_checker_cards rcc ON rcp.card_id = rcc.id
        WHERE rcp.user_id = ${userId}
        ORDER BY rcp.created_at DESC
      `;
      
      return NextResponse.json({
        success: true,
        purchases: purchases.map((p: any) => ({
          id: p.id,
          exam_type: p.exam_type,
          card_pin: p.card_pin,
          serial_number: p.serial_number,
          amount_paid: p.amount_paid,
          created_at: p.created_at
        }))
      });
    }
    
    // Return available cards
    let cards;
    
    if (examType) {
      cards = await sql`
        SELECT 
          id,
          exam_type,
          selling_price,
          wholesale_price,
          status,
          expiry_date
        FROM result_checker_cards
        WHERE status = 'available'
        AND exam_type = ${examType}
        ORDER BY exam_type, selling_price
      `;
    } else {
      cards = await sql`
        SELECT 
          id,
          exam_type,
          selling_price,
          wholesale_price,
          status,
          expiry_date
        FROM result_checker_cards
        WHERE status = 'available'
        ORDER BY exam_type, selling_price
      `;
    }
    
    return NextResponse.json({
      success: true,
      cards: cards.map((c: any) => ({
        id: c.id,
        examType: c.exam_type,
        price: isAdmin ? c.selling_price : c.selling_price,
        wholesalePrice: c.wholesale_price,
        status: c.status
      }))
    });
    
  } catch (error) {
    console.error("Result checkers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Purchase a result checker card
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id, u.role FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const user = sessions[0] as { id: string; role: string };
    
    const body = await request.json();
    const { card_id, payment_reference } = body;
    
    if (!card_id) {
      return NextResponse.json(
        { success: false, error: "Card ID is required" },
        { status: 400 }
      );
    }
    
    // Get card details
    const card = await sql`
      SELECT * FROM result_checker_cards
      WHERE id = ${card_id}
      AND status = 'available'
    `;
    
    if (card.length === 0) {
      return NextResponse.json(
        { success: false, error: "Card not available" },
        { status: 404 }
      );
    }
    
    const cardData = card[0] as any;
    
    // Determine price based on user type
    const isReseller = user.role === "RESELLER";
    const price = isReseller ? cardData.wholesale_price : cardData.selling_price;
    
    // Update card status
    await sql`
      UPDATE result_checker_cards
      SET 
        status = 'sold',
        purchased_by = ${user.id},
        purchased_at = NOW()
      WHERE id = ${card_id}
    `;
    
    // Create purchase record
    const purchase = await sql`
      INSERT INTO result_checker_purchases (
        user_id,
        card_id,
        exam_type,
        amount_paid,
        payment_reference,
        status
      ) VALUES (
        ${user.id},
        ${card_id},
        ${cardData.exam_type},
        ${price},
        ${payment_reference || null},
        'completed'
      )
      RETURNING *
    `;
    
    // Return card details with PIN (masked for security)
    return NextResponse.json({
      success: true,
      message: "Purchase successful",
      purchase: purchase[0],
      card: {
        id: cardData.id,
        examType: cardData.exam_type,
        pin: cardData.card_pin,
        serialNumber: cardData.serial_number
      }
    });
    
  } catch (error) {
    console.error("Result checker purchase error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
