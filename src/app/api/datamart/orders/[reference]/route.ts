import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { refreshOrderStatus } from "@/lib/datamart-v2";
import { sql } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const correlationId = crypto.randomUUID();
  const { reference: rawReference } = await params;
  const reference = rawReference?.trim();
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "true";

  if (!reference) {
    return NextResponse.json(
      {
        success: false,
        error: "Order reference required",
        correlationId,
      },
      { status: 400 }
    );
  }

  try {
    const rows = await sql`
      SELECT id,
             phone_number,
             network,
             capacity,
             price,
             status,
             order_reference,
             transaction_reference,
             purchase_id,
             idempotency_key,
             balance_before,
             balance_after,
             processing_method,
             retry_count,
             last_attempt_at,
             error_code,
             error_message,
             metadata,
             created_at,
             updated_at
      FROM datamart_orders
      WHERE order_reference = ${reference}
      LIMIT 1
    `;
    const order = rows.length > 0 ? rows[0] : null;

    const finalStates = new Set(["completed", "failed", "refunded"]);
    const isFinal = order ? finalStates.has(String(order.status ?? "").toLowerCase()) : false;
    const updatedAt = order?.updated_at ? new Date(order.updated_at as string) : null;
    const staleThresholdMs = 20_000;
    const isStale = !updatedAt || Date.now() - updatedAt.getTime() > staleThresholdMs;

    let providerStatus = null;
    let refreshed = false;

    if (force || !order || (!isFinal && isStale)) {
      providerStatus = await refreshOrderStatus(reference);
      refreshed = true;
      if (!providerStatus && !order) {
        return NextResponse.json(
          {
            success: false,
            error: "Unable to fetch order status",
            correlationId,
          },
          { status: 502 }
        );
      }
    }

    const statusPayload = providerStatus ?? (order
      ? {
          orderStatus: String(order.status ?? "pending"),
          orderReference: order.order_reference,
          transactionReference: order.transaction_reference,
          purchaseId: order.purchase_id,
          balanceBefore: order.balance_before,
          balanceAfter: order.balance_after,
          price: order.price,
          processingMethod: order.processing_method,
          updatedAt: updatedAt?.toISOString(),
        }
      : null);

    return NextResponse.json(
      {
        success: true,
        data: {
          order,
          status: statusPayload,
          fromCache: !refreshed,
          correlationId,
        },
        correlationId,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ message: "[DataMart] Order status fetch failed", correlationId, reference }, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch order status",
        correlationId,
      },
      { status: 500 }
    );
  }
}
