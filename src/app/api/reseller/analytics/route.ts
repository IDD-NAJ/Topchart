import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch reseller analytics data
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
    
    const safeQuery = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try { return await fn(); } catch { return []; }
    };

    const [dailyStats, geoStats, salesByCategory] = await Promise.all([
      safeQuery(() => sql`
        SELECT * FROM reseller_daily_stats
        WHERE reseller_id = ${reseller.id}
        AND date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date ASC
      `),
      safeQuery(() => sql`
        SELECT * FROM reseller_geographic_stats
        WHERE reseller_id = ${reseller.id}
        ORDER BY sales_amount DESC
      `),
      safeQuery(() => sql`
        SELECT
          exam_type as category,
          COUNT(*) as count,
          SUM(amount_paid) as total
        FROM result_checker_purchases
        WHERE user_id IN (
          SELECT id FROM users WHERE referred_by = ${reseller.reseller_code}
        )
        GROUP BY exam_type
      `),
    ]);

    const totalSales = dailyStats.reduce((sum: number, day: any) => sum + parseFloat(day.sales_amount || 0), 0);
    const totalCommission = dailyStats.reduce((sum: number, day: any) => sum + parseFloat(day.commission_earned || 0), 0);
    const totalReferrals = dailyStats.reduce((sum: number, day: any) => sum + (day.new_referrals || 0), 0);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalSales,
        totalCommission,
        totalReferrals,
        avgDailySales: dailyStats.length > 0 ? totalSales / dailyStats.length : 0
      },
      dailyStats,
      geographicStats: geoStats,
      salesByCategory,
      trends: {
        salesGrowth: calculateGrowth(dailyStats, 'sales_amount'),
        commissionGrowth: calculateGrowth(dailyStats, 'commission_earned')
      }
    });
    
  } catch (error) {
    console.error("Reseller analytics GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateGrowth(data: any[], field: string): number {
  if (data.length < 2) return 0;
  
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint);
  const secondHalf = data.slice(midPoint);
  
  const firstSum = firstHalf.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
  const secondSum = secondHalf.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
  
  if (firstSum === 0) return 0;
  return Math.round(((secondSum - firstSum) / firstSum) * 100);
}
