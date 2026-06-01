import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import {
  createDatamartOrder,
  resolveNetworkCode,
  submitDatamartPurchase,
  type DatamartNetworkCode,
} from "@/lib/datamart-v2";
import {
  fetchDatamartOrderByIdempotency,
  applyDatamartTransactionAfterProviderSubmit,
} from "@/lib/datamart-purchase-shared";
import { hubnetPurchase } from "@/lib/providers/hubnet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ success: false, error: "Reference is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await sql`
    SELECT s.user_id FROM auth_sessions s
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `;
  if (sessions.length === 0) {
    return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
  }

  const userId = String((sessions[0] as { user_id: string }).user_id);

  const txRows = await sql`
    SELECT id, status, amount, user_id, metadata, type, reference, payment_method
    FROM transactions
    WHERE reference = ${reference}
  `;
  if (txRows.length === 0) {
    return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
  }

  const tx = txRows[0] as {
    user_id: string;
    status: string;
    metadata: Record<string, unknown> | null;
    reference: string;
    amount: unknown;
    payment_method: string | null;
  };

  if (String(tx.user_id) !== userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const meta = (tx.metadata || {}) as Record<string, unknown>;
  const idempotencyKey = String(meta.idempotency_key || "");
  const correlationId = String(meta.correlation_id || "");

  if (!idempotencyKey) {
    return NextResponse.json({ success: false, error: "Invalid transaction metadata" }, { status: 500 });
  }

  if (tx.status === "success") {
    const order = await fetchDatamartOrderByIdempotency(idempotencyKey);
    return NextResponse.json({
      success: true,
      data: {
        status: "success",
        order,
        reference,
        already_completed: true,
        idempotency_key: idempotencyKey,
      },
    });
  }

  const isPaystackDataTx = String(tx.payment_method ?? "").toLowerCase() === "paystack";

  if (tx.status === "failed" && !isPaystackDataTx) {
    return NextResponse.json({
      success: false,
      data: { status: "failed", reference },
      error: "Payment was not completed",
    });
  }

  const verifyResult = await verifyPaystackTransaction(reference);
  if (!verifyResult.success) {
    return NextResponse.json({ success: false, error: verifyResult.error }, { status: 400 });
  }

  const paystackData = verifyResult.data!;
  const paystackTxnStatus = String(paystackData.status ?? "").toLowerCase();

  if (paystackTxnStatus !== "success") {
    if (paystackTxnStatus === "failed" || paystackTxnStatus === "abandoned") {
      await sql`
        UPDATE transactions SET status = 'failed', updated_at = NOW()
        WHERE reference = ${reference}
      `;
      return NextResponse.json({
        success: false,
        data: { status: paystackData.status, reference },
        error: paystackData.gateway_response || "Payment was not successful",
      });
    }
    return NextResponse.json({
      success: true,
      data: { status: "pending", reference },
    });
  }

  const phoneInput = String(meta.phoneNumber || "");
  const capacity = String(meta.capacity || "");
  const basePrice = Number(meta.base_price ?? tx.amount) || 0;
  let network: DatamartNetworkCode;
  try {
    network = resolveNetworkCode(String(meta.network || ""));
  } catch {
    return NextResponse.json({ success: false, error: "Invalid network in transaction" }, { status: 500 });
  }

  await sql`
    UPDATE transactions
    SET metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
      paystack_id: paystackData.id,
      paid_at: paystackData.paid_at,
      channel: paystackData.channel,
      verified_at: new Date().toISOString(),
    })}::jsonb,
        payment_channel = ${paystackData.channel ?? null},
        paid_at = ${paystackData.paid_at ? new Date(paystackData.paid_at).toISOString() : null},
        updated_at = NOW()
    WHERE reference = ${reference}
  `;

  let existingOrder = await fetchDatamartOrderByIdempotency(idempotencyKey);
  if (!existingOrder) {
    await createDatamartOrder({
      phoneNumber: phoneInput,
      network,
      capacity,
      gateway: "paystack",
      idempotencyKey,
      userId,
      price: basePrice,
    });
    existingOrder = await fetchDatamartOrderByIdempotency(idempotencyKey);
  }

  try {
    await submitDatamartPurchase({
      phoneNumber: phoneInput,
      network,
      capacity,
      idempotencyKey,
      gateway: "paystack",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Purchase failed";
    console.error(`[DataMart Verify] Provider failed after Paystack success for ${reference}: ${message}`);
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
        return NextResponse.json({
          success: true,
          data: { status: "success", provider: "hubnet" },
        });
      }
    } catch {}
    await sql`
      UPDATE transactions
      SET status = 'refunded',
          metadata = metadata || ${JSON.stringify({
            provider_error: message,
            failed_at: new Date().toISOString(),
            correlation_id: correlationId,
            refunded_to_wallet: true,
            refund_amount: basePrice,
            refund_reason: "Provider delivery failed after Paystack payment succeeded",
          })}::jsonb,
          updated_at = NOW()
      WHERE reference = ${reference}
    `;
    await sql`
      UPDATE users
      SET wallet_balance = wallet_balance + ${basePrice}
      WHERE id = ${userId}
    `;
    console.log(`[DataMart Verify] Credited GHS ${basePrice} to wallet for user ${userId} (ref: ${reference})`);
    return NextResponse.json(
      {
        success: false,
        refunded: true,
        refund_amount: basePrice,
        error: `${message}. Your payment of GHS ${basePrice.toFixed(2)} has been credited to your wallet.`,
        idempotency_key: idempotencyKey,
        correlation_id: correlationId,
      },
      { status: 502 }
    );
  }

  const { order } = await applyDatamartTransactionAfterProviderSubmit({
    reference,
    userId,
    idempotencyKey,
    price: basePrice,
    correlationId,
    refundWalletOnTerminalFailure: true,
  });

  return NextResponse.json({
    success: true,
    data: {
      status: "success",
      order,
      reference,
      base_price: basePrice,
      idempotency_key: idempotencyKey,
      correlation_id: correlationId,
    },
  });
}
