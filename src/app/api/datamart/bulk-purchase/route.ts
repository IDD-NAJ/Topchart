import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sql } from "@/lib/db";
import {
  getPackages,
  recordBulkBatch,
  resolveNetworkCode,
  submitDatamartBulkPurchase,
  type DatamartNetworkCode,
} from "@/lib/datamart-v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BulkOrderInput {
  phoneNumber: string;
  network: string;
  capacity: string;
  ref?: string;
}

interface BulkRequestBody {
  orders?: BulkOrderInput[];
  idempotencyKey?: string;
  batchId?: string;
}

const MAX_ORDERS = 50;

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return true;
  if (digits.startsWith("0") && digits.length === 10) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  let payload: BulkRequestBody;

  try {
    payload = (await request.json()) as BulkRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", correlationId },
      { status: 400 }
    );
  }

  if (!payload.orders || !Array.isArray(payload.orders) || payload.orders.length === 0) {
    return NextResponse.json(
      { success: false, error: "orders array is required", correlationId },
      { status: 400 }
    );
  }

  if (payload.orders.length > MAX_ORDERS) {
    return NextResponse.json(
      { success: false, error: `Maximum ${MAX_ORDERS} orders per batch`, correlationId },
      { status: 400 }
    );
  }

  const headerKey = request.headers.get("x-idempotency-key") ?? undefined;
  const requestedKey = payload.idempotencyKey ?? headerKey;
  const idempotencyKey = requestedKey && requestedKey.trim().length > 0 ? requestedKey.trim() : crypto.randomUUID();
  const batchId = payload.batchId && payload.batchId.trim().length > 0 ? payload.batchId.trim() : `BATCH-${Date.now()}`;

  async function fetchExistingBatch() {
    const batches = await sql`
      SELECT id, batch_id, idempotency_key, total, successful, failed, total_charged, shortfall, wallet_balance, status, metadata, created_at, updated_at
      FROM datamart_bulk_batches
      WHERE idempotency_key = ${idempotencyKey}
      LIMIT 1
    `;

    if (batches.length === 0) {
      return null;
    }

    const batch = batches[0];
    const items = await sql`
      SELECT ref, phone_number, network, capacity, price, status, purchase_id, order_reference, transaction_reference, balance_before, balance_after, error_code, error_message, metadata, created_at, updated_at
      FROM datamart_bulk_order_items
      WHERE batch_id = ${batch.id}
      ORDER BY created_at ASC
    `;

    return {
      summary: {
        total: Number(batch.total),
        successful: Number(batch.successful ?? 0),
        failed: Number(batch.failed ?? 0),
        totalCharged: batch.total_charged !== null ? Number(batch.total_charged) : undefined,
        shortfall: batch.shortfall !== null ? Number(batch.shortfall) : undefined,
        remainingBalance: batch.wallet_balance !== null ? Number(batch.wallet_balance) : undefined,
        status: batch.status,
      },
      results: items.map((item) => ({
        ref: item.ref || undefined,
        phoneNumber: item.phone_number,
        network: item.network,
        capacity: item.capacity,
        price: Number(item.price),
        status: item.status,
        purchaseId: item.purchase_id || undefined,
        orderReference: item.order_reference || undefined,
        transactionReference: item.transaction_reference || undefined,
        balanceBefore: item.balance_before !== null ? Number(item.balance_before) : undefined,
        balanceAfter: item.balance_after !== null ? Number(item.balance_after) : undefined,
        errorCode: item.error_code || undefined,
        errorMessage: item.error_message || undefined,
        metadata: item.metadata,
      })),
      batchId: batch.batch_id,
    };
  }

  const existingBatch = await fetchExistingBatch();
  if (existingBatch) {
    return NextResponse.json({
      success: true,
      data: {
        summary: existingBatch.summary,
        results: existingBatch.results,
        batchId: existingBatch.batchId,
        idempotencyKey,
      },
      correlationId,
      fromCache: true,
    });
  }

  try {
    const groupedByNetwork = new Map<DatamartNetworkCode, BulkOrderInput[]>();

    for (const order of payload.orders) {
      if (!order.phoneNumber || !order.network || !order.capacity) {
        return NextResponse.json(
          { success: false, error: "Each order requires phoneNumber, network, capacity", correlationId },
          { status: 400 }
        );
      }
      if (!isValidPhone(order.phoneNumber)) {
        return NextResponse.json(
          { success: false, error: `Invalid phone number: ${order.phoneNumber}`, correlationId },
          { status: 400 }
        );
      }

      let network: DatamartNetworkCode;
      try {
        network = resolveNetworkCode(order.network);
      } catch {
        return NextResponse.json(
          { success: false, error: `Unsupported network: ${order.network}`, correlationId },
          { status: 400 }
        );
      }

      if (!groupedByNetwork.has(network)) {
        groupedByNetwork.set(network, []);
      }
      groupedByNetwork.get(network)!.push(order);
    }

    const pricedOrders: Array<{ phoneNumber: string; network: DatamartNetworkCode; capacity: string; price: number; ref?: string }> = [];
    let totalCost = 0;

    for (const [network, orders] of groupedByNetwork.entries()) {
      const { packages } = await getPackages({ network });
      for (const order of orders) {
        const matched = packages.find((pkg) => pkg.capacity === order.capacity);
        if (!matched) {
          return NextResponse.json(
            { success: false, error: `Capacity ${order.capacity} unavailable for ${network}`, correlationId },
            { status: 400 }
          );
        }
        pricedOrders.push({
          phoneNumber: order.phoneNumber,
          network,
          capacity: order.capacity,
          price: matched.price,
          ref: order.ref,
        });
        totalCost += matched.price;
      }
    }

    await recordBulkBatch({
      batchId,
      idempotencyKey,
      orders: pricedOrders,
    });

    let providerSummary;
    let providerResults;

    try {
      const providerResponse = await submitDatamartBulkPurchase({
        orders: pricedOrders,
        idempotencyKey,
      });
      providerSummary = providerResponse.summary;
      providerResults = providerResponse.results;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk purchase failed";
      const status = /balance/i.test(message) ? 400 : 503;
      return NextResponse.json(
        {
          success: false,
          error: message,
          idempotencyKey,
          batchId,
          correlationId,
          totalCost,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: providerSummary,
        results: providerResults,
        batchId,
        idempotencyKey,
      },
      correlationId,
      fromCache: false,
    });
  } catch (error) {
    logger.error({ message: "[DataMart] Bulk purchase error", correlationId, idempotencyKey }, error);
    const message = error instanceof Error ? error.message : "Bulk purchase failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
        idempotencyKey,
        batchId,
        correlationId,
      },
      { status: 500 }
    );
  }
}
