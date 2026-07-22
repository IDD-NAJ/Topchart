import { NextRequest, NextResponse } from "next/server"
import { sql, sqlUnsafe } from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if table exists; if not, create it with defaults (self-healing singleton table)
    const tableExists = await sql`SELECT to_regclass('public.referral_settings')`;
    if (!tableExists[0].to_regclass) {
      // Attempt to create the table with defaults
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS referral_settings (
            id SERIAL PRIMARY KEY,
            referral_reward_amount DECIMAL(10, 2) DEFAULT 5.00,
            min_referrals_required INT DEFAULT 10,
            min_deposit_amount DECIMAL(10, 2) DEFAULT 20.00,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`
          INSERT INTO referral_settings (id, referral_reward_amount, min_referrals_required, min_deposit_amount)
          VALUES (1, 5.00, 10, 20.00)
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (createErr) {
        // If table creation fails, return defaults gracefully
        return NextResponse.json({
          success: true,
          data: { rewardAmount: 5.00, minInvites: 10, minDeposit: 20.00 },
          warning: "Using default referral settings. Database table not available.",
        })
      }
    }

    const rows = await sql`
      SELECT referral_reward_amount, min_referrals_required, min_deposit_amount
      FROM referral_settings
      WHERE id = 1
    `

    if (rows.length === 0) {
       return NextResponse.json({
         success: true,
         data: { rewardAmount: 5.00, minInvites: 10, minDeposit: 20.00 },
       })
    }

    return NextResponse.json({
      success: true,
      data: {
        rewardAmount: parseFloat(rows[0].referral_reward_amount),
        minInvites: parseInt(rows[0].min_referrals_required),
        minDeposit: parseFloat(rows[0].min_deposit_amount),
      },
    })
  } catch (error) {
    console.error("Referral settings GET error:", error)
    return NextResponse.json({ success: true, data: { rewardAmount: 5.00, minInvites: 10, minDeposit: 20.00 }, warning: "Using default referral settings." }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { rewardAmount, minInvites, minDeposit } = body

    let updates = []
    let values = []

    if (rewardAmount !== undefined && !isNaN(parseFloat(rewardAmount))) {
      updates.push(`referral_reward_amount = ${parseFloat(rewardAmount)}`)
    }
    if (minInvites !== undefined && !isNaN(parseInt(minInvites))) {
      updates.push(`min_referrals_required = ${parseInt(minInvites)}`)
    }
    if (minDeposit !== undefined && !isNaN(parseFloat(minDeposit))) {
      updates.push(`min_deposit_amount = ${parseFloat(minDeposit)}`)
    }

    if (updates.length > 0) {
      await sqlUnsafe(`
        INSERT INTO referral_settings (id, referral_reward_amount, min_referrals_required, min_deposit_amount)
        VALUES (1, 5.00, 10, 20.00)
        ON CONFLICT (id) DO UPDATE SET 
          ${updates.join(', ')},
          updated_at = NOW()
      `)
    }

    return NextResponse.json({ success: true, message: "Referral settings updated." })
  } catch (error) {
    console.error("Referral settings POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
