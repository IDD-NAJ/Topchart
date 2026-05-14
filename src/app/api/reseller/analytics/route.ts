import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch reseller analytics data with period support
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
    
    // Get period from query params (default 30 days)
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30d";
    const days = parseInt(period.replace("d", "")) || 30;
    
    const safeQuery = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try { return await fn(); } catch { return []; }
    };

    // Get daily stats from table (may be empty for new resellers)
    const dailyStats = await safeQuery(() => sql`
      SELECT * FROM reseller_daily_stats
      WHERE reseller_id = ${reseller.id}
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `);

    // Fallback: compute from actual sales if daily_stats is empty
    const salesSummary = await safeQuery(() => sql`
      SELECT 
        COALESCE(SUM(selling_price), 0) as total_sales,
        COALESCE(SUM(profit), 0) as total_profit,
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '${Math.floor(days/2)} days' THEN selling_price ELSE 0 END), 0) as recent_sales,
        COALESCE(SUM(CASE WHEN created_at < CURRENT_DATE - INTERVAL '${Math.floor(days/2)} days' THEN selling_price ELSE 0 END), 0) as older_sales
      FROM reseller_sales
      WHERE reseller_id = ${reseller.id}
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      AND status = 'completed'
    `);

    // Get commissions summary
    const commissionSummary = await safeQuery(() => sql`
      SELECT 
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '${Math.floor(days/2)} days' THEN commission_amount ELSE 0 END), 0) as recent_commission,
        COALESCE(SUM(CASE WHEN created_at < CURRENT_DATE - INTERVAL '${Math.floor(days/2)} days' THEN commission_amount ELSE 0 END), 0) as older_commission
      FROM reseller_commissions
      WHERE reseller_id = ${reseller.id}
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `);

    // Get geographic stats
    const geoStats = await safeQuery(() => sql`
      SELECT * FROM reseller_geographic_stats
      WHERE reseller_id = ${reseller.id}
      ORDER BY sales_amount DESC
    `);

    // Get sales by product type (from actual sales, not result_checker_purchases)
    const salesByCategory = await safeQuery(() => sql`
      SELECT
        product_type as category,
        COUNT(*) as count,
        COALESCE(SUM(selling_price), 0) as total
      FROM reseller_sales
      WHERE reseller_id = ${reseller.id}
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      AND status = 'completed'
      GROUP BY product_type
    `);

    // Get referral stats
    const referralStats = await safeQuery(() => sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE referred_by = ${reseller.reseller_code}
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `);

    // Calculate totals using both daily_stats (if exists) and computed from sales
    const tableTotalSales = dailyStats.reduce((sum: number, day: any) => sum + parseFloat(day.sales_amount || 0), 0);
    const tableTotalCommission = dailyStats.reduce((sum: number, day: any) => sum + parseFloat(day.commission_earned || 0), 0);
    const tableTotalReferrals = dailyStats.reduce((sum: number, day: any) => sum + (day.new_referrals || 0), 0);

    const computedTotalSales = parseFloat(salesSummary[0]?.total_sales || 0);
    const computedTotalProfit = parseFloat(salesSummary[0]?.total_profit || 0);
    const computedTotalCommission = parseFloat(commissionSummary[0]?.total_commission || 0);
    const computedTotalReferrals = parseInt(referralStats[0]?.count || 0);

    // Use whichever is higher (in case one source has data and other Last Namesn't)
    const totalSales = Math.max(tableTotalSales, computedTotalSales);
    const totalCommission = Math.max(tableTotalCommission, computedTotalCommission);
    const totalReferrals = Math.max(tableTotalReferrals, computedTotalReferrals);

    // Calculate growth from computed data
    const salesGrowth = calculateGrowthFromSums(
      parseFloat(salesSummary[0]?.older_sales || 0),
      parseFloat(salesSummary[0]?.recent_sales || 0)
    );
    const commissionGrowth = calculateGrowthFromSums(
      parseFloat(commissionSummary[0]?.older_commission || 0),
      parseFloat(commissionSummary[0]?.recent_commission || 0)
    );

    // Build daily stats from sales if table data is empty
    let finalDailyStats = dailyStats;
    if (dailyStats.length === 0 && computedTotalSales > 0) {
      finalDailyStats = await safeQuery(() => sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as sales_count,
          COALESCE(SUM(selling_price), 0) as sales_amount,
          COALESCE(SUM(profit), 0) as commission_earned,
          0 as new_referrals
        FROM reseller_sales
        WHERE reseller_id = ${reseller.id}
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);
    }

    // Get commission history
    const commissionHistory = await safeQuery(() => sql`
      SELECT 
        rc.*,
        u.first_name,
        u.last_name
      FROM reseller_commissions rc
      LEFT JOIN users u ON rc.referred_user_id = u.id
      WHERE rc.reseller_id = ${reseller.id}
      ORDER BY rc.created_at DESC
      LIMIT 20
    `);
    
    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalSales,
        totalCommission,
        totalReferrals,
        totalProfit: computedTotalProfit,
        avgDailySales: finalDailyStats.length > 0 ? totalSales / finalDailyStats.length : 0,
        transactionCount: parseInt(salesSummary[0]?.total_transactions || 0)
      },
      dailyStats: finalDailyStats,
      geographicStats: geoStats,
      salesByCategory,
      commissionHistory,
      trends: {
        salesGrowth,
        commissionGrowth
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

function calculateGrowthFromSums(olderSum: number, recentSum: number): number {
  if (olderSum === 0) return recentSum > 0 ? 100 : 0;
  return Math.round(((recentSum - olderSum) / olderSum) * 100);
}

// Legacy function for backwards compatibility
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
