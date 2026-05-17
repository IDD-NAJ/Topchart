import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { initializePaystackTransaction, generatePaystackReference } from "@/lib/paystack"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"

const PAYSTACK_SURCHARGE = 0.05

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.id

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

        const txId = crypto.randomUUID()
        const status = "pending"

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

        const esimOrderId = crypto.randomUUID()
        try {
          if (planType === "phone-number") {
            await sql`
              INSERT INTO esim_orders (id, user_id, package_id, package_name, destination, validity_days, price, status, processing_status, transaction_reference, metadata, created_at, updated_at)
              VALUES (
                ${esimOrderId}, ${userId}, ${planId}, ${description}, ${areaCode === "random" ? "US" : areaCode}, 30, ${price}, 'pending', 'pending', ${txId},
                ${JSON.stringify({
                  planType,
                  planId,
                  email,
                  areaCode: areaCode || null,
                })}::jsonb,
                NOW(), NOW()
              )
            `
            console.log("Inserted esim_order for phone-number:", esimOrderId)
          } else {
            await sql`
              INSERT INTO esim_orders (id, user_id, package_id, package_name, destination, data_gb, validity_days, price, status, processing_status, transaction_reference, metadata, created_at, updated_at)
              VALUES (
                ${esimOrderId}, ${userId}, ${packageId}, ${description}, 'Various', 1, 30, ${price}, 'pending', 'pending', ${txId},
                ${JSON.stringify({
                  planType,
                  packageId,
                  email,
                })}::jsonb,
                NOW(), NOW()
              )
            `
            console.log("Inserted esim_order for travel-data:", esimOrderId)
          }
        } catch (esimError) {
          console.error("Failed to insert esim_order:", esimError)
          throw esimError
        }

        await sql`COMMIT`

        return NextResponse.json({
          success: true,
          data: {
            orderId: txId,
            status,
            message: "Order received. Admin will process your request and deliver your eSIM shortly."
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

      const txId = crypto.randomUUID()
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

      const esimOrderId = crypto.randomUUID()
      try {
        if (planType === "phone-number") {
          await sql`
            INSERT INTO esim_orders (id, user_id, package_id, package_name, destination, validity_days, price, status, processing_status, transaction_reference, metadata, created_at, updated_at)
            VALUES (
              ${esimOrderId}, ${userId}, ${planId}, ${description}, ${areaCode === "random" ? "US" : areaCode}, 30, ${price}, 'pending', 'pending', ${txId},
              ${JSON.stringify({
                planType,
                planId,
                email,
                areaCode: areaCode || null,
              })}::jsonb,
              NOW(), NOW()
            )
          `
          console.log("Inserted esim_order for phone-number (paystack):", esimOrderId)
        } else {
          await sql`
            INSERT INTO esim_orders (id, user_id, package_id, package_name, destination, data_gb, validity_days, price, status, processing_status, transaction_reference, metadata, created_at, updated_at)
            VALUES (
              ${esimOrderId}, ${userId}, ${packageId}, ${description}, 'Various', 1, 30, ${price}, 'pending', 'pending', ${txId},
              ${JSON.stringify({
                planType,
                packageId,
                email,
              })}::jsonb,
              NOW(), NOW()
            )
          `
          console.log("Inserted esim_order for travel-data (paystack):", esimOrderId)
        }
      } catch (esimError) {
        console.error("Failed to insert esim_order (paystack):", esimError)
        throw esimError
      }

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("eSIM order error details:", errorMessage)
    
    // Return more specific error message
    if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance. Please top up your wallet." },
        { status: 400 }
      )
    }
    
    if (errorMessage.includes("Paystack")) {
      return NextResponse.json(
        { success: false, error: "Payment initialization failed. Please try again or use a different payment method." },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to process eSIM order. Please try again." },
      { status: 500 }
    )
  }
}
