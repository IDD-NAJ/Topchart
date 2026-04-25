import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";
import { validatePaystackWebhook } from "@/lib/paystack-utils";
import { checkAndCreditReferrer } from "@/lib/referral-utils";

const AMOUNT_TOLERANCE_PCT = 0.02;

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
        SELECT id, status, type, amount, metadata
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
      };

      if (transaction.status === "success") {
        console.log(`[Paystack Webhook] Transaction ${reference} already processed, skipping`);
        return NextResponse.json({ received: true, skipped: true }, { status: 200 });
      }

      const expectedAmount = Number(transaction.amount);
      if (expectedAmount > 0 && Math.abs(paidAmount - expectedAmount) / expectedAmount > AMOUNT_TOLERANCE_PCT) {
        console.error(`[Paystack Webhook] Amount mismatch for ${reference}: expected ${expectedAmount}, got ${paidAmount}`);
        await sql`
          UPDATE transactions
          SET metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            amount_mismatch: true,
            expected_amount: expectedAmount,
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
          SET wallet_balance = wallet_balance + (SELECT amount FROM updated_tx),
              total_deposits = total_deposits + (SELECT amount FROM updated_tx)
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
