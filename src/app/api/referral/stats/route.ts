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

    // Get referral stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_referrals,
        COALESCE(SUM(referral_earnings), 0) as total_earnings
      FROM users
      WHERE referred_by = ${user.referral_code}
    `

    const result = stats[0] || {
      total_referrals: 0,
      recent_referrals: 0,
      total_earnings: 0
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          totalReferrals: parseInt(result.total_referrals),
          recentReferrals: parseInt(result.recent_referrals),
          totalEarnings: parseFloat(result.total_earnings)
        }
      },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
    )
  } catch (error) {
    console.error("Referral stats error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
