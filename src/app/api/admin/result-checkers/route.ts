import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all result checker cards
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const examType = searchParams.get("examType");
    const status = searchParams.get("status");
    
    let query = `
      SELECT 
        rcc.*,
        u.email as purchased_by_email
      FROM result_checker_cards rcc
      LEFT JOIN users u ON rcc.purchased_by = u.id
      WHERE 1=1
    `;
    
    if (examType) {
      query += ` AND rcc.exam_type = '${examType}'`;
    }
    
    if (status) {
      query += ` AND rcc.status = '${status}'`;
    }
    
    query += ` ORDER BY rcc.created_at DESC`;
    
    const cards = await sqlUnsafe(query);
    
    // Get inventory stats
    const stats = await sql`
      SELECT 
        exam_type,
        status,
        COUNT(*) as count
      FROM result_checker_cards
      GROUP BY exam_type, status
    `;
    
    return NextResponse.json({
      success: true,
      cards,
      stats
    });
    
  } catch (error) {
    console.error("Admin result checkers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Bulk import cards
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const body = await request.json();
    const { cards } = body;
    
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cards array is required" },
        { status: 400 }
      );
    }
    
    const inserted: any[] = [];
    const errors: any[] = [];
    
    for (const card of cards) {
      try {
        const {
          exam_type,
          card_pin,
          serial_number,
          selling_price,
          wholesale_price,
          expiry_date
        } = card;
        
        if (!exam_type || !card_pin || !selling_price) {
          errors.push({ card, error: "Missing required fields" });
          continue;
        }
        
        const result = await sql`
          INSERT INTO result_checker_cards (
            exam_type,
            card_pin,
            serial_number,
            selling_price,
            wholesale_price,
            expiry_date,
            status
          ) VALUES (
            ${exam_type},
            ${card_pin},
            ${serial_number || null},
            ${selling_price},
            ${wholesale_price || selling_price * 0.8},
            ${expiry_date || null},
            'available'
          )
          RETURNING *
        `;
        
        inserted.push(result[0]);
      } catch (err: any) {
        errors.push({ card, error: err.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      inserted: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
      cards: inserted
    });
    
  } catch (error) {
    console.error("Admin result checkers POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update card prices
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const body = await request.json();
    const { card_ids, selling_price, wholesale_price } = body;
    
    if (!card_ids || !Array.isArray(card_ids) || card_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Card IDs are required" },
        { status: 400 }
      );
    }
    
    const updates: string[] = [];
    
    if (selling_price !== undefined) {
      updates.push(`selling_price = ${selling_price}`);
    }
    
    if (wholesale_price !== undefined) {
      updates.push(`wholesale_price = ${wholesale_price}`);
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }
    
    const query = `
      UPDATE result_checker_cards
      SET ${updates.join(", ")}
      WHERE id = ANY($1::uuid[])
      RETURNING *
    `;
    
    const updated = await sqlUnsafe(query, [card_ids]);
    
    return NextResponse.json({
      success: true,
      updated: updated.length,
      cards: updated
    });
    
  } catch (error) {
    console.error("Admin result checkers PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove expired/used cards
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("id");
    
    if (!cardId) {
      return NextResponse.json(
        { success: false, error: "Card ID is required" },
        { status: 400 }
      );
    }
    
    await sql`
      DELETE FROM result_checker_cards
      WHERE id = ${cardId}
    `;
    
    return NextResponse.json({
      success: true,
      message: "Card deleted successfully"
    });
    
  } catch (error) {
    console.error("Admin result checkers DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
