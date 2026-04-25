import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import {
  purchaseSTR,
  purchaseLTR,
  getAllServices,
  calculateUserPrice,
  mapCategoryByName,
  USD_TO_GHS_RATE,
  DEFAULT_MARKUP_PERCENT,
  type LTRDuration,
} from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const correlationId = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const sessions = await sql`
      SELECT s.user_id, u.email, u.first_name, u.last_name, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired - Please log in again" },
        { status: 401 }
      );
    }

    const user = sessions[0];
    const userId = user.user_id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    // type: "STR" (20 min) | "LTR" (3/7/14/28/30 days)
    const { pvadealsServiceId, type = "STR", ltrDays = 3, areaCode } = body;

    if (!pvadealsServiceId) {
      return NextResponse.json({ success: false, error: "pvadealsServiceId is required" }, { status: 400 });
    }

    const validTypes = ["STR", "LTR"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: "type must be STR or LTR" }, { status: 400 });
    }

    if (type === "LTR" && ![3, 7, 14, 28, 30].includes(ltrDays)) {
      return NextResponse.json(
        { success: false, error: "ltrDays must be 3, 7, 14, 28, or 30" },
        { status: 400 }
      );
    }

    // Get the live service from PVADeals to confirm it exists and get prices
    const allServicesResult = await getAllServices();
    if (!allServicesResult.success || !allServicesResult.data) {
      console.error(`[${correlationId}] getAllServices failed:`, allServicesResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: "Verification provider unavailable — check API configuration", 
          code: "PROVIDER_SERVICES",
          correlationId 
        },
        { status: 502 }
      );
    }

    const pvaService = allServicesResult.data.services.find((s) => s._id === pvadealsServiceId);
    if (!pvaService) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    // Get markup from DB override, else use default
    let markupPercent = DEFAULT_MARKUP_PERCENT;
    try {
      const rows = await sql`
        SELECT markup_percentage FROM verification_services
        WHERE pvadeals_service_id = ${pvadealsServiceId} AND is_active = true
      `;
      if (rows.length > 0) markupPercent = Number((rows[0] as any).markup_percentage);
    } catch { /* table may not exist yet */ }

    // Calculate GHS price
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

    const price = calculateUserPrice(pvaPriceUSD, USD_TO_GHS_RATE, markupPercent);

    // Check wallet balance
    const walletBalance = Number(user.wallet_balance) || 0;
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

    // Purchase from PVADeals
    let pvaData: any;
    if (type === "STR") {
      const result = await purchaseSTR(pvadealsServiceId, areaCode);
      if (!result.success || !result.data) {
        // Check for provider-specific errors
        const errorMsg = result.error || "";
        let userError = errorMsg;
        let errorCode = "PROVIDER_PURCHASE";
        
        if (errorMsg.toLowerCase().includes("insufficient credits") || errorMsg.toLowerCase().includes("out of credits")) {
          userError = "Provider temporarily out of credits. Please try again in a few minutes or contact support.";
          errorCode = "INSUFFICIENT_CREDITS";
        }
        
        console.error(`[${correlationId}] purchaseSTR failed:`, errorMsg)
        return NextResponse.json(
          { 
            success: false, 
            error: userError || "Failed to purchase number from provider",
            code: errorCode,
            correlationId 
          },
          { status: 502 }
        );
      }
      pvaData = result.data.requests[0];
    } else {
      const result = await purchaseLTR(pvadealsServiceId, ltrDays as LTRDuration, areaCode);
      if (!result.success || !result.data) {
        // Check for provider-specific errors
        const errorMsg = result.error || "";
        let userError = errorMsg;
        let errorCode = "PROVIDER_PURCHASE";
        
        if (errorMsg.toLowerCase().includes("insufficient credits") || errorMsg.toLowerCase().includes("out of credits")) {
          userError = "Provider temporarily out of credits. Please try again in a few minutes or contact support.";
          errorCode = "INSUFFICIENT_CREDITS";
        }
        
        console.error(`[${correlationId}] purchaseLTR failed:`, errorMsg)
        return NextResponse.json(
          { 
            success: false, 
            error: userError || "Failed to purchase LTR number from provider",
            code: errorCode,
            correlationId 
          },
          { status: 502 }
        );
      }
      pvaData = result.data;
    }

    const reference = `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(pvaData.endTime);
    const numberId = uuidv4();
    const category = mapCategoryByName(pvaService.name);

    try {
      // Deduct from wallet
      await sql`
        UPDATE users SET wallet_balance = wallet_balance - ${price} WHERE id = ${userId}
      `;

      // Upsert service into verification_services for category/markup tracking
      try {
        await sql`
          INSERT INTO verification_services (
            pvadeals_service_id, name, category, picture_url, country,
            str_price, ltr3_price, ltr7_price, ltr14_price, ltr30_price,
            markup_percentage, is_active, created_at, updated_at
          ) VALUES (
            ${pvadealsServiceId}, ${pvaService.name}, ${category},
            ${pvaService.picture}, ${pvaService.country},
            ${pvaService.STRprice}, ${pvaService.LTR3price}, ${pvaService.LTR7price},
            ${pvaService.LTR14price}, ${pvaService.LTR30price},
            ${markupPercent}, true, NOW(), NOW()
          )
          ON CONFLICT (pvadeals_service_id) DO NOTHING
        `;
      } catch { /* ignore if table schema differs */ }

      // Get or create service DB record
      let serviceDbId: string | null = null;
      try {
        const svcRows = await sql`
          SELECT id FROM verification_services WHERE pvadeals_service_id = ${pvadealsServiceId}
        `;
        serviceDbId = svcRows.length > 0 ? (svcRows[0] as any).id : null;
      } catch { /* ignore */ }

      // Create number record
      await sql`
        INSERT INTO verification_numbers (
          id, user_id, service_id, number, type, status,
          pvadeals_request_id, purchase_price,
          ltr_duration_days, rental_duration_hours,
          allow_flag, allow_reuse, auto_renew,
          expires_at, created_at, updated_at
        ) VALUES (
          ${numberId}, ${userId}, ${serviceDbId}, ${pvaData.number}, ${type}, 'active',
          ${pvaData._id}, ${price},
          ${type === "LTR" ? ltrDays : null},
          ${type === "LTR" ? ltrDays * 24 : 0},
          ${pvaData.allowFlag ?? true}, ${pvaData.allowReuse ?? false}, ${pvaData.autoRenewEnable ?? false},
          ${expiresAt.toISOString()}, NOW(), NOW()
        )
      `;

      // Create transaction record
      const transactionId = uuidv4();
      const transactionType = type === "STR" ? "verification_STR" : "verification_LTR";
      await sql`
        INSERT INTO transactions (
          id, user_id, type, amount, status, reference,
          description, verification_number_id, created_at
        ) VALUES (
          ${transactionId}, ${userId}, ${transactionType}, ${price}, 'success', ${reference},
          ${`${pvaService.name} ${type}${type === "LTR" ? ` ${ltrDays}-day` : " 20-min"} verification`},
          ${numberId}, NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        data: {
          number_id: numberId,
          pvadeals_request_id: pvaData._id,
          number: pvaData.number,
          service_name: pvaService.name,
          type,
          ltr_days: type === "LTR" ? ltrDays : null,
          price,
          expires_at: expiresAt.toISOString(),
          allow_flag: pvaData.allowFlag,
          allow_reuse: pvaData.allowReuse,
          auto_renew: pvaData.autoRenewEnable ?? false,
          reference,
        },
      });
    } catch (dbError) {
      // Attempt to flag/cancel the PVADeals number on DB failure
      try {
        const { flagNumber } = await import("@/lib/pvadeals");
        await flagNumber(pvaData._id);
      } catch (cancelError) {
        console.error("Failed to cancel PVADeals number after DB error:", cancelError);
      }
      console.error("Database transaction error:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to complete purchase due to a database error. Please try again or contact support if the issue persists.",
          code: "DATABASE_ERROR",
          correlationId,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Verification purchase error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process purchase. Please try again.",
        code: "PROCESSING_ERROR",
        correlationId,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
