import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { submitOrder, getOrder } from "@/lib/airalo"
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

// POST - Create an eSIM order
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, quantity = 1, paymentMethod, email, description } = body

    if (!packageId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get package details from local DB for pricing
    const localPackages = await sql`
      SELECT * FROM esim_data_packages WHERE id = ${packageId} LIMIT 1
    `

    if (localPackages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid package" },
        { status: 400 }
      )
    }

    const package_ = localPackages[0]
    const price = parseFloat(package_.price)
    const finalPrice = price * quantity

    const userRows = await sql`
      SELECT email, wallet_balance FROM users WHERE id = ${userId}
    `
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const userEmail = userRows[0].email
    const walletBalance = parseFloat(userRows[0].wallet_balance) || 0

    if (paymentMethod === "wallet") {
      if (walletBalance < finalPrice) {
        return NextResponse.json(
          { success: false, error: "Insufficient wallet balance" },
          { status: 400 }
        )
      }

      // Process order with Airalo
      const orderResult = await submitOrder({
        package_id: packageId,
        quantity,
        description: description || `eSIM order for ${package_.country}`,
      })

      // Deduct from wallet and create transaction
      await sql`BEGIN`

      try {
        await sql`
          UPDATE users SET wallet_balance = wallet_balance - ${finalPrice} WHERE id = ${userId}
        `

        const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

        await sql`
          INSERT INTO transactions (id, user_id, type, amount, status, description, payment_method, currency, metadata, created_at, updated_at)
          VALUES (
            ${txId}, ${userId}, 'esim_data', ${finalPrice}, 'completed', ${`eSIM: ${package_.country} ${package_.data_allowance}`},
            'WALLET', 'GHS',
            ${JSON.stringify({
              packageId,
              quantity,
              airaloOrderId: orderResult.data.id,
              iccid: orderResult.data.iccid,
              lpa: orderResult.data.lpa,
              qrcode: orderResult.data.qrcode,
              email,
            })}::jsonb,
            NOW(), NOW()
          )
        `

        await sql`COMMIT`

        return NextResponse.json({
          success: true,
          data: {
            orderId: txId,
            airaloOrderId: orderResult.data.id,
            iccid: orderResult.data.iccid,
            lpa: orderResult.data.lpa,
            qrcode: orderResult.data.qrcode,
            manualInstall: orderResult.data.manual_install,
          },
        })
      } catch (txError) {
        await sql`ROLLBACK`
        throw txError
      }
    }

    if (paymentMethod === "paystack") {
      const surcharge = Number((finalPrice * PAYSTACK_SURCHARGE).toFixed(2))
      const chargeAmount = Number((finalPrice + surcharge).toFixed(2))
      const reference = `ESIM-AL-${generatePaystackReference()}`

      const txId = `TX_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

      // Create pending transaction
      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, reference, description, payment_method, currency, fees, metadata, created_at, updated_at)
        VALUES (
          ${txId}, ${userId}, 'esim_data', ${finalPrice}, 'pending', ${reference}, ${`eSIM: ${package_.country} ${package_.data_allowance}`},
          'PAYSTACK', 'GHS', ${surcharge},
          ${JSON.stringify({
            packageId,
            quantity,
            email,
            surcharge,
            chargeAmount,
            pendingAiraloOrder: true,
          })}::jsonb,
          NOW(), NOW()
        )
      `

      const result = await initializePaystackTransaction(
        userEmail,
        Math.round(chargeAmount * 100),
        reference,
        { user_id: userId, transaction_type: "esim_data", package_id: packageId }
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

    return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 })
  } catch (error: any) {
    console.error("eSIM order error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process eSIM order" },
      { status: 500 }
    )
  }
}
