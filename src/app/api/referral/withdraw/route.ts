import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userRows = await sql`
      SELECT qualified_referral_count, referral_reward_balance
      FROM users WHERE id = ${user.id}
    `
    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const qualifiedCount = parseInt(userRows[0].qualified_referral_count ?? 0)
    const rewardBalance = parseFloat(userRows[0].referral_reward_balance ?? "0")

    if (qualifiedCount < 10) {
      return NextResponse.json(
        {
          success: false,
          error: `You need ${10 - qualifiedCount} more qualified referral(s) to withdraw. You have ${qualifiedCount}/10.`,
        },
        { status: 400 }
      )
    }

    if (rewardBalance <= 0) {
      return NextResponse.json(
        { success: false, error: "No referral reward balance to withdraw." },
        { status: 400 }
      )
    }

    // Move referral_reward_balance -> wallet_balance, reset reward balance
    await sql`
      UPDATE users
      SET wallet_balance = wallet_balance + ${rewardBalance},
          referral_reward_balance = 0,
          updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Log as a transaction
    const ref = `REF-WITHDRAW-${Date.now()}`
    await sql`
      INSERT INTO transactions (id, type, status, amount, user_id, reference, description, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        'referral_withdrawal',
        'success',
        ${rewardBalance},
        ${user.id}::text,
        ${ref},
        ${'Referral reward withdrawal (' + qualifiedCount + ' qualified referrals)'},
        NOW(),
        NOW()
      )
    `

    const updatedUser = await sql`
      SELECT wallet_balance FROM users WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: `GH₵${rewardBalance.toFixed(2)} has been transferred to your wallet.`,
      newWalletBalance: parseFloat(updatedUser[0]?.wallet_balance ?? 0),
    })
  } catch (error) {
    console.error("Referral withdraw error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
