import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM auth_sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const userId = sessions[0].user_id

    // Optimize: Run queries in parallel
    const [userRes, referredRes] = await Promise.all([
      sql`SELECT referral_code, referral_earnings FROM users WHERE id = ${userId}`,
      sql`
        SELECT 
          COUNT(*) as total_referred,
          COUNT(*) FILTER (WHERE total_deposits >= 15) as qualified_referrals
        FROM users
        WHERE referred_by = ${userId}
      `
    ])

    if (userRes.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = userRes[0]
    const referred = referredRes[0]

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referral_code,
        totalEarnings: parseFloat(user.referral_earnings || "0"),
        totalReferred: parseInt(referred.total_referred || "0"),
        qualifiedReferrals: parseInt(referred.qualified_referrals || "0"),
      },
    })
  } catch (error) {
    console.error("Referral stats error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
  }
}
