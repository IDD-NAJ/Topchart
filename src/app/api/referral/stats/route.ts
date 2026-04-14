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
    const [stats, qualifiedResult] = await Promise.all([
      sql`
        SELECT 
          COUNT(*) as total_referrals,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_referrals,
          COALESCE(SUM(referral_earnings), 0) as total_earnings
        FROM users
        WHERE referred_by = ${referralCode}
      `,
      sql`
        SELECT COUNT(DISTINCT u.id) as qualified_count
        FROM users u
        INNER JOIN transactions t ON t.user_id = u.id::text AND t.status = 'success'
        WHERE u.referred_by = ${referralCode}
      `,
    ])

    const result = stats[0] || {
      total_referrals: 0,
      recent_referrals: 0,
      total_earnings: 0
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          referralCode: referralCode,
          totalReferrals: parseInt(result.total_referrals),
          totalReferred: parseInt(result.total_referrals),
          recentReferrals: parseInt(result.recent_referrals),
          totalEarnings: parseFloat(result.total_earnings),
          qualifiedReferrals: parseInt(qualifiedResult[0]?.qualified_count ?? 0),
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
