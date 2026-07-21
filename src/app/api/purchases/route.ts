export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, withTransaction } from "@/lib/db";
import { purchaseDataBundle, resolveNetworkCode, getOrderStatus, isDatamartReachable, getReachabilityInfo } from "@/lib/datamart";
import { hubnetPurchase } from "@/lib/providers/hubnet";
import { getPrimaryProvider, getFallbackProvider, type ProviderName } from "@/lib/providers/config";
import { logServiceEvent, apiResponse } from "@/lib/api-utils";

export const runtime = "nodejs";

const REQUEST_DEADLINE_MS = 45_000;

const purchaseRateLimit = new Map<string, { count: number; windowStart: number }>();
const PURCHASE_RATE_LIMIT = 5;
const PURCHASE_RATE_WINDOW_MS = 60_000;

function checkPurchaseRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = purchaseRateLimit.get(userId);
  if (!entry || now - entry.windowStart > PURCHASE_RATE_WINDOW_MS) {
    purchaseRateLimit.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= PURCHASE_RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of purchaseRateLimit) {
      if (now - entry.windowStart > PURCHASE_RATE_WINDOW_MS * 2) {
        purchaseRateLimit.delete(key);
      }
    }
  }, 120_000);
}

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
      return apiResponse(false, "Unauthorized — please log in", { status: 401, correlationId });
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
      effectivePrice,
      type,
      idempotencyKey: bodyIdempotencyKey,
    } = body;

    if (!phone || !networkId || !planPrice || (!planId && !planName)) {
      return apiResponse(false, "Missing required fields: phone, networkId, planId, planPrice", { status: 400, correlationId });
    }

    const normalizedPhone = String(phone).replace(/\s+/g, "");
    if (!/^0\d{9}$/.test(normalizedPhone) && ! /^\d{12}$/.test(normalizedPhone) && !/^\+?233\d{9}$/.test(normalizedPhone)) {
      return apiResponse(false, "Invalid phone number format. Use Ghana format: 0XXXXXXXXX", { status: 400, code: "INVALID_PHONE", correlationId });
    }

    const purchaseType = "DATA";
    const idempotencyKeyHeader = request.headers.get("x-idempotency-key");
    const idempotencyKey = String(bodyIdempotencyKey || idempotencyKeyHeader || "").trim();
    if (!idempotencyKey) {
      return apiResponse(false, "Missing idempotency key", { status: 400, code: "MISSING_IDEMPOTENCY_KEY", correlationId });
    }

    const price = effectivePrice !== undefined ? Number(effectivePrice) : Number(planPrice);
    if (isNaN(price) || price <= 0) {
      return apiResponse(false, "Invalid plan price", { status: 400, correlationId });
    }

    if (!checkPurchaseRateLimit(userId)) {
      return apiResponse(false, "Too many purchase attempts. Please wait a minute and try again.", { status: 429, code: "RATE_LIMITED", correlationId });
    }

    const userRows = await sql`
      SELECT wallet_balance FROM users WHERE id = ${userId} LIMIT 1
    `;
    if (userRows.length === 0) {
      return apiResponse(false, "User not found", { status: 404, correlationId });
    }

    const balance = Number(userRows[0].wallet_balance);
    if (price > balance) {
      return apiResponse(false, `Insufficient balance. Need GHS ${price.toFixed(2)}, have GHS ${balance.toFixed(2)}`, { status: 400, correlationId });
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
      return apiResponse(false, "Duplicate purchase request", { 
        status: 409, 
        code: "DUPLICATE_REQUEST", 
        correlationId,
        data: existingTx[0] 
      });
    }

    const reference = `${purchaseType}_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
    
    logServiceEvent("purchase", purchaseType, "started", { userId, phone, networkId, price, reference });

    await withTransaction(async (tx) => {
      const walletId = await ensureWallet(userId, tx);
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
          purchaseType,
          price,
          userId,
          reference,
          JSON.stringify({
            state: "debited",
            idempotency_key: idempotencyKey,
            correlation_id: correlationId,
            wallet_id: walletId,
            description: `Data bundle — ${planName || ""} ${planSize || ""}`.trim(),
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

    const primaryProvider = await getPrimaryProvider();
    const fallbackProvider = await getFallbackProvider();

    if (!primaryProvider) {
      await withTransaction(async (tx) => {
        await tx(
          `UPDATE transactions SET status = 'failed', metadata = metadata || $1::jsonb, updated_at = NOW() WHERE reference = $2`,
          [JSON.stringify({ provider: "none", state: "refunded", provider_error: "No primary provider configured", failed_at: new Date().toISOString() }), reference]
        );
        await tx(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [price, userId]);
      });
      return apiResponse(false, "No data provider is currently configured. Your wallet has been refunded.", { status: 503, code: "SERVICE_UNAVAILABLE", correlationId, data: { reference, status: "failed" } });
    }

    const capacityGb = planSize ? String(parseInt(String(planSize), 10) || 1) : "1";
    const datamartNetwork = resolveNetworkCode(networkId);

    let providerSuccess = false;
    let providerMessage = "";
    let providerOrderId: string | number | undefined;
    let providerOrderRef: string | undefined;
    let providerUsed: ProviderName = primaryProvider.providerName as ProviderName;

    const tryProvider = async (providerName: ProviderName): Promise<{ success: boolean; message: string; orderId?: string | number; orderRef?: string }> => {
      if (providerName === "datamart") {
        const reachable = await isDatamartReachable();
        if (!reachable) {
          const info = getReachabilityInfo();
          return { success: false, message: `DataMart API unreachable: ${info.reason}` };
        }

        const result = await purchaseDataBundle({
          phoneNumber: normalizedPhone,
          network: datamartNetwork,
          capacity: capacityGb,
          idempotencyKey,
        });

        if (result.success && result.data) {
          const orderStatus = result.data.orderStatus?.toLowerCase();
          const success = orderStatus === "completed";
          const message = result.data.orderStatus || "";
          const orderId = result.data.purchaseId;
          const orderRef = result.data.orderReference;

          if (!success && (orderStatus === "pending" || orderStatus === "waiting" || orderStatus === "processing")) {
            for (let pollAttempt = 0; pollAttempt < 3; pollAttempt++) {
              try {
                await new Promise(r => setTimeout(r, 5000));
                const statusResult = await getOrderStatus(orderRef);
                if (statusResult.success && statusResult.data) {
                  const polledStatus = statusResult.data.orderStatus?.toLowerCase();
                  if (polledStatus === "completed") {
                    return { success: true, message: "completed", orderId, orderRef };
                  }
                  if (polledStatus === "failed" || polledStatus === "refunded") {
                    return { success: false, message: statusResult.data.orderStatus };
                  }
                }
              } catch {}
            }
            return { success: false, message: "Order queued with provider" };
          }

          return { success, message, orderId, orderRef };
        } else {
          return { success: false, message: result.error || "DataMart request failed" };
        }
      } else if (providerName === "hubnet") {
        const result = await hubnetPurchase({ phoneNumber: normalizedPhone, network: datamartNetwork, capacity: capacityGb, idempotencyKey });
        if (result.success && result.data) {
          return { success: true, message: result.data.message || "completed", orderId: result.data.reference };
        } else {
          return { success: false, message: result.error || "Hubnet request failed" };
        }
      }

      return { success: false, message: "Unknown provider" };
    };

    const primaryResult = await tryProvider(primaryProvider.providerName as ProviderName);
    providerSuccess = primaryResult.success;
    providerMessage = primaryResult.message;
    providerOrderId = primaryResult.orderId;
    providerOrderRef = primaryResult.orderRef;

    if (!providerSuccess && fallbackProvider) {
      console.log("[Purchase] Primary provider failed, trying fallback", { primary: primaryProvider.providerName, fallback: fallbackProvider.providerName, reference });
      const fallbackResult = await tryProvider(fallbackProvider.providerName as ProviderName);
      if (fallbackResult.success) {
        providerSuccess = true;
        providerMessage = fallbackResult.message;
        providerOrderId = fallbackResult.orderId;
        providerOrderRef = fallbackResult.orderRef;
        providerUsed = fallbackProvider.providerName as ProviderName;
        logServiceEvent("purchase", "fallback", "success", { provider: providerUsed, reference });
      } else {
        logServiceEvent("purchase", "fallback", "failed", { provider: fallbackProvider.providerName, error: fallbackResult.message, reference });
      }
    }

    const isReconciliation = !providerSuccess && providerMessage.toLowerCase().includes("being processed");

    if (providerSuccess || providerMessage.toLowerCase().includes("queued") || isReconciliation) {
      const finalStatus = providerSuccess ? "success" : isReconciliation ? "pending_reconciliation" : "pending";
      await sql`
        UPDATE transactions
        SET status = ${finalStatus},
            metadata = metadata || ${JSON.stringify({
              provider: providerUsed,
              state: providerSuccess ? "success" : isReconciliation ? "reconciliation_needed" : "provider_submitted",
              provider_order_id: providerOrderId,
              provider_order_ref: providerOrderRef,
              provider_message: providerMessage,
              fulfilled_at: providerSuccess ? new Date().toISOString() : undefined,
            })}::jsonb,
            updated_at = NOW()
        WHERE reference = ${reference}
      `;

      if (isReconciliation) {
        return apiResponse(true, {
          reference, amount: price, network: networkName || networkId, phone,
          status: "pending_reconciliation",
          message: providerMessage,
        }, { correlationId });
      }

      return apiResponse(true, {
        reference, amount: price, network: networkName || networkId, phone,
        status: finalStatus, providerOrderId,
        message: "Data bundle delivered successfully"
      }, { correlationId });
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
              provider: providerUsed,
              state: "refunded",
              provider_error: providerMessage,
              failed_at: new Date().toISOString(),
            }),
            reference,
          ]
        );
        await tx(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [price, userId]);
      });

      const errorCode = providerMessage.includes("unavailable") ? "SERVICE_UNAVAILABLE" : "PROVIDER_FAILED";
      return apiResponse(false, providerMessage || "Provider could not complete the request. Your wallet has been refunded.", { 
        status: 502, code: errorCode, correlationId,
        data: { reference, status: "failed" } 
      });
    }
  } catch (error) {
    console.error("Purchase API error:", error);
    return apiResponse(false, "Internal server error", { 
      status: 500, 
      code: "INTERNAL_ERROR", 
      correlationId 
    });
  }
}
