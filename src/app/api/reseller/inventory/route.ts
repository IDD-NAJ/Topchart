import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, markSoldSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch reseller inventory and sales history
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
    
    const safeQuery = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try { return await fn(); } catch { return []; }
    };

    // Get inventory (result checker cards)
    const inventory = await safeQuery(() => sql`
      SELECT 
        ri.*,
        rcc.exam_type,
        rcc.card_pin,
        rcc.serial_number
      FROM reseller_inventory ri
      JOIN result_checker_cards rcc ON ri.card_id = rcc.id
      WHERE ri.reseller_id = ${reseller.id}
      ORDER BY ri.created_at DESC
    `);

    // Get sales history
    const sales = await safeQuery(() => sql`
      SELECT *
      FROM reseller_sales
      WHERE reseller_id = ${reseller.id}
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // Get summary stats
    const inventoryStats = await safeQuery(() => sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'available') as available_count,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
        COALESCE(SUM(selling_price) FILTER (WHERE status = 'sold'), 0) as total_sold_value
      FROM reseller_inventory
      WHERE reseller_id = ${reseller.id}
    `);

    const salesStats = await safeQuery(() => sql`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(SUM(selling_price), 0) as total_revenue
      FROM reseller_sales
      WHERE reseller_id = ${reseller.id}
      AND status = 'completed'
    `);
    
    return NextResponse.json({
      success: true,
      inventory,
      sales,
      stats: {
        inventory: inventoryStats[0] || { available_count: 0, sold_count: 0, total_sold_value: 0 },
        sales: salesStats[0] || { total_sales: 0, total_profit: 0, total_revenue: 0 }
      }
    });
    
  } catch (error) {
    console.error("Reseller inventory GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Mark a card as sold
async function PATCHHandler(request: NextRequest) {
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
    
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(markSoldSchema, body);
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
    
    const { inventoryId, soldTo } = validation.data as {
      inventoryId: string;
      soldTo?: string;
    };

    const inventoryItem = await sql`
      SELECT id, status
      FROM reseller_inventory
      WHERE id = ${inventoryId} AND reseller_id = ${reseller.id}
      LIMIT 1
    `;

    if (!inventoryItem.length) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    if ((inventoryItem[0] as { status: string }).status === "sold") {
      return NextResponse.json({ success: false, error: "Card already sold" }, { status: 409 });
    }

    await sql`
      UPDATE reseller_inventory
      SET status = 'sold', sold_to = ${soldTo || null}, sold_at = NOW()
      WHERE id = ${inventoryId} AND reseller_id = ${reseller.id}
    `;
    
    await sql`
      UPDATE result_checker_cards
      SET status = 'sold', purchased_by = (
        SELECT id FROM users WHERE phone = ${soldTo} LIMIT 1
      ), purchased_at = NOW()
      WHERE id = (SELECT card_id FROM reseller_inventory WHERE id = ${inventoryId})
    `;
    
    return NextResponse.json({ success: true, message: "Card marked as sold" });
    
  } catch (error) {
    console.error("Reseller inventory PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export GET and PATCH with rate limiting
export const GET = withRateLimit({ type: "api" })(GETHandler);
export const PATCH = withRateLimit({ type: "api" })(PATCHHandler);
