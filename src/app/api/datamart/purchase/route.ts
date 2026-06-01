import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sql, withTransaction } from "@/lib/db";
import {
  createDatamartOrder,
  submitDatamartPurchase,
} from "@/lib/datamart-v2";
import { hubnetPurchase } from "@/lib/providers/hubnet";
import {
  resolveDatamartPurchaseIntent,
  fetchDatamartOrderByIdempotency,
  assertNoDuplicateTransactionIntent,
  applyDatamartTransactionAfterProviderSubmit,
  type DatamartPurchaseIntentBody,
} from "@/lib/datamart-purchase-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  let incoming: DatamartPurchaseIntentBody;

  try {
    incoming = (await request.json()) as DatamartPurchaseIntentBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", correlationId },
      { status: 400 }
    );
  }

  const headerKey = request.headers.get("x-idempotency-key") ?? undefined;
  if (!incoming.idempotencyKey && headerKey) {
    incoming = { ...incoming, idempotencyKey: headerKey };
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — please log in", correlationId },
      { status: 401 }
    );
  }

  const sessions = await sql`
    SELECT s.user_id, u.wallet_balance
    FROM auth_sessions s
    JOIN users u ON s.user_id::text = u.id::text
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `;
  if (sessions.length === 0) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — please log in", correlationId },
      { status: 401 }
    );
  }

  const user = sessions[0] as { user_id: string; wallet_balance: unknown };
  const userId = String(user.user_id);
  const walletBalance = Number(user.wallet_balance) || 0;

  const resolved = await resolveDatamartPurchaseIntent(incoming, correlationId, {
    requireWalletBalance: true,
    walletBalance,
  });

  if (!resolved.ok) {
    return NextResponse.json(
      { success: false, error: resolved.error, correlationId },
      { status: resolved.status }
    );
  }

  const { phoneInput, network, capacity, idempotencyKey, price } = resolved;

  try {
    const existing = await fetchDatamartOrderByIdempotency(idempotencyKey);
    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        idempotencyKey,
        correlationId,
      });
    }

    const duplicateIntent = await assertNoDuplicateTransactionIntent(userId, idempotencyKey);
    if (duplicateIntent) {
      return NextResponse.json(
        { success: false, error: "Duplicate purchase request", correlationId },
        { status: 409 }
      );
    }

    const orderResult = await createDatamartOrder({
      phoneNumber: phoneInput,
      network,
      capacity,
      gateway: incoming.gateway,
      idempotencyKey,
      userId,
      price,
    });

    const reference = `DATA_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

    await withTransaction(async (tx) => {
      await tx(
        `INSERT INTO transactions (
          id, type, status, amount, currency, user_id,
          reference, source, metadata, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          'pending',
          $2,
          'GHS',
          $3,
          $4,
          'WALLET',
          $5::jsonb,
          NOW(),
          NOW()
        )`,
        [
          "data",
          price,
          userId,
          reference,
          JSON.stringify({
            state: "debited",
            idempotency_key: idempotencyKey,
            correlation_id: correlationId,
            datamart_order_id: orderResult.id,
            description: `Data bundle — ${capacity} ${network}`,
            network,
            phoneNumber: phoneInput,
            capacity,
          }),
        ]
      );
      await tx(`UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`, [price, userId]);
    });

    const DUPLICATE_ORDER_PATTERN = /similar order|already submitted|wait \d+\s*(seconds?|s|minutes?)?\s*before retry/i;

    try {
      await submitDatamartPurchase({
        phoneNumber: phoneInput,
        network,
        capacity,
        idempotencyKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Purchase failed";

      if (DUPLICATE_ORDER_PATTERN.test(message)) {
        logger.warn({ message: "[DataMart] Duplicate order caught in route — keeping wallet debited, marking pending", correlationId, idempotencyKey });
        await sql`
          UPDATE transactions
          SET status = 'pending',
              metadata = metadata || ${JSON.stringify({
                state: "duplicate_in_progress",
                provider_message: message,
                correlation_id: correlationId,
              })}::jsonb,
              updated_at = NOW()
          WHERE reference = ${reference}
        `;
        const existingOrder = await fetchDatamartOrderByIdempotency(idempotencyKey);
        const updatedUser = await sql`SELECT wallet_balance FROM users WHERE id = ${userId} LIMIT 1`;
        const newBalance = updatedUser.length > 0 ? Number((updatedUser[0] as { wallet_balance: unknown }).wallet_balance) : undefined;
        return NextResponse.json({
          success: true,
          data: existingOrder,
          idempotencyKey,
          correlationId,
          reference,
          newBalance,
        });
      }

      try {
        const hubRes = await hubnetPurchase({ phoneNumber: phoneInput, network, capacity, idempotencyKey });
        if (hubRes.success && hubRes.data) {
          await sql`
            UPDATE transactions
            SET status = 'success',
                metadata = metadata || ${JSON.stringify({ provider: "hubnet", state: "success", provider_message: hubRes.data.message || "completed" })}::jsonb,
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
          const updatedUser = await sql`SELECT wallet_balance FROM users WHERE id = ${userId} LIMIT 1`;
          const newBalance = updatedUser.length > 0 ? Number((updatedUser[0] as { wallet_balance: unknown }).wallet_balance) : undefined;
          return NextResponse.json({ success: true, data: { provider: "hubnet", status: "success" }, idempotencyKey, correlationId, reference, newBalance });
        }
      } catch {}

      await withTransaction(async (tx) => {
        await tx(
          `UPDATE transactions
           SET status = 'failed',
               metadata = metadata || $1::jsonb,
               updated_at = NOW()
           WHERE reference = $2`,
          [
            JSON.stringify({
              state: "refunded",
              provider_error: message,
              failed_at: new Date().toISOString(),
            }),
            reference,
          ]
        );
        await tx(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [price, userId]);
      });

      const isRetryable = /timeout|network/i.test(message);
      const status = isRetryable ? 503 : 400;
      return NextResponse.json(
        {
          success: false,
          error: message,
          idempotencyKey,
          correlationId,
        },
        { status }
      );
    }

    const { order, newBalance } = await applyDatamartTransactionAfterProviderSubmit({
      reference,
      userId,
      idempotencyKey,
      price,
      correlationId,
      refundWalletOnTerminalFailure: true,
    });

    return NextResponse.json({
      success: true,
      data: order,
      idempotencyKey,
      correlationId,
      reference,
      newBalance,
    });
  } catch (error) {
    logger.error({ message: "[DataMart] Purchase request failed", correlationId, idempotencyKey }, error);
    const message = error instanceof Error ? error.message : "Purchase failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
        idempotencyKey,
        correlationId,
      },
      { status: 500 }
    );
  }
}
