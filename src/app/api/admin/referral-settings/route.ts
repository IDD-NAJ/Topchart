import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const rows = await sql`
      SELECT key, value FROM app_settings
      WHERE key IN ('referral_reward_amount', 'referral_min_invites')
    `

    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }

    return NextResponse.json({
      success: true,
      data: {
        rewardAmount: parseFloat(settings["referral_reward_amount"] || "5.00"),
        minInvites: parseInt(settings["referral_min_invites"] || "10"),
      },
    })
  } catch (error) {
    console.error("Referral settings GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { rewardAmount, minInvites } = body

    if (rewardAmount !== undefined) {
      const amount = parseFloat(rewardAmount)
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json({ success: false, error: "Invalid reward amount" }, { status: 400 })
      }
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('referral_reward_amount', ${String(amount)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${String(amount)}, updated_at = NOW()
      `
    }

    if (minInvites !== undefined) {
      const invites = parseInt(minInvites)
      if (isNaN(invites) || invites < 1) {
        return NextResponse.json({ success: false, error: "Invalid min invites" }, { status: 400 })
      }
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('referral_min_invites', ${String(invites)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${String(invites)}, updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true, message: "Referral settings updated." })
  } catch (error) {
    console.error("Referral settings POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
