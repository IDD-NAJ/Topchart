import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import { initializePaystackTransaction, generatePaystackReference } from "@/lib/paystack";
import {
  resolveDatamartPurchaseIntent,
  assertNoDuplicateTransactionIntent,
  fetchDatamartOrderByIdempotency,
  newDatamartCorrelationId,
  type DatamartPurchaseIntentBody,
} from "@/lib/datamart-purchase-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYSTACK_SURCHARGE = 0.05;

export async function POST(request: NextRequest) {
  const correlationId = newDatamartCorrelationId();
  let body: DatamartPurchaseIntentBody;
  try {
    body = (await request.json()) as DatamartPurchaseIntentBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body", correlationId }, { status: 400 });
  }

  const headerKey = request.headers.get("x-idempotency-key") ?? undefined;
  if (!body.idempotencyKey && headerKey) {
    body = { ...body, idempotencyKey: headerKey };
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) {
    return NextResponse.json({ success: false, error: "Unauthorized — please log in", correlationId }, { status: 401 });
  }

  const sessions = await sql`
    SELECT s.user_id, u.email, u.first_name, u.last_name
    FROM auth_sessions s
    JOIN users u ON s.user_id::text = u.id::text
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `;
  if (sessions.length === 0) {
    return NextResponse.json({ success: false, error: "Session expired", correlationId }, { status: 401 });
  }

  const user = sessions[0] as { user_id: string; email: string; first_name: string; last_name: string };
  const userId = String(user.user_id);

  const resolved = await resolveDatamartPurchaseIntent(body, correlationId, {
    requireWalletBalance: false,
    walletBalance: 0,
  });
  if (!resolved.ok) {
    return NextResponse.json(
      { success: false, error: resolved.error, correlationId },
      { status: resolved.status }
    );
  }

  const { phoneInput, network, capacity, idempotencyKey, price: basePrice } = resolved;

  const pendingOrder = await fetchDatamartOrderByIdempotency(idempotencyKey);
  if (pendingOrder) {
    return NextResponse.json(
      { success: false, error: "This purchase session already has an order. Use wallet flow or a new session.", correlationId },
      { status: 409 }
    );
  }

  const dupTx = await assertNoDuplicateTransactionIntent(userId, idempotencyKey);
  if (dupTx) {
    return NextResponse.json(
      { success: false, error: "Duplicate purchase request", correlationId },
      { status: 409 }
    );
  }

  const surcharge = Number((basePrice * PAYSTACK_SURCHARGE).toFixed(2));
  const chargeAmount = Number((basePrice + surcharge).toFixed(2));
  const reference = `DATA-PS-${generatePaystackReference()}`;
  const txId = uuidv4();

  const baseUrl =
    request.headers.get("origin") ||
    (request.nextUrl && request.nextUrl.origin) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  const callbackUrl = baseUrl ? `${baseUrl}/dashboard/data/callback?reference=${encodeURIComponent(reference)}` : undefined;

  await sql`
    INSERT INTO transactions (
      id, user_id, type, amount, status, reference,
      payment_method, currency, fees, metadata, created_at, updated_at
    ) VALUES (
      ${txId}, ${userId}, 'data', ${basePrice}, 'pending', ${reference},
      'paystack', 'GHS', ${surcharge},
      ${JSON.stringify({
        phoneNumber: phoneInput,
        network,
        capacity,
        idempotency_key: idempotencyKey,
        base_price: basePrice,
        surcharge,
        charge_amount: chargeAmount,
        correlation_id: correlationId,
        payment_flow: "paystack_direct",
        gateway: body.gateway ?? null,
        initiated_at: new Date().toISOString(),
      })}::jsonb,
      NOW(), NOW()
    )
  `;

  const paystackResult = await initializePaystackTransaction(
    user.email,
    Math.round(chargeAmount * 100),
    reference,
    {
      user_id: userId,
      transaction_type: "data",
      network,
      capacity,
      idempotency_key: idempotencyKey,
    },
    callbackUrl
  );

  if (!paystackResult.success) {
    await sql`
      UPDATE transactions SET status = 'failed', updated_at = NOW()
      WHERE reference = ${reference}
    `;
    return NextResponse.json(
      { success: false, error: paystackResult.error || "Paystack initialize failed", correlationId },
      { status: 400 }
    );
  }

  await sql`
    UPDATE transactions
    SET paystack_access_code = ${paystackResult.data?.access_code || null},
        paystack_authorization_url = ${paystackResult.data?.authorization_url || null},
        updated_at = NOW()
    WHERE reference = ${reference}
  `;

  return NextResponse.json({
    success: true,
    data: {
      authorization_url: paystackResult.data?.authorization_url,
      access_code: paystackResult.data?.access_code,
      reference,
      base_price: basePrice,
      surcharge,
      charge_amount: chargeAmount,
      idempotency_key: idempotencyKey,
      correlation_id: correlationId,
    },
  });
}
