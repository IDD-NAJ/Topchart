import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql, withTransaction } from "@/lib/db";
import { persistWebhookEvent } from "@/lib/datamart-v2";
import { getDatamartEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-datamart-signature");
    const headerEvent = request.headers.get("x-datamart-event") || undefined;

    let webhookSecret: string | undefined;
    try {
      const env = getDatamartEnv();
      webhookSecret = env.DATAMART_WEBHOOK_SECRET ?? undefined;
    } catch (error) {
      logger.warn({ message: "[DataMart] Webhook secret missing", correlationId, error: error instanceof Error ? error.message : error });
    }

    if (webhookSecret) {
      if (!signature) {
        logger.warn({ message: "[DataMart] Missing webhook signature", correlationId });
        return NextResponse.json({ error: "Signature required", correlationId }, { status: 401 });
      }
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        logger.warn({ message: "[DataMart] Invalid webhook signature", correlationId });
        await persistWebhookEvent(headerEvent || "unknown", signature, false, { raw: rawBody });
        return NextResponse.json({ error: "Invalid signature", correlationId }, { status: 401 });
      }
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch (error) {
      logger.error({ message: "[DataMart] Invalid webhook JSON", correlationId }, error);
      return NextResponse.json({ error: "Invalid JSON", correlationId }, { status: 400 });
    }

    const event = typeof payload.event === "string" && payload.event.length > 0 ? payload.event : headerEvent || "unknown";
    const data = (payload.data || {}) as Record<string, unknown>;
    const status = typeof data.status === "string" ? data.status.toLowerCase() : undefined;
    const orderReference = typeof data.orderReference === "string" ? data.orderReference : undefined;

    await persistWebhookEvent(event, signature, Boolean(webhookSecret && signature), {
      ...payload,
      correlationId,
    });

    logger.info({
      message: "[DataMart] Webhook received",
      event,
      orderReference,
      status,
      correlationId,
    });

    if (orderReference && status) {
      const txRows = await sql`
        SELECT reference, status, amount, user_id, metadata
        FROM transactions
        WHERE metadata->>'provider_order_ref' = ${orderReference}
           OR metadata->>'provider_order_id' = ${orderReference}
        LIMIT 1
      `;

      if (txRows.length > 0) {
        const tx = txRows[0];
        const now = new Date().toISOString();
        const metadataPatch = {
          webhook_event: event,
          provider_status: status,
          provider_confirmed_at: now,
        };

        if (status === "completed" && tx.status !== "success") {
          await sql`
            UPDATE transactions
            SET status = 'success',
                metadata = metadata || ${JSON.stringify(metadataPatch)}::jsonb,
                updated_at = NOW()
            WHERE reference = ${tx.reference}
          `;
        } else if ((status === "failed" || status === "refunded") && tx.status !== "failed") {
          await withTransaction(async (query) => {
            await query(
              `UPDATE transactions
               SET status = 'failed',
                   metadata = metadata || $1::jsonb,
                   updated_at = NOW()
               WHERE reference = $2`,
              [JSON.stringify({ ...metadataPatch, provider_refunded_at: now }), tx.reference]
            );
            await query(
              `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
              [Number(tx.amount), tx.user_id]
            );
          });
        }
      }
    }

    return NextResponse.json({ received: true, correlationId });
  } catch (error) {
    logger.error({ message: "[DataMart] Webhook processing failed", correlationId }, error);
    return NextResponse.json({ error: "Internal server error", correlationId }, { status: 500 });
  }
}
