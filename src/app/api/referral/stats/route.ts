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

    let visitData = { total_visits: 0, recent_visits: 0, converted_count: 0 };
    let rewardData = { total_rewards: 0, total_reward_amount: 0 };
    let total_earnings = 0;

    try {
      const [visits, rewards, earnings] = await Promise.all([
        sql`
          SELECT
            COUNT(*) as total_visits,
            SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as recent_visits,
            SUM(CASE WHEN converted THEN 1 ELSE 0 END) as converted_count
          FROM referral_visits
          WHERE referral_code = ${referralCode}
        `,
        sql`
          SELECT
            COUNT(*) as total_rewards,
            COALESCE(SUM(reward_amount), 0) as total_reward_amount
          FROM referral_rewards
          WHERE referrer_id = ${user.id}
        `,
        sql`
          SELECT COALESCE(referral_earnings, 0) as total_earnings
          FROM users
          WHERE id = ${user.id}
        `,
      ]);
      visitData = visits[0] || visitData;
      rewardData = rewards[0] || rewardData;
      total_earnings = earnings[0]?.total_earnings || 0;
    } catch (dbError: any) {
      const msg = dbError?.message || "";
      if (msg.includes("does not exist") || msg.includes("does not exist") || msg.includes("relation")) {
        // Tables not yet created — return zeros
      } else {
        throw dbError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          referralCode: referralCode,
          totalReferrals: Number(visitData.converted_count) || 0,
          totalReferred: Number(visitData.converted_count) || 0,
          recentReferrals: Number(visitData.recent_visits) || 0,
          totalEarnings: Number(total_earnings) || 0,
          qualifiedReferrals: Number(rewardData.total_rewards) || 0,
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
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
