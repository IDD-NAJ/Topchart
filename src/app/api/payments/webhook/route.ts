export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";
import { validatePaystackWebhook } from "@/lib/paystack-utils";
import { checkAndCreditReferrer } from "@/lib/referral-utils";
import {
  createProxyConnection,
  createSubUser,
  ProxyType,
  PROXY_TYPE_LABELS,
} from "@/lib/nineproxy";

const AMOUNT_TOLERANCE_PCT = 0.02;

const SERVICE_PURCHASE_TYPES = new Set([
  "data",
  "bill_payment",
  "giftcard",
  "esim_data",
  "esim_phone",
  "proxy",
  "verification_str",
  "verification_ltr",
]);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    if (!validatePaystackWebhook(rawBody, signature)) {
      console.error("[Paystack Webhook] Signature validation failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("[Paystack Webhook] Event received:", event.event);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const paidAmount = data.amount / 100;
      const userId = data.metadata?.user_id;

      const existingTx = await sql`
        SELECT id, status, type, amount, metadata, user_id
        FROM transactions
        WHERE reference = ${reference}
        LIMIT 1
      `;

      if (existingTx.length === 0) {
        console.warn(`[Paystack Webhook] Transaction ${reference} not found in DB`);
        return NextResponse.json({ received: true, warning: "Transaction not found" }, { status: 200 });
      }

      const transaction = existingTx[0] as {
        id: string;
        status: string;
        amount: number | string;
        type?: string;
        metadata?: Record<string, unknown>;
        user_id?: string;
      };

      if (transaction.status === "success" || transaction.status === "completed") {
        console.log(`[Paystack Webhook] Transaction ${reference} already processed, skipping`);
        return NextResponse.json({ received: true, skipped: true }, { status: 200 });
      }

      const expectedAmount = Number(transaction.amount);
      // Paystack is charged amount + surcharge (fees). Compare the paid amount
      // against the actual charge amount, not the base wallet-credit amount.
      const metaChargeAmount = Number(
        (transaction.metadata as Record<string, unknown> | undefined)?.charge_amount ?? 0
      );
      const expectedCharge =
        metaChargeAmount > 0 ? metaChargeAmount : expectedAmount;
      if (expectedCharge > 0 && Math.abs(paidAmount - expectedCharge) / expectedCharge > AMOUNT_TOLERANCE_PCT) {
        console.error(`[Paystack Webhook] Amount mismatch for ${reference}: expected charge ${expectedCharge}, got ${paidAmount}`);
        await sql`
          UPDATE transactions
          SET metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            amount_mismatch: true,
            expected_amount: expectedCharge,
            paid_amount: paidAmount,
            flagged_at: new Date().toISOString(),
          })}::jsonb
          WHERE reference = ${reference}
        `;
        return NextResponse.json({ received: true, warning: "Amount mismatch - flagged for review" }, { status: 200 });
      }

      const paymentType = String(
        transaction.metadata?.payment_type || transaction.type || ""
      ).toLowerCase();

      if (paymentType === "reseller_application") {
        console.log(`[Paystack Webhook] Processing reseller application payment: ${reference}`);
        try {
          await finalizeResellerApplicationPayment({
            reference,
            transactionId: transaction.id,
            paystackData: data,
            actor: "system",
            reason: "paystack_webhook_charge_success",
          });
        } catch (err) {
          console.error(`[Paystack Webhook] Reseller finalization failed for ${reference}:`, err);
        }
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const isServicePurchase = SERVICE_PURCHASE_TYPES.has(paymentType);
      const txUserId = userId || transaction.user_id;

      if (isServicePurchase && (transaction.status === "failed" || transaction.status === "refunded")) {
        const alreadyRefunded = transaction.metadata?.refunded_to_wallet === true;

        if (alreadyRefunded) {
          console.log(`[Paystack Webhook] Service purchase ${reference} already refunded to wallet, skipping`);
          await sql`
            UPDATE transactions
            SET metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              webhook_at: new Date().toISOString(),
              paystack_id: data.id,
              webhook_note: "Paystack confirmed success; wallet already credited by verify route",
            })}::jsonb,
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
          return NextResponse.json({ received: true, already_refunded: true }, { status: 200 });
        }

        console.log(`[Paystack Webhook] Service purchase ${reference} failed but Paystack succeeded — crediting wallet`);
        try {
          await sql`
            UPDATE transactions
            SET status = 'refunded',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  webhook_at: new Date().toISOString(),
                  paystack_id: data.id,
                  paid_at: data.paid_at,
                  channel: data.channel,
                  gateway_response: data.gateway_response,
                  refunded_to_wallet: true,
                  refund_amount: expectedAmount,
                  refund_reason: "Paystack payment succeeded but service delivery failed — credited to wallet",
                })}::jsonb,
                payment_channel = ${data.channel},
                paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                updated_at = NOW()
            WHERE reference = ${reference}
          `;

          if (txUserId) {
            await sql`
              UPDATE users
              SET wallet_balance = wallet_balance + ${expectedAmount}
              WHERE id::text = ${String(txUserId)}
            `;
            console.log(`[Paystack Webhook] Credited GHS ${expectedAmount} to wallet for user ${txUserId} (ref: ${reference})`);
          }
        } catch (dbError) {
          console.error(`[Paystack Webhook] DB error crediting wallet for failed service ${reference}:`, dbError);
        }
        return NextResponse.json({ received: true, refunded_to_wallet: true }, { status: 200 });
      }

      // Auto-finalize giftcards on Paystack success
      if ((paymentType === "giftcard") && transaction.status === "pending") {
        try {
          const meta = (transaction.metadata || {}) as Record<string, unknown>;
          let code: string | undefined = typeof meta.code === "string" ? meta.code : undefined;
          if (!code) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            const seg = () => Array.from({ length: 4 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
            code = `${seg()}-${seg()}-${seg()}-${seg()}`;
          }
          await sql`
            UPDATE transactions
            SET status = 'completed',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  giftcard_code: null,
                })}::jsonb,
                payment_channel = ${data.channel},
                card_type = ${data.authorization?.card_type},
                card_last4 = ${data.authorization?.last4},
                bank_name = ${data.authorization?.bank},
                paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                ip_address = ${data.ip_address},
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
          await sql`
            UPDATE transactions
            SET metadata = metadata || jsonb_build_object('code', ${code}, 'paystack_id', ${data.id}, 'gateway_response', ${data.gateway_response})
            WHERE reference = ${reference}
          `;
        } catch (dbError) {
          console.error(`[Paystack Webhook] Giftcard finalize error ${reference}:`, dbError);
        }
        return NextResponse.json({ received: true, giftcard_completed: true }, { status: 200 });
      }

      // Auto-finalize bills on Paystack success
      if ((paymentType === "bill_payment") && transaction.status === "pending") {
        try {
          const receipt = `RCT-${Date.now()}`;
          await sql`
            UPDATE transactions
            SET status = 'completed',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  receipt: null,
                })}::jsonb,
                payment_channel = ${data.channel},
                card_type = ${data.authorization?.card_type},
                card_last4 = ${data.authorization?.last4},
                bank_name = ${data.authorization?.bank},
                paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                ip_address = ${data.ip_address},
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
          await sql`
            UPDATE transactions
            SET metadata = metadata || jsonb_build_object('receipt', ${receipt}, 'paystack_id', ${data.id}, 'gateway_response', ${data.gateway_response})
            WHERE reference = ${reference}
          `;
        } catch (dbError) {
          console.error(`[Paystack Webhook] Bill finalize error ${reference}:`, dbError);
        }
        return NextResponse.json({ received: true, bill_completed: true }, { status: 200 });
      }

      if (isServicePurchase && transaction.status === "pending") {
        console.log(`[Paystack Webhook] Service purchase ${reference} is pending — processing fulfillment`);
        
        // Handle proxy purchases specially - create the proxy connection
        if (paymentType === "proxy") {
          try {
            const proxyMetadata = transaction.metadata as {
              proxyType?: number;
              countryCode?: string | null;
              quantity?: number;
              sessionType?: number;
              sessionTime?: number;
            };
            
            const parsedProxyType = (proxyMetadata.proxyType || 1) as ProxyType;
            const parsedSessionType = (proxyMetadata.sessionType || 1) as number;
            const numQuantity = proxyMetadata.quantity || 1;
            
            const connectionResult = await createProxyConnection({
              proxyType: parsedProxyType,
              countryCode: proxyMetadata.countryCode || undefined,
              quantity: numQuantity,
              sessionType: parsedSessionType,
              sessionTime: proxyMetadata.sessionTime,
            });
            
            const connection = connectionResult.result;
            
            // Create sub-user for credentials
            const userName = `tc_${txUserId}_${Date.now()}`;
            const password = `pw_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
            
            let subUserResult = null;
            try {
              const subUserRes = await createSubUser({
                userName,
                password,
                status: 1,
                note: `Topchart user via Paystack payment ${reference}`,
              });
              subUserResult = subUserRes.result;
            } catch (err) {
              console.error("9Proxy sub-user creation failed (non-fatal):", err);
            }
            
            // Update transaction with connection details and mark as completed
            await sql`
              UPDATE transactions
              SET status = 'completed',
                  metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                    webhook_at: new Date().toISOString(),
                    paystack_id: data.id,
                    paid_at: data.paid_at,
                    channel: data.channel,
                    gateway_response: data.gateway_response,
                    paystack_confirmed: true,
                    proxy_connection: {
                      id: connection.id,
                      proxyType: connection.proxy_type,
                      proxyTypeLabel: PROXY_TYPE_LABELS[connection.proxy_type as ProxyType] || "Unknown",
                      countryCode: connection.country_code,
                      startPort: connection.start_port,
                      endPort: connection.end_port,
                      sessionTime: connection.session_time,
                    },
                    credentials: subUserResult ? { username: userName, password } : null,
                  })}::jsonb,
                  payment_channel = ${data.channel},
                  paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                  updated_at = NOW()
              WHERE reference = ${reference}
            `;
            
            console.log(`[Paystack Webhook] Proxy connection created for ${reference}`);
            return NextResponse.json({ received: true, proxy_created: true }, { status: 200 });
          } catch (proxyError) {
            console.error(`[Paystack Webhook] Proxy creation failed for ${reference}:`, proxyError);
            // Credit wallet as fallback
            await sql`
              UPDATE transactions
              SET status = 'refunded',
                  metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                    webhook_at: new Date().toISOString(),
                    paystack_id: data.id,
                    paid_at: data.paid_at,
                    channel: data.channel,
                    gateway_response: data.gateway_response,
                    proxy_creation_failed: true,
                    refunded_to_wallet: true,
                })}::jsonb,
                  payment_channel = ${data.channel},
                  paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                  updated_at = NOW()
              WHERE reference = ${reference}
            `;
            
            if (txUserId) {
              await sql`
                UPDATE users
                SET wallet_balance = wallet_balance + ${expectedAmount}
                WHERE id::text = ${String(txUserId)}
              `;
              console.log(`[Paystack Webhook] Credited GHS ${expectedAmount} to wallet for failed proxy creation (ref: ${reference})`);
            }
            return NextResponse.json({ received: true, refunded: true, error: "Proxy creation failed" }, { status: 200 });
          }
        }
        
        // eSIM orders: mark order as processing after Paystack success
        if (paymentType === 'esim_phone' || paymentType === 'esim_data') {
          try {
            await sql`
              UPDATE esim_orders
              SET processing_status = 'processing', updated_at = NOW()
              WHERE transaction_reference = ${transaction.id}
            `;
          } catch (esimErr) {
            console.error(`[Paystack Webhook] eSIM processing update failed for ${reference}:`, esimErr);
          }
        }

        // For other service purchases, update status to success and metadata
        try {
          await sql`
            UPDATE transactions
            SET status = 'success',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              webhook_at: new Date().toISOString(),
              paystack_id: data.id,
              paid_at: data.paid_at,
              channel: data.channel,
              gateway_response: data.gateway_response,
              paystack_confirmed: true,
            })}::jsonb,
                payment_channel = ${data.channel},
                paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
        } catch (dbError) {
          console.error(`[Paystack Webhook] DB error updating pending service ${reference}:`, dbError);
        }
        return NextResponse.json({ received: true, service_success: true }, { status: 200 });
      }

      console.log(`[Paystack Webhook] Processing wallet deposit: ${reference}, amount: ${paidAmount}`);

      try {
        await sql`
          WITH updated_tx AS (
            UPDATE transactions
            SET status = 'success',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  webhook_at: new Date().toISOString(),
                  paystack_id: data.id,
                  paid_at: data.paid_at,
                  channel: data.channel,
                  gateway_response: data.gateway_response,
                  customer_email: data.customer?.email,
                })}::jsonb,
                payment_channel = ${data.channel},
                card_type = ${data.authorization?.card_type},
                card_last4 = ${data.authorization?.last4},
                bank_name = ${data.authorization?.bank},
                paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                ip_address = ${data.ip_address},
                updated_at = NOW()
            WHERE reference = ${reference}
              AND status != 'success'
            RETURNING user_id, amount
          )
          UPDATE users
          SET wallet_balance = COALESCE(wallet_balance, 0) + (SELECT amount FROM updated_tx),
              total_deposits = COALESCE(total_deposits, 0) + (SELECT amount FROM updated_tx)
          WHERE id::text = (SELECT user_id FROM updated_tx)
            AND EXISTS (SELECT 1 FROM updated_tx)
        `;

        if (userId) {
          await checkAndCreditReferrer(userId, paidAmount);
        }
      } catch (dbError) {
        console.error(`[Paystack Webhook] DB error for ${reference}:`, dbError);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Paystack Webhook] Processing error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ received: true, error: "Processing failed - will reconcile" }, { status: 200 });
  }
}
