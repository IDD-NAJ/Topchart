import crypto from "crypto";
import { sql, withTransaction } from "@/lib/db";
import {
  generateIdempotencyKey,
  getPackages,
  isValidGhanaPhone,
  resolveNetworkCode,
  type DatamartNetworkCode,
} from "@/lib/datamart-v2";

export interface DatamartPurchaseIntentBody {
  phoneNumber?: string;
  phone?: string;
  network?: string;
  capacity?: string;
  gateway?: string;
  idempotencyKey?: string;
  effectivePrice?: number;
}

export async function fetchDatamartOrderByIdempotency(idempotencyKey: string) {
  const rows = await sql`
    SELECT id, phone_number, network, capacity, price, status, order_reference, transaction_reference, purchase_id, idempotency_key, created_at, updated_at
    FROM datamart_orders
    WHERE idempotency_key = ${idempotencyKey}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0] : null;
}

export type ResolveDatamartPurchaseResult =
  | {
      ok: true;
      phoneInput: string;
      network: DatamartNetworkCode;
      capacity: string;
      idempotencyKey: string;
      price: number;
    }
  | { ok: false; status: number; error: string };

export async function resolveDatamartPurchaseIntent(
  incoming: DatamartPurchaseIntentBody,
  correlationId: string,
  opts: { requireWalletBalance: boolean; walletBalance: number }
): Promise<ResolveDatamartPurchaseResult> {
  const phoneInput = incoming.phoneNumber || incoming.phone || "";
  const networkInput = incoming.network || "";
  const capacity = incoming.capacity?.trim();

  if (!phoneInput || !networkInput || !capacity) {
    return { ok: false, status: 400, error: "phoneNumber, network, and capacity are required" };
  }

  if (!isValidGhanaPhone(phoneInput)) {
    return { ok: false, status: 400, error: "Invalid Ghana phone number" };
  }

  let network: DatamartNetworkCode;
  try {
    network = resolveNetworkCode(networkInput);
  } catch {
    return { ok: false, status: 400, error: `Unsupported network: ${networkInput}` };
  }

  const requestedKey = incoming.idempotencyKey?.trim();
  const idempotencyKey =
    requestedKey && requestedKey.length > 0 ? requestedKey : generateIdempotencyKey();

  const { packages } = await getPackages({ network });
  const matched = packages.find((pkg) => pkg.capacity === capacity);
  if (!matched) {
    return { ok: false, status: 400, error: `Capacity ${capacity} is not available` };
  }

  let price: number;
  if (incoming.effectivePrice !== undefined) {
    price = Number(incoming.effectivePrice);
  } else {
    const bundleRows = await sql`
      SELECT
        price,
        price_override as "priceOverride",
        markup_percent as "markupPercent"
      FROM data_bundles
      WHERE datamart_plan_id = ${capacity}
        AND is_active = true
      LIMIT 1
    `;

    if (bundleRows.length === 0) {
      return { ok: false, status: 404, error: "Bundle not found in database" };
    }

    const bundle = bundleRows[0] as {
      price: number;
      priceOverride: number | null;
      markupPercent: number | null;
    };
    const providerPrice = Number(bundle.price);
    const priceOverride = bundle.priceOverride ? Number(bundle.priceOverride) : null;
    const markupPercent = bundle.markupPercent ? Number(bundle.markupPercent) : null;

    if (priceOverride !== null && priceOverride > 0) {
      price = priceOverride;
    } else if (markupPercent !== null && markupPercent > 0) {
      const markup = providerPrice * (markupPercent / 100);
      price = Number((providerPrice + markup).toFixed(2));
    } else {
      price = providerPrice;
    }
  }

  if (isNaN(price) || price <= 0) {
    return { ok: false, status: 400, error: "Invalid bundle price" };
  }

  if (opts.requireWalletBalance && opts.walletBalance < price) {
    return {
      ok: false,
      status: 400,
      error: `Insufficient balance. Need GHS ${price.toFixed(2)}, have GHS ${opts.walletBalance.toFixed(2)}`,
    };
  }

  return { ok: true, phoneInput, network, capacity, idempotencyKey, price };
}

export async function assertNoDuplicateTransactionIntent(userId: string, idempotencyKey: string) {
  const existingTx = await sql`
    SELECT reference, status
    FROM transactions
    WHERE user_id = ${userId}
      AND metadata->>'idempotency_key' = ${idempotencyKey}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return existingTx.length > 0 ? existingTx[0] : null;
}

export type PostSubmitOptions = {
  reference: string;
  userId: string;
  idempotencyKey: string;
  price: number;
  correlationId: string;
  refundWalletOnTerminalFailure: boolean;
};

export async function applyDatamartTransactionAfterProviderSubmit(
  opts: PostSubmitOptions
): Promise<{ order: Record<string, unknown> | null; newBalance?: number }> {
  const { reference, userId, idempotencyKey, price, correlationId, refundWalletOnTerminalFailure } =
    opts;

  const orderRows = await sql`
    SELECT id, phone_number, network, capacity, price, status, order_reference, transaction_reference, purchase_id, idempotency_key, created_at, updated_at
    FROM datamart_orders
    WHERE idempotency_key = ${idempotencyKey}
    LIMIT 1
  `;
  const order = orderRows.length > 0 ? orderRows[0] : null;
  const orderStatus = ((order as { status?: string })?.status || "pending").toLowerCase();

  if (orderStatus === "completed" || orderStatus === "delivered") {
    await sql`
      UPDATE transactions
      SET status = 'success',
          metadata = metadata || ${JSON.stringify({
            state: "success",
            provider_order_ref: (order as { order_reference?: string })?.order_reference,
            fulfilled_at: new Date().toISOString(),
            correlation_id: correlationId,
          })}::jsonb,
          updated_at = NOW()
      WHERE reference = ${reference}
    `;
  } else if (orderStatus === "failed" || orderStatus === "refunded") {
    if (refundWalletOnTerminalFailure) {
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
              provider_order_ref: (order as { order_reference?: string })?.order_reference,
              failed_at: new Date().toISOString(),
              correlation_id: correlationId,
            }),
            reference,
          ]
        );
        await tx(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [price, userId]);
      });
    } else {
      await sql`
        UPDATE transactions
        SET status = 'failed',
            metadata = metadata || ${JSON.stringify({
              state: "provider_failed",
              provider_order_ref: (order as { order_reference?: string })?.order_reference,
              failed_at: new Date().toISOString(),
              correlation_id: correlationId,
              note: "Paystack payment captured; provider reported failure — manual review may be required",
            })}::jsonb,
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
    }
  } else {
    await sql`
      UPDATE transactions
      SET status = 'pending',
          metadata = metadata || ${JSON.stringify({
            state: "provider_submitted",
            provider_order_ref: (order as { order_reference?: string })?.order_reference,
            correlation_id: correlationId,
          })}::jsonb,
          updated_at = NOW()
      WHERE reference = ${reference}
    `;
  }

  const updatedUser = await sql`SELECT wallet_balance FROM users WHERE id = ${userId} LIMIT 1`;
  const newBalance =
    updatedUser.length > 0 ? Number((updatedUser[0] as { wallet_balance: unknown }).wallet_balance) : undefined;

  return { order: order as Record<string, unknown> | null, newBalance };
}

export function newDatamartCorrelationId(): string {
  return crypto.randomUUID();
}
