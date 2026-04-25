import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getAccountInfo, getBalanceData, isNineProxyConfigured } from "@/lib/nineproxy"

export const runtime = "nodejs"

function getNineProxyResponseMeta(error?: string) {
  const message = error || "Failed to fetch 9Proxy balance"
  const isNotConfigured =
    message.includes("9Proxy not configured") ||
    message.includes("NINEPROXY_API_KEY")

  return {
    error: message,
    state: isNotConfigured ? "not_configured" : "disconnected",
    status: isNotConfigured ? 200 : 502,
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    if (!isNineProxyConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "9Proxy not configured. Set NINEPROXY_API_KEY in your environment.",
          state: "not_configured",
        },
        { status: 200 }
      )
    }

    const [accountRes, balanceRes] = await Promise.all([
      getAccountInfo(),
      getBalanceData(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        account: accountRes.result,
        balance: balanceRes.result,
      },
    })
  } catch (error) {
    console.error("9Proxy balance check error:", error)
    const meta = getNineProxyResponseMeta(
      error instanceof Error ? error.message : undefined
    )
    return NextResponse.json(
      {
        success: false,
        error: meta.error,
        state: meta.state,
      },
      { status: meta.state === "not_configured" ? meta.status : 500 }
    )
  }
}
