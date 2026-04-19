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

    // Check minimum invites setting (default 10)
    const settingsRows = await sql`SELECT value FROM app_settings WHERE key = 'referral_min_invites'`
    const minInvites = settingsRows.length && settingsRows[0].value ? parseInt(settingsRows[0].value) : 10

    // Fetch current state for informative error messages
    const userRows = await sql`
      SELECT qualified_referral_count, referral_reward_balance
      FROM users WHERE id = ${user.id}
    `
    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const qualifiedCount = parseInt(userRows[0].qualified_referral_count ?? 0)
    const rewardBalance = parseFloat(userRows[0].referral_reward_balance ?? "0")

    if (qualifiedCount < minInvites) {
      return NextResponse.json(
        {
          success: false,
          error: `You need ${minInvites - qualifiedCount} more qualified referral(s) to withdraw. You have ${qualifiedCount}/${minInvites}.`,
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

    // Atomic update to prevent race conditions (double-spend)
    const updateResult = await sql`
      UPDATE users
      SET wallet_balance = wallet_balance + referral_reward_balance,
          referral_reward_balance = 0,
          updated_at = NOW()
      WHERE id = ${user.id} 
        AND referral_reward_balance > 0 
        AND qualified_referral_count >= ${minInvites}
      RETURNING wallet_balance as "newWalletBalance", (wallet_balance - referral_reward_balance) as "previousWalletBalance", ${rewardBalance} as "withdrawnAmount"
    `

    if (updateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Withdrawal failed. Your balance may have already been processed." },
        { status: 400 }
      )
    }

    const withdrawnAmount = updateResult[0].withdrawnAmount
    const newWalletBalance = updateResult[0].newWalletBalance

    // Log as a transaction
    const ref = `REF-WITHDRAW-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`
    await sql`
      INSERT INTO transactions (id, type, status, amount, user_id, reference, description, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        'referral_withdrawal',
        'success',
        ${withdrawnAmount},
        ${user.id}::text,
        ${ref},
        ${'Referral reward withdrawal (' + qualifiedCount + ' qualified referrals)'},
        NOW(),
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: `GH₵${parseFloat(withdrawnAmount).toFixed(2)} has been transferred to your wallet.`,
      newWalletBalance: parseFloat(newWalletBalance ?? 0),
    })
  } catch (error) {
    console.error("Referral withdraw error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
