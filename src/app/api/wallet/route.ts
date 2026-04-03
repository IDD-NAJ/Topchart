import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify token and get user
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/me`, {
      headers: {
        Cookie: `auth_token=${token}`,
      },
    })

    if (!authResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const authData = await authResponse.json()
    
    if (!authData.success || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = authData.user.id

    // Fetch wallet data from transactions API
    const transactionsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/transactions?userId=${userId}`,
      {
        headers: {
          Cookie: `auth_token=${token}`,
        },
      }
    )

    let transactions: any[] = []
    if (transactionsResponse.ok) {
      const txData = await transactionsResponse.json()
      if (txData.success && txData.transactions) {
        transactions = txData.transactions
      }
    }

    // Calculate wallet statistics
    const totalDeposited = transactions
      .filter((tx: any) => tx.type === 'deposit' && tx.status === 'success')
      .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0)

    const totalSpent = transactions
      .filter((tx: any) => tx.type !== 'deposit' && tx.status === 'success')
      .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0)

    const balance = totalDeposited - totalSpent

    const pendingDeposits = transactions
      .filter((tx: any) => tx.type === 'deposit' && tx.status === 'pending')
      .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0)

    // Get recent wallet transactions
    const recentTransactions = transactions
      .filter((tx: any) => ['deposit', 'withdrawal', 'airtime', 'data'].includes(tx.type))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        created_at: tx.created_at,
      }))

    return NextResponse.json({
      success: true,
      data: {
        balance: Math.max(0, balance),
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
