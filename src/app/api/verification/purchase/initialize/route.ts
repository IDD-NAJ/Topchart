import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import {
  initializePaystackTransaction,
  generatePaystackReference,
} from "@/lib/paystack";
import {
  getAllServices,
  calculateUserPrice,
  mapCategoryByName,
  USD_TO_GHS_RATE,
  DEFAULT_MARKUP_PERCENT,
  type LTRDuration,
} from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYSTACK_SURCHARGE = 0.04;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id, u.email, u.first_name, u.last_name
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const user = sessions[0];
    const userId = user.user_id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const { pvadealsServiceId, type = "STR", ltrDays = 3, areaCode } = body;

    if (!pvadealsServiceId) {
      return NextResponse.json({ success: false, error: "pvadealsServiceId is required" }, { status: 400 });
    }

    if (!["STR", "LTR"].includes(type)) {
      return NextResponse.json({ success: false, error: "type must be STR or LTR" }, { status: 400 });
    }

    if (type === "LTR" && ![3, 7, 14, 28, 30].includes(ltrDays)) {
      return NextResponse.json({ success: false, error: "ltrDays must be 3, 7, 14, 28, or 30" }, { status: 400 });
    }

    // Fetch live price from PVADeals
    const allServicesResult = await getAllServices();
    if (!allServicesResult.success || !allServicesResult.data) {
      return NextResponse.json({ success: false, error: "Failed to fetch services from provider" }, { status: 502 });
    }

    const pvaService = allServicesResult.data.services.find((s) => s._id === pvadealsServiceId);
    if (!pvaService) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    let markupPercent = DEFAULT_MARKUP_PERCENT;
    try {
      const rows = await sql`
        SELECT markup_percentage FROM verification_services
        WHERE pvadeals_service_id = ${pvadealsServiceId} AND is_active = true
      `;
      if (rows.length > 0) markupPercent = Number((rows[0] as any).markup_percentage);
    } catch {}

    let pvaPriceUSD: number;
    if (type === "STR") {
      pvaPriceUSD = pvaService.STRprice;
    } else {
      const dayMap: Record<number, number> = {
        3: pvaService.LTR3price,
        7: pvaService.LTR7price,
        14: pvaService.LTR14price,
        28: pvaService.LTR30price,
        30: pvaService.LTR30price,
      };
      pvaPriceUSD = dayMap[ltrDays];
    }

    const basePrice = calculateUserPrice(pvaPriceUSD, USD_TO_GHS_RATE, markupPercent);
    const surcharge = Number((basePrice * PAYSTACK_SURCHARGE).toFixed(2));
    const chargeAmount = Number((basePrice + surcharge).toFixed(2));

    const reference = `VER-PS-${generatePaystackReference()}`;
    const txId = uuidv4();
    const transactionType = type === "STR" ? "verification_STR" : "verification_LTR";

    const baseUrl =
      request.headers.get("origin") ||
      (request.nextUrl && request.nextUrl.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";
    const callbackUrl = baseUrl
      ? `${baseUrl}/dashboard/verification/callback?reference=${reference}`
      : undefined;

    await sql`
      INSERT INTO transactions (
        id, user_id, type, amount, status, reference,
        payment_method, currency, fees, metadata, created_at, updated_at
      ) VALUES (
        ${txId}, ${userId}, ${transactionType}, ${basePrice}, 'pending', ${reference},
        'PAYSTACK', 'GHS', ${surcharge},
        ${JSON.stringify({
          pvadealsServiceId,
          type,
          ltrDays,
          areaCode: areaCode || "",
          base_price: basePrice,
          surcharge,
          charge_amount: chargeAmount,
          service_name: pvaService.name,
          payment_flow: "paystack_direct",
          initiated_at: new Date().toISOString(),
        })}::jsonb,
        NOW(), NOW()
      )
    `;

    const result = await initializePaystackTransaction(
      user.email,
      Math.round(chargeAmount * 100),
      reference,
      {
        user_id: userId,
        user_name: `${user.first_name} ${user.last_name}`,
        transaction_type: transactionType,
        pvadeals_service_id: pvadealsServiceId,
        service_name: pvaService.name,
        purchase_type: type,
        ltr_days: ltrDays,
      },
      callbackUrl
    );

    if (!result.success) {
      await sql`
        UPDATE transactions SET status = 'failed', updated_at = NOW()
        WHERE reference = ${reference}
      `;
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    await sql`
      UPDATE transactions
      SET paystack_access_code = ${result.data?.access_code || null},
          paystack_authorization_url = ${result.data?.authorization_url || null},
          updated_at = NOW()
      WHERE reference = ${reference}
    `;

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: result.data?.authorization_url,
        access_code: result.data?.access_code,
        reference,
        base_price: basePrice,
        surcharge,
        charge_amount: chargeAmount,
      },
    });
  } catch (error) {
    console.error("Verification Paystack initialize error:", error);
    return NextResponse.json({ success: false, error: "Failed to initialize payment" }, { status: 500 });
  }
}
