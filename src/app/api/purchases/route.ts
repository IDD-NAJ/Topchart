import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, withTransaction } from "@/lib/db";
import { purchaseDataBundle, purchaseAirtime as purchaseDatamartAirtime } from "@/lib/datamart";
import { purchaseAirtime as purchaseReloadlyAirtime, getOperatorId } from "@/lib/reloadly";

export const runtime = "nodejs";

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  const sessions = await sql`
    SELECT user_id FROM auth_sessions
    WHERE token = ${sessionToken} AND expires_at > NOW()
    LIMIT 1
  `;
  return sessions.length > 0 ? String(sessions[0].user_id) : null;
}

async function ensureWallet(
  userId: string,
  query: (queryText: string, params?: unknown[]) => Promise<unknown[]>
): Promise<string> {
  const existing = await query(`SELECT id FROM wallets WHERE "userId" = $1 LIMIT 1`, [userId]) as Array<{ id: string }>;
  if (existing.length > 0) return String(existing[0].id);

  const walletId = `WALLET_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
  await query(
    `INSERT INTO wallets (id, "userId", currency, status, "availableBalance", "pendingBalance", "createdAt", "updatedAt")
     VALUES ($1, $2, 'GHS', 'ACTIVE', 0, 0, NOW(), NOW())`,
    [walletId, userId]
  );
  return walletId;
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized — please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      phone,
      networkId,
      networkName,
      planId,
      planName,
      planSize,
      planPrice,
      type,
      idempotencyKey: bodyIdempotencyKey,
    } = body;

    if (!phone || !networkId || !planPrice || (!planId && !planName)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: phone, networkId, planId, planPrice" },
        { status: 400 }
      );
    }

    const purchaseType: "DATA" | "AIRTIME" =
      String(type || planName || "")
        .toLowerCase()
        .includes("airtime")
        ? "AIRTIME"
        : "DATA";
    const idempotencyKeyHeader = request.headers.get("x-idempotency-key");
    const idempotencyKey = String(bodyIdempotencyKey || idempotencyKeyHeader || "").trim();
    if (!idempotencyKey) {
      return NextResponse.json(
        { success: false, error: "Missing idempotency key", code: "MISSING_IDEMPOTENCY_KEY", correlationId },
        { status: 400 }
      );
    }

    const price = Number(planPrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid plan price" },
        { status: 400 }
      );
    }

    const userRows = await sql`
      SELECT wallet_balance FROM users WHERE id = ${userId} LIMIT 1
    `;
    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const balance = Number(userRows[0].wallet_balance);
    if (price > balance) {
      return NextResponse.json(
        { success: false, error: `Insufficient balance. Need GHS ${price.toFixed(2)}, have GHS ${balance.toFixed(2)}` },
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
        { success: false, error: "Duplicate purchase request", code: "DUPLICATE_REQUEST", transaction: existingTx[0], correlationId },
        { status: 409 }
      );
    }

    const reference = `${purchaseType}_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
    await withTransaction(async (tx) => {
      const walletId = await ensureWallet(userId, tx);
      await tx(
        `INSERT INTO transactions (
          id, type, status, amount, currency, "walletId", user_id,
          reference, source, metadata, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          'PENDING',
          $2,
          'GHS',
          $3,
          $4,
          $5,
          'WALLET',
          $6::jsonb,
          NOW(),
          NOW()
        )`,
        [
          purchaseType,
          price,
          walletId,
          userId,
          reference,
          JSON.stringify({
            state: "debited",
            idempotency_key: idempotencyKey,
            correlation_id: correlationId,
            description: `${purchaseType === "AIRTIME" ? "Airtime" : "Data bundle"} — ${planName || ""} ${planSize || ""}`.trim(),
            networkId,
            network: networkName || networkId,
            phoneNumber: phone,
            plan: planId,
            planLabel: `${planName || ""} ${planSize || ""}`.trim(),
          }),
        ]
      );
      await tx(`UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`, [price, userId]);
    });

    let providerSuccess = false;
    let providerMessage = "";
    let providerOrderId: string | number | undefined;
    let providerName = "datamart";

    if (purchaseType === "DATA") {
      const result = await purchaseDataBundle({
        networkCode: networkId,
        phoneNumber: phone,
        planId: String(planId),
      });

      if (result.success && result.data) {
        const status = result.data.Status?.toLowerCase();
        providerSuccess = status === "successful";
        providerMessage = result.data.message || result.data.api_response || "";
        providerOrderId = result.data.id;
        providerName = "datamart";

        if (!providerSuccess && status === "pending") providerMessage = "Order queued with provider";
      } else {
        providerMessage = result.error || "DataMart request failed";
      }
    } else {
      // Try Reloadly first for airtime
      const operatorId = getOperatorId(networkName);

      if (operatorId) {
        console.log(`[Reloadly] Attempting airtime purchase for ${networkName} (${operatorId}) - ${phone} - GH₵${price}`);
        const reloadlyResult = await purchaseReloadlyAirtime({
          operatorId,
          amount: price,
          recipientPhone: phone,
          customIdentifier: reference,
        });

        if (reloadlyResult.success && reloadlyResult.data) {
          const status = reloadlyResult.data.status?.toLowerCase();
          providerSuccess = status === "successful";
          providerMessage = reloadlyResult.data.status || "";
          providerOrderId = reloadlyResult.data.transactionId;
          providerName = "reloadly";

          console.log(`[Reloadly] Purchase ${providerSuccess ? "successful" : "pending"} - TX: ${providerOrderId}`);

          if (!providerSuccess && status === "pending") {
            providerMessage = "Airtime queued with Reloadly";
          }
        } else {
          // Reloadly failed - log and fallback to DataMart
          console.warn(`[Reloadly] Failed: ${reloadlyResult.error} (${reloadlyResult.errorCode}). Falling back to DataMart.`);

          const datamartResult = await purchaseDatamartAirtime({
            networkCode: networkId,
            phoneNumber: phone,
            amount: price,
          });

          if (datamartResult.success && datamartResult.data) {
            const status = datamartResult.data.Status?.toLowerCase();
            providerSuccess = status === "successful";
            providerMessage = datamartResult.data.message || "";
            providerName = "datamart";

            if (!providerSuccess && status === "pending") providerMessage = "Airtime queued with provider";
          } else {
            providerMessage = datamartResult.error || "Both Reloadly and DataMart failed";
          }
        }
      } else {
        // No operator mapping found, use DataMart directly
        console.log(`[DataMart] No Reloadly operator mapping for ${networkName}, using DataMart directly`);
        const datamartResult = await purchaseDatamartAirtime({
          networkCode: networkId,
          phoneNumber: phone,
          amount: price,
        });

        if (datamartResult.success && datamartResult.data) {
          const status = datamartResult.data.Status?.toLowerCase();
          providerSuccess = status === "successful";
          providerMessage = datamartResult.data.message || "";

          if (!providerSuccess && status === "pending") providerMessage = "Airtime queued with provider";
        } else {
          providerMessage = datamartResult.error || "DataMart request failed";
        }
      }
    }

    if (providerSuccess || providerMessage.toLowerCase().includes("queued")) {
      const finalStatus = providerSuccess ? "success" : "pending";
      await sql`
        UPDATE transactions
        SET status = ${finalStatus},
            metadata = metadata || ${JSON.stringify({
              provider: providerName || "datamart",
              state: providerSuccess ? "success" : "provider_submitted",
              provider_order_id: providerOrderId,
              provider_message: providerMessage,
              fulfilled_at: new Date().toISOString(),
            })}::jsonb,
            updated_at = NOW()
        WHERE reference = ${reference}
      `;

      return NextResponse.json({
        success: true,
        message: `${purchaseType === "AIRTIME" ? "Airtime" : "Data bundle"} delivered successfully`,
        transaction: {
          reference,
          amount: price,
          network: networkName || networkId,
          phone,
          status: finalStatus,
          providerOrderId,
        },
        correlationId,
      });
    } else {
      await withTransaction(async (tx) => {
        await tx(
          `UPDATE transactions
           SET status = 'failed',
               metadata = metadata || $1::jsonb,
               updated_at = NOW()
           WHERE reference = $2`,
          [
            JSON.stringify({
              provider: "datamart",
              state: "refunded",
              provider_error: providerMessage,
              failed_at: new Date().toISOString(),
            }),
            reference,
          ]
        );
        await tx(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [price, userId]);
      });

      return NextResponse.json(
        {
          success: false,
          code: "PROVIDER_FAILED",
          error: providerMessage || "Provider could not complete the request. Your wallet has been refunded.",
          transaction: { reference, status: "failed" },
          correlationId,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "INTERNAL_ERROR", correlationId },
      { status: 500 }
    );
  }
}
