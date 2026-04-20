import { NextRequest, NextResponse } from "next/server";
import { sql, withTransaction } from "@/lib/db";
import { logServiceEvent } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return signature === expected;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-datamart-signature") || "";
    const event = request.headers.get("x-datamart-event") || "";

    const webhookSecret = process.env.DATAMART_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        logServiceEvent("datamart", "webhook", "failed", { event, reason: "invalid_signature", correlationId });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const eventType = payload.event || event;
    const data = (payload.data || {}) as Record<string, unknown>;

    logServiceEvent("datamart", "webhook", "started", {
      event: eventType,
      orderReference: data.orderReference,
      status: data.status,
      correlationId,
    });

    const orderReference = data.orderReference as string;
    const orderStatus = String(data.status || "").toLowerCase();

    if (orderReference) {
      const txRows = await sql`
        SELECT reference, status, amount, user_id, metadata
        FROM transactions
        WHERE metadata->>'provider_order_ref' = ${orderReference}
           OR metadata->>'provider_order_id' = ${orderReference}
        LIMIT 1
      `;

      if (txRows.length > 0) {
        const tx = txRows[0];

        if (orderStatus === "completed" && tx.status !== "success") {
          await sql`
            UPDATE transactions
            SET status = 'success',
                metadata = metadata || ${JSON.stringify({
                  state: "success",
                  provider_confirmed_at: new Date().toISOString(),
                  webhook_event: eventType,
                })}::jsonb,
                updated_at = NOW()
            WHERE reference = ${tx.reference}
          `;
          logServiceEvent("datamart", "webhook", "success", {
            orderReference,
            reference: tx.reference,
          });
        } else if (orderStatus === "failed" && tx.status !== "failed") {
          await withTransaction(async (query) => {
            await query(
              `UPDATE transactions
               SET status = 'failed',
                   metadata = metadata || $1::jsonb,
                   updated_at = NOW()
               WHERE reference = $2`,
              [
                JSON.stringify({
                  state: "refunded",
                  provider_confirmed_failed_at: new Date().toISOString(),
                  webhook_event: eventType,
                }),
                tx.reference,
              ]
            );
            await query(
              `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
              [Number(tx.amount), tx.user_id]
            );
          });
          logServiceEvent("datamart", "webhook", "failed", {
            orderReference,
            reference: tx.reference,
          });
        } else if (orderStatus === "refunded" && tx.status !== "failed") {
          await withTransaction(async (query) => {
            await query(
              `UPDATE transactions
               SET status = 'failed',
                   metadata = metadata || $1::jsonb,
                   updated_at = NOW()
               WHERE reference = $2`,
              [
                JSON.stringify({
                  state: "refunded",
                  provider_refunded_at: new Date().toISOString(),
                  webhook_event: eventType,
                }),
                tx.reference,
              ]
            );
            await query(
              `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
              [Number(tx.amount), tx.user_id]
            );
          });
          logServiceEvent("datamart", "webhook", "failed", {
            orderReference,
            reference: tx.reference,
          });
        }
      }
    }

    return NextResponse.json({ received: true, correlationId });
  } catch (error) {
    console.error("DataMart webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
