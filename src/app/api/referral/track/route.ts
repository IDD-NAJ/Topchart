import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()
    
    if (!referralCode) {
      return NextResponse.json({ success: false, error: "Missing referral code" }, { status: 400 })
    }

    const referrer = await sql`
      SELECT id, referral_code FROM users WHERE referral_code = ${referralCode.toUpperCase()}
    `

    if (referrer.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid referral code" }, { status: 404 })
    }

    const referrerId = referrer[0].id
    const visitorIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.headers.get("x-real-ip") || 
                      "unknown"
    const userAgent = request.headers.get("user-agent") || ""

    const existingVisit = await sql`
      SELECT id FROM referral_visits 
      WHERE referrer_id = ${referrerId} 
        AND visitor_ip = ${visitorIp}
        AND created_at > NOW() - INTERVAL '24 hours'
    `

    if (existingVisit.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Visit already tracked",
        referrerId,
        referralCode: referralCode.toUpperCase()
      })
    }

    await sql`
      INSERT INTO referral_visits (referrer_id, visitor_ip, visitor_user_agent, credited, amount_credited)
      VALUES (${referrerId}, ${visitorIp}, ${userAgent}, false, 0)
    `

    return NextResponse.json({ 
      success: true, 
      message: "Visit tracked",
      referrerId,
      referralCode: referralCode.toUpperCase()
    })
  } catch (error) {
    console.error("Referral track error:", error)
    return NextResponse.json({ success: false, error: "Failed to track visit" }, { status: 500 })
  }
}
