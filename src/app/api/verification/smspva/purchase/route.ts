import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import { isSmspvaConfigured } from "@/lib/env";
import {
  getSmspvaNumber,
  getSmspvaCountAvailable,
  banSmspvaNumber,
  calculateSmspvaPrice,
  SMSPVA_SERVICES,
} from "@/lib/smspva";
import { USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const correlationId = `sva-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    if (!isSmspvaConfigured()) {
      return NextResponse.json(
        { success: false, error: "International numbers are not available at this time", code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;
    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const userId = sessions[0].user_id;
    const walletBalance = Number(sessions[0].wallet_balance) || 0;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const { smspvaServiceCode, countryCode, serviceName } = body;

    if (!smspvaServiceCode || !countryCode) {
      return NextResponse.json(
        { success: false, error: "smspvaServiceCode and countryCode are required" },
        { status: 400 }
      );
    }

    // ── Resolve service from DB; fall back to verified static list ──────────────
    let serviceName_resolved = serviceName as string | undefined;
    let baseUsdPrice = 0.10;
    let markupPct = DEFAULT_MARKUP_PERCENT;
    let exchangeRate = USD_TO_GHS_RATE;

    try {
      const [dbSvc, dbRate] = await Promise.all([
        sql`SELECT name, base_usd_price, markup_percentage FROM smspva_services WHERE service_code = ${smspvaServiceCode} AND is_active = TRUE`.catch(() => []),
        sql`SELECT value FROM app_settings WHERE key = 'exchange_rate'`.catch(() => []),
      ]);
      if ((dbSvc as any[]).length > 0) {
        serviceName_resolved = serviceName_resolved || (dbSvc as any[])[0].name;
        baseUsdPrice = parseFloat(String((dbSvc as any[])[0].base_usd_price));
        markupPct = parseFloat(String((dbSvc as any[])[0].markup_percentage));
      } else {
        // Not in DB — try static fallback list
        const fallback = SMSPVA_SERVICES.find((s) => s.code === smspvaServiceCode);
        if (!fallback) {
          return NextResponse.json({ success: false, error: "This service is not available" }, { status: 400 });
        }
        serviceName_resolved = serviceName_resolved || fallback.name;
        baseUsdPrice = fallback.baseUsdPrice;
      }
      if ((dbRate as any[]).length > 0) {
        exchangeRate = parseFloat(String((dbRate as any[])[0].value)) || exchangeRate;
      }
    } catch {
      // DB unavailable — use static fallback
      const fallback = SMSPVA_SERVICES.find((s) => s.code === smspvaServiceCode);
      if (!fallback) {
        return NextResponse.json({ success: false, error: "This service is not available" }, { status: 400 });
      }
      serviceName_resolved = serviceName_resolved || fallback.name;
      baseUsdPrice = fallback.baseUsdPrice;
    }

    // ── Pre-purchase: verify live stock + use live API cost ──────────────────────
    const stockCheck = await getSmspvaCountAvailable(smspvaServiceCode, countryCode);
    if (stockCheck.count === 0) {
      return NextResponse.json(
        { success: false, error: "No numbers are available for this service right now. Please try a different country or check back later.", code: "NO_STOCK" },
        { status: 503 }
      );
    }
    // Prefer live API cost over static price (same as PVADeals using live prices)
    if (stockCheck.costUsd && stockCheck.costUsd > 0) {
      baseUsdPrice = stockCheck.costUsd;
    }

    const price = calculateSmspvaPrice(baseUsdPrice, exchangeRate, markupPct);

    if (walletBalance < price) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient wallet balance",
          data: { required: price, balance: walletBalance, shortfall: price - walletBalance },
        },
        { status: 400 }
      );
    }

    const purchaseResult = await getSmspvaNumber(smspvaServiceCode, countryCode);
    if (!purchaseResult.ok) {
      console.error(`[${correlationId}] SMSPVA get_number failed:`, purchaseResult.error);

      // Map SMSPVA response codes to meaningful HTTP statuses
      const rc = (purchaseResult as any).responseCode;
      const errMsg = purchaseResult.error || "Failed to get number from provider";
      const isNoNumbers = rc === "2" || /no.*(number|avail)/i.test(errMsg);
      const isWrongService = rc === "10" || /wrong.*service/i.test(errMsg);
      const isProviderBalance = rc === "3" || /balance|credit|fund/i.test(errMsg);
      const isApiError = rc === "error" || rc === "";
      const isNetworkError = !rc && /network|timeout|ECONNREFUSED|fetch|HTTP/i.test(errMsg);

      const httpStatus = isWrongService ? 400 : isNetworkError ? 502 : 503;
      const userMessage = isNoNumbers
        ? "No numbers are available for this service right now. Please try a different country or check back later."
        : isWrongService
        ? "This service is not supported at the moment."
        : isProviderBalance
        ? "International numbers are temporarily unavailable. Please contact support."
        : isApiError
        ? "International numbers are currently unavailable. Please try again later."
        : isNetworkError
        ? "Could not connect to the provider. Please try again in a few moments."
        : "Failed to get a number. Please try again.";

      return NextResponse.json(
        { success: false, error: userMessage, code: "PROVIDER_PURCHASE", correlationId },
        { status: httpStatus }
      );
    }

    const { id: smspvaOrderId, number, countryCode: numCountryCode, fullNumber } = purchaseResult.data;
    const numberId = uuidv4();
    const reference = `SVA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const displayName = serviceName_resolved || smspvaServiceCode;

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    try {
      await sql`UPDATE users SET wallet_balance = wallet_balance - ${price} WHERE id = ${userId}`;

      await sql`
        INSERT INTO verification_numbers (
          id, user_id, service_id, number, type, status,
          pvadeals_request_id, purchase_price,
          ltr_duration_days, rental_duration_hours,
          allow_flag, allow_reuse, auto_renew,
          expires_at, created_at, updated_at,
          metadata
        ) VALUES (
          ${numberId}, ${userId}, ${null}, ${fullNumber || number}, 'STR', 'active',
          ${null}, ${price},
          ${null}, ${0},
          ${true}, ${false}, ${false},
          ${expiresAt.toISOString()}, NOW(), NOW(),
          ${JSON.stringify({
            provider: "smspva",
            smspva_order_id: smspvaOrderId,
            smspva_service: smspvaServiceCode,
            smspva_country: countryCode,
            service_name: displayName,
            country_code: numCountryCode,
          })}::jsonb
        )
      `.catch(async () => {
        await sql`
          INSERT INTO verification_numbers (
            id, user_id, number, type, status,
            pvadeals_request_id, purchase_price,
            allow_flag, allow_reuse, auto_renew,
            expires_at, created_at, updated_at
          ) VALUES (
            ${numberId}, ${userId}, ${fullNumber || number}, 'STR', 'active',
            ${`smspva:${smspvaOrderId}:${smspvaServiceCode}`}, ${price},
            ${true}, ${false}, ${false},
            ${expiresAt.toISOString()}, NOW(), NOW()
          )
        `;
      });

      const transactionId = uuidv4();
      await sql`
        INSERT INTO transactions (
          id, user_id, type, amount, status, reference,
          description, verification_number_id, created_at
        ) VALUES (
          ${transactionId}, ${userId}, 'verification_STR', ${price}, 'success', ${reference},
          ${`${displayName} — International STR 20-min`},
          ${numberId}, NOW()
        )
      `.catch(() => {});

      return NextResponse.json({
        success: true,
        data: {
          number_id: numberId,
          provider: "smspva",
          smspva_order_id: smspvaOrderId,
          number: fullNumber || number,
          service_name: displayName,
          type: "STR",
          price,
          expires_at: expiresAt.toISOString(),
          allow_flag: true,
          allow_reuse: false,
          reference,
        },
      });
    } catch (dbError) {
      await banSmspvaNumber(smspvaOrderId, smspvaServiceCode).catch(() => {});
      console.error(`[${correlationId}] DB error after SMSPVA purchase:`, dbError);
      return NextResponse.json(
        { success: false, error: "Failed to save purchase. Please contact support.", code: "DATABASE_ERROR", correlationId },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[${correlationId}] SMSPVA purchase error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to process purchase", code: "PROCESSING_ERROR", correlationId },
      { status: 500 }
    );
  }
}
