import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import { isSmspvaConfigured } from "@/lib/env";
import {
  SMSPVA_SERVICES,
  getSmspvaNumber,
  banSmspvaNumber,
  calculateSmspvaPrice,
} from "@/lib/smspva";
import { USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const correlationId = `sva-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    if (!isSmspvaConfigured()) {
      return NextResponse.json(
        { success: false, error: "SMSPVA provider not configured", code: "NOT_CONFIGURED" },
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

    const serviceEntry = SMSPVA_SERVICES.find((s) => s.code === smspvaServiceCode);
    if (!serviceEntry) {
      return NextResponse.json({ success: false, error: "Unknown SMSPVA service code" }, { status: 400 });
    }

    const price = calculateSmspvaPrice(
      serviceEntry.baseUsdPrice,
      USD_TO_GHS_RATE,
      DEFAULT_MARKUP_PERCENT
    );

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
      return NextResponse.json(
        { success: false, error: purchaseResult.error || "Failed to get number from provider", code: "PROVIDER_PURCHASE", correlationId },
        { status: 502 }
      );
    }

    const { id: smspvaOrderId, number, countryCode: numCountryCode, fullNumber } = purchaseResult.data;
    const numberId = uuidv4();
    const reference = `SVA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const displayName = serviceName || serviceEntry.name;

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
          ${`${displayName} STR 20-min verification (SMSPVA)`},
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
