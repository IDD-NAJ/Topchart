import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get session token from cookies
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // Verify session and get user
    const sessions = await sql`
      SELECT s.user_id, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
      LIMIT 1
    `

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired - Please log in again" },
        { status: 401 }
      )
    }

    const userId = sessions[0].user_id
    const walletBalance = parseFloat(sessions[0].wallet_balance) || 0

    // Fetch transactions from database
    const transactions = await sql`
      SELECT 
        id,
        type,
        amount,
        status,
        description,
        created_at
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    // Calculate wallet statistics
    const totalDeposited = transactions
      .filter((tx: any) => tx.type === 'deposit' && tx.status === 'success')
      .reduce((acc: number, tx: any) => acc + (parseFloat(tx.amount) || 0), 0)

    const totalSpent = transactions
      .filter((tx: any) => tx.type !== 'deposit' && tx.status === 'success')
      .reduce((acc: number, tx: any) => acc + (parseFloat(tx.amount) || 0), 0)

    const pendingDeposits = transactions
      .filter((tx: any) => tx.type === 'deposit' && tx.status === 'pending')
      .reduce((acc: number, tx: any) => acc + (parseFloat(tx.amount) || 0), 0)

    // Get recent transactions (last 10)
    const recentTransactions = transactions
      .slice(0, 10)
      .map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount) || 0,
        status: tx.status,
        description: tx.description || tx.type,
        created_at: tx.created_at,
      }))

    return NextResponse.json({
      success: true,
      data: {
        balance: walletBalance,
        totalDeposited,
        totalSpent,
        pendingBalance: pendingDeposits,
        recentTransactions,
      },
    })
  } catch (error) {
    console.error("Wallet API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet data" },
      { status: 500 }
    )
  }
}
