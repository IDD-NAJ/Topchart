import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { initializePaystackTransaction, generatePaystackReference } from "@/lib/paystack"

export const runtime = "nodejs"

const PAYSTACK_SURCHARGE = 0.05

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
    const { paymentMethod, email, planType, planId, packageId, amount, areaCode } = body

    if (!paymentMethod || !email || !amount || !planType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["wallet", "paystack"].includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 })
    }

    if (!["phone-number", "travel-data"].includes(planType)) {
      return NextResponse.json({ success: false, error: "Invalid plan type" }, { status: 400 })
    }

    const price = Number(amount)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    const transactionType = planType === "phone-number" ? "esim_phone" : "esim_data"
    const description = planType === "phone-number"
      ? `US phone number order (${planId})${areaCode && areaCode !== "random" ? ` - Area code ${areaCode}` : ""}`
      : `Travel data eSIM (${packageId})`

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
        const status = planType === "phone-number" ? "pending" : "completed"

        await sql`
          INSERT INTO transactions (id, user_id, type, amount, status, description, payment_method, currency, metadata, created_at, updated_at)
          VALUES (
            ${txId}, ${userId}, ${transactionType}, ${price}, ${status}, ${description},
            'WALLET', 'GHS',
            ${JSON.stringify({
              planType,
              planId: planId || null,
              packageId: packageId || null,
              email,
              areaCode: areaCode || null,
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
            status,
            message: planType === "phone-number"
              ? "Order received. Admin will assign your number shortly."
              : "eSIM order placed. QR code will be emailed shortly.",
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
      const reference = `ESIM-PS-${generatePaystackReference()}`

      const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
      const status = planType === "phone-number" ? "pending" : "pending"

      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, description, payment_method, currency, fees, metadata, created_at, updated_at)
        VALUES (
          ${txId}, ${userId}, ${transactionType}, ${price}, ${status}, ${reference}, ${description},
          'PAYSTACK', 'GHS', ${surcharge},
          ${JSON.stringify({
            planType,
            planId: planId || null,
            packageId: packageId || null,
            email,
            areaCode: areaCode || null,
            paymentMethod: "paystack",
            surcharge,
            chargeAmount,
          })}::jsonb,
          NOW(), NOW()
        )
      `

      const result = await initializePaystackTransaction(
        userEmail,
        Math.round(chargeAmount * 100),
        reference,
        { user_id: userId, transaction_type: transactionType, plan_type: planType, description }
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
    console.error("eSIM order error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process eSIM order" },
      { status: 500 }
    )
  }
}
