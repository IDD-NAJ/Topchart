import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Reseller dashboard stats
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
    
    const resellerId = (profile[0] as { id: string }).id;
    
    const safeQuery = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try { return await fn(); } catch { return [{ total_sales: 0, total_amount: 0, total_profit: 0, total_commissions: 0, total_earned: 0, count: 0 }] as any[]; }
    };

    const [sales, commissions, inventory] = await Promise.all([
      safeQuery(() => sql`
        SELECT
          COUNT(*) as total_sales,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(profit), 0) as total_profit
        FROM reseller_sales
        WHERE reseller_id = ${resellerId}
      `),
      safeQuery(() => sql`
        SELECT
          COUNT(*) as total_commissions,
          COALESCE(SUM(commission_amount), 0) as total_earned
        FROM reseller_commissions
        WHERE reseller_id = ${resellerId}
      `),
      safeQuery(() => sql`
        SELECT COUNT(*) as count
        FROM reseller_inventory
        WHERE reseller_id = ${resellerId}
        AND status = 'available'
      `),
    ]);
    
    return NextResponse.json({
      success: true,
      profile: profile[0],
      stats: {
        sales: sales[0],
        commissions: commissions[0],
        inventory: inventory[0]
      }
    });
    
  } catch (error) {
    console.error("Reseller dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
