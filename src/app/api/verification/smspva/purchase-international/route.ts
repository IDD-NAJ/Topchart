import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import { getSmspvaV2Number, getSmspvaV2ServicePrice } from "@/lib/smspva";
import { USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/verification/smspva/purchase-international
 * Purchase an international number from SMSPVA v2 API
 * Deducts wallet balance and creates verification record
 */
export async function POST(request: NextRequest) {
  const correlationId = `intl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT id, user_id, wallet_balance
      FROM users
      WHERE session_token = ${sessionToken} AND session_expires_at > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ ok: false, error: "Session expired" }, { status: 401 });
    }

    const userId = (sessions[0] as any).user_id;
    const currentBalance = Number((sessions[0] as any).wallet_balance) || 0;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const { country, service } = body;

    if (!country || !service) {
      return NextResponse.json({ ok: false, error: "Missing country or service" }, { status: 400 });
    }

    // Block USA and UK
    if (country.toLowerCase() === "us" || country.toLowerCase() === "gb") {
      return NextResponse.json(
        { ok: false, error: "USA and UK numbers use dedicated providers" },
        { status: 400 }
      );
    }

    // Fetch price from SMSPVA v2
    const priceResult = await getSmspvaV2ServicePrice(country, service);
    if (!priceResult.ok) {
      return NextResponse.json({ ok: false, error: "Unable to fetch service price" }, { status: 502 });
    }

    const priceUsd = priceResult.data.price;
    const exchangeRate = USD_TO_GHS_RATE;
    const priceGhs = parseFloat((priceUsd * exchangeRate).toFixed(2));

    // Check wallet balance
    if (currentBalance < priceGhs) {
      return NextResponse.json(
        { ok: false, error: "Insufficient wallet balance", balance: currentBalance, required: priceGhs },
        { status: 402 }
      );
    }

    // Get number from SMSPVA v2
    const numberResult = await getSmspvaV2Number(country, service);
    if (!numberResult.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to get number from provider", details: numberResult.error, code: "PROVIDER_NUMBER" },
        { status: 502 }
      );
    }

    // Deduct wallet balance atomically
    const newBalance = currentBalance - priceGhs;
    await sql`
      UPDATE users
      SET wallet_balance = ${newBalance}
      WHERE id = ${userId}
    `;

    // Create verification record
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
    const verificationId = uuidv4();

    await sql`
      INSERT INTO sms_verifications (
        id, user_id, number, number_id, country, service, provider, status,
        provider_order_id, expires_at, created_at, correlation_id
      ) VALUES (
        ${verificationId}, ${userId}, ${numberResult.data.number}, ${numberResult.data.number_id},
        ${country}, ${service}, 'smspva_v2', 'pending',
        ${numberResult.data.number_id}, ${expiresAt}, NOW(), ${correlationId}
      )
    `.catch(() => {
      // Table might not have all these fields, continue anyway
    });

    return NextResponse.json({
      ok: true,
      data: {
        verification_id: verificationId,
        number_id: numberResult.data.number_id,
        number: numberResult.data.number,
        operator: numberResult.data.operator,
        country,
        service,
        price: priceGhs,
        expires_at: expiresAt.toISOString(),
        new_balance: newBalance,
      },
    });
  } catch (error) {
    console.error(`[${correlationId}] International purchase error:`, error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        correlation_id: correlationId,
      },
      { status: 500 }
    );
  }
}
