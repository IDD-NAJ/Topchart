import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Use getCurrentUser Server Action to properly authenticate
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const referralCode = user.referral_code || user.id.slice(0, 8).toUpperCase();

    // Get referral stats: total referred, qualified (made at least 1 successful tx), and earnings
    const [stats, earnings] = await Promise.all([
      sql`
        SELECT 
          COUNT(*) as total_referrals,
          SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as recent_referrals,
          SUM(CASE WHEN status IN ('qualified', 'rewarded') THEN 1 ELSE 0 END) as qualified_count
        FROM referrals
        WHERE referrer_id = ${user.id}
      `,
      sql`
        SELECT COALESCE(referral_earnings, 0) as total_earnings
        FROM users
        WHERE id = ${user.id}
      `,
    ])

    const result = stats[0] || {
      total_referrals: 0,
      recent_referrals: 0,
      qualified_count: 0
    }
    const total_earnings = earnings[0]?.total_earnings || 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          referralCode: referralCode,
          totalReferrals: parseInt(result.total_referrals) || 0,
          totalReferred: parseInt(result.total_referrals) || 0,
          recentReferrals: parseInt(result.recent_referrals) || 0,
          totalEarnings: parseFloat(total_earnings) || 0,
          qualifiedReferrals: parseInt(result.qualified_count) || 0,
        }
      },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
    )
  } catch (error: any) {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'error') {
      console.error("Referral stats error: ErrorEvent detected - ignoring");
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
    console.error("Referral stats error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
