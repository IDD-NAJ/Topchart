import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth"
import {
  createProxyConnection,
  createSubUser,
  isNineProxyConfigured,
  ProxyType,
  SessionType,
  PROXY_TYPE_LABELS,
} from "@/lib/nineproxy"
import { initializePaystackTransaction, generatePaystackReference } from "@/lib/paystack"

export const runtime = "nodejs"

const PAYSTACK_SURCHARGE = 0.04

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value
  if (!sessionToken) return null

  const sessions = await sql`
    SELECT user_id FROM auth_sessions
    WHERE token = ${sessionToken} AND expires_at > NOW()
    LIMIT 1
  `
  return sessions.length > 0 ? String(sessions[0].user_id) : null
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!isNineProxyConfigured()) {
      return NextResponse.json(
        { success: false, error: "9Proxy not configured", state: "not_configured" },
        { status: 200 }
      )
    }

    const body = await request.json()
    const { proxyType, countryCode, quantity, sessionType, sessionTime, paymentMethod } = body

    if (!proxyType || !quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: proxyType, quantity" },
        { status: 400 }
      )
    }

    const parsedProxyType = Number(proxyType) as ProxyType
    if (!Object.values(ProxyType).includes(parsedProxyType)) {
      return NextResponse.json(
        { success: false, error: "Invalid proxyType. Must be 1 (Residential), 2 (Mobile), or 3 (Datacenter)" },
        { status: 400 }
      )
    }

    const parsedSessionType = Number(sessionType || SessionType.Rotation) as SessionType
    if (!Object.values(SessionType).includes(parsedSessionType)) {
      return NextResponse.json(
        { success: false, error: "Invalid sessionType. Must be 1 (Rotation) or 2 (Sticky)" },
        { status: 400 }
      )
    }

    const numQuantity = Number(quantity)
    const estimatedPrice = numQuantity * (parsedProxyType === ProxyType.Residential ? 2 : parsedProxyType === ProxyType.Mobile ? 3 : 1)
    const resolvedPayment = paymentMethod || "wallet"

    if (resolvedPayment === "wallet") {
      const userId = await getAuthenticatedUserId()
      if (!userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      const userRows = await sql`SELECT wallet_balance FROM users WHERE id = ${userId}`
      if (userRows.length === 0) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      const walletBalance = parseFloat(userRows[0].wallet_balance) || 0
      if (walletBalance < estimatedPrice) {
        return NextResponse.json(
          { success: false, error: "Insufficient wallet balance" },
          { status: 400 }
        )
      }

      await sql`UPDATE users SET wallet_balance = wallet_balance - ${estimatedPrice} WHERE id = ${userId}`

      const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, description, payment_method, currency, metadata, created_at, updated_at)
        VALUES (
          ${txId}, ${userId}, 'proxy', ${estimatedPrice}, 'completed',
          ${`Proxy order: ${PROXY_TYPE_LABELS[parsedProxyType]} × ${numQuantity} ports (${countryCode || "Any"})`},
          'WALLET', 'GHS',
          ${JSON.stringify({ proxyType: parsedProxyType, countryCode: countryCode || null, quantity: numQuantity, sessionType: parsedSessionType, paymentMethod: "wallet" })}::jsonb,
          NOW(), NOW()
        )
      `
    }

    if (resolvedPayment === "paystack") {
      const userId = await getAuthenticatedUserId()
      if (!userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      const surcharge = Number((estimatedPrice * PAYSTACK_SURCHARGE).toFixed(2))
      const chargeAmount = Number((estimatedPrice + surcharge).toFixed(2))
      const reference = `PROXY-PS-${generatePaystackReference()}`

      const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, description, payment_method, currency, fees, metadata, created_at, updated_at)
        VALUES (
          ${txId}, ${userId}, 'proxy', ${estimatedPrice}, 'pending', ${reference},
          ${`Proxy order: ${PROXY_TYPE_LABELS[parsedProxyType]} × ${numQuantity} ports (${countryCode || "Any"})`},
          'PAYSTACK', 'GHS', ${surcharge},
          ${JSON.stringify({ proxyType: parsedProxyType, countryCode: countryCode || null, quantity: numQuantity, sessionType: parsedSessionType, paymentMethod: "paystack", surcharge, chargeAmount })}::jsonb,
          NOW(), NOW()
        )
      `

      const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`
      const userEmail = userRows.length > 0 ? userRows[0].email : user.email

      const result = await initializePaystackTransaction(
        userEmail,
        Math.round(chargeAmount * 100),
        reference,
        { user_id: userId, transaction_type: "proxy" }
      )

      if (result.success && result.data) {
        await sql`
          UPDATE transactions
          SET paystack_access_code = ${result.data.access_code || null},
              paystack_authorization_url = ${result.data.authorization_url || null},
              updated_at = NOW()
          WHERE reference = ${reference}
        `

        return NextResponse.json({
          success: true,
          authorizationUrl: result.data.authorization_url,
          reference,
        })
      }

      await sql`UPDATE transactions SET status = 'failed', updated_at = NOW() WHERE reference = ${reference}`
      return NextResponse.json(
        { success: false, error: "Failed to initialize Paystack payment" },
        { status: 500 }
      )
    }

    const connectionResult = await createProxyConnection({
      proxyType: parsedProxyType,
      countryCode: countryCode || undefined,
      quantity: numQuantity,
      sessionType: parsedSessionType,
      sessionTime: sessionTime ? Number(sessionTime) : undefined,
    })

    const connection = connectionResult.result

    const userName = `tc_${user.id}_${Date.now()}`
    const password = `pw_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`

    let subUserResult = null
    try {
      const subUserRes = await createSubUser({
        userName,
        password,
        status: 1,
        note: `Topchart user ${user.email}`,
      })
      subUserResult = subUserRes.result
    } catch (err) {
      console.error("9Proxy sub-user creation failed (non-fatal):", err)
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: `PROXY-${Date.now()}`,
        connection: {
          id: connection.id,
          proxyType: connection.proxy_type,
          proxyTypeLabel: PROXY_TYPE_LABELS[connection.proxy_type as ProxyType] || "Unknown",
          countryCode: connection.country_code,
          startPort: connection.start_port,
          endPort: connection.end_port,
          sessionTime: connection.session_time,
        },
        credentials: subUserResult
          ? {
              username: userName,
              password,
            }
          : null,
        message: subUserResult
          ? "Proxy connection created with user:pass credentials."
          : "Proxy connection created. Use IP whitelist or configure auth separately.",
      },
    })
  } catch (error) {
    console.error("Proxy order error:", error)
    const message = error instanceof Error ? error.message : "Failed to process proxy order"
    const isNotConfigured = message.includes("9Proxy not configured") || message.includes("NINEPROXY_API_KEY")
    return NextResponse.json(
      {
        success: false,
        error: message,
        state: isNotConfigured ? "not_configured" : undefined,
      },
      { status: isNotConfigured ? 200 : 500 }
    )
  }
}
