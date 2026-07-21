export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
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
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { providerId, accountNumber, amount, paymentMethod } = body

    if (!providerId || !accountNumber || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["wallet", "paystack"].includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 })
    }

    const price = Number(amount)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    const userRows = await sql`
      SELECT email, wallet_balance FROM users WHERE id = ${userId}
    `
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const userEmail = userRows[0].email
    const walletBalance = parseFloat(userRows[0].wallet_balance) || 0

    if (paymentMethod === "wallet") {
      if (walletBalance < price) {
        return NextResponse.json(
          { success: false, error: "Insufficient wallet balance" },
          { status: 400 }
        )
      }

      await sql`BEGIN`

      try {
        await sql`
          UPDATE users SET wallet_balance = wallet_balance - ${price} WHERE id = ${userId}
        `

        const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
        const receipt = `RCT-${Date.now()}`

        await sql`
          INSERT INTO transactions (id, user_id, type, amount, status, description, payment_method, currency, metadata, created_at, updated_at)
          VALUES (
            ${txId}, ${userId}, 'bill_payment', ${price}, 'completed', ${`Bill payment: ${providerId} (${accountNumber})`},
            'WALLET', 'GHS',
            ${JSON.stringify({
              providerId,
              accountNumber,
              receipt,
              paymentMethod: "wallet",
            })}::jsonb,
            NOW(), NOW()
          )
        `

        await sql`COMMIT`

        return NextResponse.json({
          success: true,
          data: {
            orderId: txId,
            providerId,
            accountNumber,
            amount: price,
            status: "completed",
            receipt,
            message: "Bill payment completed successfully. A receipt has been sent to your email.",
          },
        })
      } catch (txError) {
        await sql`ROLLBACK`
        throw txError
      }
    }

    if (paymentMethod === "paystack") {
      const surcharge = Number((price * PAYSTACK_SURCHARGE).toFixed(2))
      const chargeAmount = Number((price + surcharge).toFixed(2))
      const reference = `BILL-PS-${generatePaystackReference()}`

      const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, description, payment_method, currency, fees, metadata, created_at, updated_at)
        VALUES (
          ${txId}, ${userId}, 'bill_payment', ${price}, 'pending', ${reference}, ${`Bill payment: ${providerId} (${accountNumber})`},
          'PAYSTACK', 'GHS', ${surcharge},
          ${JSON.stringify({
            providerId,
            accountNumber,
            paymentMethod: "paystack",
            surcharge,
            chargeAmount,
            pendingBillPayment: true,
          })}::jsonb,
          NOW(), NOW()
        )
      `

      const baseUrl =
        request.headers.get("origin") ||
        (request.nextUrl && request.nextUrl.origin) ||
        process.env.NEXT_PUBLIC_APP_URL ||
        ""
      const callbackUrl = baseUrl ? `${baseUrl}/dashboard/bills/callback?reference=${reference}` : undefined

      const result = await initializePaystackTransaction(
        userEmail,
        Math.round(chargeAmount * 100),
        reference,
        { user_id: userId, transaction_type: "bill_payment", provider_id: providerId, account_number: accountNumber },
        callbackUrl
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

      await sql`
        UPDATE transactions SET status = 'failed', updated_at = NOW() WHERE reference = ${reference}
      `

      return NextResponse.json(
        { success: false, error: "Failed to initialize Paystack payment" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: false, error: "Invalid state" }, { status: 400 })
  } catch (error) {
    console.error("Bill payment error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process bill payment" },
      { status: 500 }
    )
  }
}
