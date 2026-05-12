import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyWebhookSignature, parseWebhook } from "@/lib/airalo"
import { getServerEnv } from "@/lib/env"

export const runtime = "nodejs"

// POST - Handle Airalo webhook events
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("x-airalo-signature") || ""
    
    const env = getServerEnv()
    const webhookSecret = env.AIRALO_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret)
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = parseWebhook(payload)
    console.log("Airalo webhook received:", event.event, event.data)

    switch (event.event) {
      case "order_completed": {
        // Order completed - update transaction status
        if (event.data.order_id) {
          const txRows = await sql`
            SELECT id, user_id, metadata FROM transactions
            WHERE metadata->>'airaloOrderId' = ${event.data.order_id}
            LIMIT 1
          `

          if (txRows.length > 0) {
            const tx = txRows[0]
            await sql`
              UPDATE transactions
              SET status = 'completed',
                  metadata = jsonb_set(
                    metadata,
                    '{airaloStatus}',
                    '"completed"'::jsonb
                  ),
                  updated_at = NOW()
              WHERE id = ${tx.id}
            `

            // Send email notification
            console.log(`eSIM order ${event.data.order_id} completed for user ${tx.user_id}`)
          }
        }
        break
      }

      case "order_failed": {
        // Order failed - refund if paid
        if (event.data.order_id) {
          const txRows = await sql`
            SELECT id, user_id, amount, payment_method, metadata FROM transactions
            WHERE metadata->>'airaloOrderId' = ${event.data.order_id}
            LIMIT 1
          `

          if (txRows.length > 0) {
            const tx = txRows[0]

            if (tx.payment_method === "WALLET") {
              // Refund to wallet
              await sql`BEGIN`
              try {
                await sql`
                  UPDATE users
                  SET wallet_balance = wallet_balance + ${tx.amount}
                  WHERE id = ${tx.user_id}
                `

                await sql`
                  UPDATE transactions
                  SET status = 'failed',
                      metadata = jsonb_set(
                        jsonb_set(
                          metadata,
                          '{airaloStatus}',
                          '"failed"'::jsonb
                        ),
                        '{refunded}',
                        'true'::jsonb
                      ),
                      updated_at = NOW()
                  WHERE id = ${tx.id}
                `

                await sql`COMMIT`
                console.log(`Refunded failed eSIM order ${event.data.order_id}`)
              } catch (err) {
                await sql`ROLLBACK`
                throw err
              }
            } else {
              await sql`
                UPDATE transactions
                SET status = 'failed',
                    metadata = jsonb_set(
                      metadata,
                      '{airaloStatus}',
                      '"failed"'::jsonb
                    ),
                    updated_at = NOW()
                WHERE id = ${tx.id}
              `
            }
          }
        }
        break
      }

      case "esim_low_data": {
        // eSIM running low on data - could notify user
        if (event.data.iccid) {
          console.log(`eSIM ${event.data.iccid} running low on data`)
          // TODO: Send notification to user
        }
        break
      }

      case "esim_zero_data": {
        // eSIM out of data - could notify user about top-up
        if (event.data.iccid) {
          console.log(`eSIM ${event.data.iccid} out of data`)
          // TODO: Send notification to user with top-up link
        }
        break
      }

      case "credit_limit_reached": {
        // Account credit limit reached - notify admin
        console.error("Airalo credit limit reached!")
        // TODO: Send admin alert
        break
      }

      default:
        console.log("Unhandled Airalo webhook event:", event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Airalo webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Webhook verification endpoint (for Airalo dashboard)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "Airalo webhook endpoint active",
    timestamp: new Date().toISOString(),
  })
}
