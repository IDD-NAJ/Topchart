import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { initializePaystackTransaction, generatePaystackReference } from "@/lib/paystack"

export const runtime = "nodejs"

const PAYSTACK_SURCHARGE = 0.04

function generateGiftCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments = 4
  const segmentLength = 4
  const parts: string[] = []
  for (let s = 0; s < segments; s++) {
    let segment = ""
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    parts.push(segment)
  }
  return parts.join("-")
}

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
    const { cardId, denomination, amount, paymentMethod } = body

    if (!cardId || !denomination || !amount || !paymentMethod) {
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

      const code = generateGiftCode()
      await sql`BEGIN`

      try {
        await sql`
          UPDATE users SET wallet_balance = wallet_balance - ${price} WHERE id = ${userId}
        `

        const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

        await sql`
          INSERT INTO transactions (id, user_id, type, amount, status, description, payment_method, currency, metadata, created_at, updated_at)
          VALUES (
            ${txId}, ${userId}, 'giftcard', ${price}, 'completed', ${`Gift card: ${cardId} ₵${denomination}`},
            'WALLET', 'GHS',
            ${JSON.stringify({
              cardId,
              denomination,
              code,
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
            cardId,
            denomination,
            amount: price,
            status: "completed",
            code,
            message: "Gift card purchased successfully!",
          },
          code,
        })
      } catch (txError) {
        await sql`ROLLBACK`
        throw txError
      }
    }

    if (paymentMethod === "paystack") {
      const surcharge = Number((price * PAYSTACK_SURCHARGE).toFixed(2))
      const chargeAmount = Number((price + surcharge).toFixed(2))
      const reference = `GC-PS-${generatePaystackReference()}`

      const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, description, payment_method, currency, fees, metadata, created_at, updated_at)
        VALUES (
          ${txId}, ${userId}, 'giftcard', ${price}, 'pending', ${reference}, ${`Gift card: ${cardId} ₵${denomination}`},
          'PAYSTACK', 'GHS', ${surcharge},
          ${JSON.stringify({
            cardId,
            denomination,
            paymentMethod: "paystack",
            surcharge,
            chargeAmount,
            pendingGiftCard: true,
          })}::jsonb,
          NOW(), NOW()
        )
      `

      const baseUrl =
        request.headers.get("origin") ||
        (request.nextUrl && request.nextUrl.origin) ||
        process.env.NEXT_PUBLIC_APP_URL ||
        ""
      const callbackUrl = baseUrl ? `${baseUrl}/dashboard/giftcards/callback?reference=${reference}` : undefined

      const result = await initializePaystackTransaction(
        userEmail,
        Math.round(chargeAmount * 100),
        reference,
        { user_id: userId, transaction_type: "giftcard", card_id: cardId, denomination },
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
    console.error("Gift card purchase error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process gift card purchase" },
      { status: 500 }
    )
  }
}
