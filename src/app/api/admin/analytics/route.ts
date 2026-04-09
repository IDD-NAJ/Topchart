import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const [
    resellerRows,
    salesRows,
    commissionRows,
    referralRows,
    fraudRows,
    topResellerRows,
    txByDayRows,
  ] = await Promise.all([
    safe(() => sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM reseller_profiles`, []),
    safe(() => sql`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM reseller_sales`, []),
    safe(() => sql`SELECT COALESCE(SUM(commission_amount),0)::numeric AS total FROM reseller_commissions`, []),
    safe(() => sql`SELECT COUNT(*)::int AS total FROM referrals`, []),
    safe(() => sql`SELECT COUNT(*)::int AS total FROM fraud_alerts WHERE status = 'open'`, []),
    safe(
      () => sql`
        SELECT rp.business_name, rp.reseller_code, rp.total_sales::numeric, rp.total_commission_earned::numeric, rp.status,
               u.email AS user_email,
               COALESCE(rp.total_referrals, 0)::int AS total_referrals
        FROM reseller_profiles rp
        JOIN users u ON u.id = rp.user_id
        ORDER BY rp.total_sales DESC NULLS LAST
        LIMIT 5
      `,
      []
    ),
    safe(
      () => sql`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::numeric AS total
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      []
    ),
  ]);

  const stats = {
    totalResellers: (resellerRows as any[])[0]?.total ?? 0,
    activeResellers: (resellerRows as any[])[0]?.active ?? 0,
    totalSales: Number((salesRows as any[])[0]?.total ?? 0),
    totalCommissions: Number((commissionRows as any[])[0]?.total ?? 0),
    totalReferrals: (referralRows as any[])[0]?.total ?? 0,
    fraudAlerts: (fraudRows as any[])[0]?.total ?? 0,
  };

  return NextResponse.json({
    success: true,
    stats,
    topResellers: topResellerRows,
    salesByDay: txByDayRows,
    salesByRegion: [],
  });
}
