import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sql, withTransaction } from "@/lib/db";
import {
  createDatamartOrder,
  generateIdempotencyKey,
  getPackages,
  isValidGhanaPhone,
  resolveNetworkCode,
  submitDatamartPurchase,
  type DatamartNetworkCode,
} from "@/lib/datamart-v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PurchaseBody {
  phoneNumber?: string;
  phone?: string;
  network?: string;
  capacity?: string;
  gateway?: string;
  idempotencyKey?: string;
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  const sessions = await sql`
    SELECT s.user_id, u.wallet_balance
    FROM auth_sessions s
    JOIN users u ON s.user_id::text = u.id::text
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `;
  return sessions.length > 0 ? sessions[0] : null;
}

async function getOrderByKey(idempotencyKey: string) {
  const rows = await sql`
    SELECT id, phone_number, network, capacity, price, status, order_reference, transaction_reference, purchase_id, idempotency_key, created_at, updated_at
    FROM datamart_orders
    WHERE idempotency_key = ${idempotencyKey}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0] : null;
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  let incoming: PurchaseBody;

  try {
    incoming = (await request.json()) as PurchaseBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", correlationId },
      { status: 400 }
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — please log in", correlationId },
      { status: 401 }
    );
  }
  const userId = String(user.user_id);

  const phoneInput = incoming.phoneNumber || incoming.phone || "";
  const networkInput = incoming.network || "";
  const capacity = incoming.capacity?.trim();

  if (!phoneInput || !networkInput || !capacity) {
    return NextResponse.json(
      { success: false, error: "phoneNumber, network, and capacity are required", correlationId },
      { status: 400 }
    );
  }

  if (!isValidGhanaPhone(phoneInput)) {
    return NextResponse.json(
      { success: false, error: "Invalid Ghana phone number", code: "INVALID_PHONE", correlationId },
      { status: 400 }
    );
  }

  let network: DatamartNetworkCode;
  try {
    network = resolveNetworkCode(networkInput);
  } catch {
    return NextResponse.json(
      { success: false, error: `Unsupported network: ${networkInput}`, correlationId },
      { status: 400 }
    );
  }

  const headerKey = request.headers.get("x-idempotency-key") ?? undefined;
  const requestedKey = incoming.idempotencyKey ?? headerKey;
  const idempotencyKey = requestedKey && requestedKey.trim().length > 0 ? requestedKey.trim() : generateIdempotencyKey();

  try {
    const existing = await getOrderByKey(idempotencyKey);
    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        idempotencyKey,
        correlationId,
      });
    }

    const { packages } = await getPackages({ network });
    const matched = packages.find((pkg) => pkg.capacity === capacity);
    if (!matched) {
      return NextResponse.json(
        { success: false, error: `Capacity ${capacity} is not available`, correlationId },
        { status: 400 }
      );
    }

    const price = Number(matched.price);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid bundle price", correlationId },
        { status: 400 }
      );
    }

    const walletBalance = Number(user.wallet_balance) || 0;
    if (walletBalance < price) {
      return NextResponse.json(
        { success: false, error: `Insufficient balance. Need GHS ${price.toFixed(2)}, have GHS ${walletBalance.toFixed(2)}`, correlationId },
        { status: 400 }
      );
    }

    const existingTx = await sql`
      SELECT reference, status
      FROM transactions
      WHERE user_id = ${userId}
        AND metadata->>'idempotency_key' = ${idempotencyKey}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (existingTx.length > 0) {
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
          'PENDING',
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

    try {
      await submitDatamartPurchase({
        phoneNumber: phoneInput,
        network,
        capacity,
        idempotencyKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Purchase failed";

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

    const order = await getOrderByKey(idempotencyKey);
    const orderStatus = (order?.status || "pending").toLowerCase();

    if (orderStatus === "completed" || orderStatus === "delivered") {
      await sql`
        UPDATE transactions
        SET status = 'success',
            metadata = metadata || ${JSON.stringify({
              state: "success",
              provider_order_ref: order?.order_reference,
              fulfilled_at: new Date().toISOString(),
            })}::jsonb,
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
    } else if (orderStatus === "failed" || orderStatus === "refunded") {
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
              provider_order_ref: order?.order_reference,
              failed_at: new Date().toISOString(),
            }),
            reference,
          ]
        );
        await tx(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [price, userId]);
      });
    } else {
      await sql`
        UPDATE transactions
        SET status = 'pending',
            metadata = metadata || ${JSON.stringify({
              state: "provider_submitted",
              provider_order_ref: order?.order_reference,
            })}::jsonb,
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
    }

    const updatedUser = await sql`SELECT wallet_balance FROM users WHERE id = ${userId} LIMIT 1`;
    const newBalance = updatedUser.length > 0 ? Number(updatedUser[0].wallet_balance) : undefined;

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
