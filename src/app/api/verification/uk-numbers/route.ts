import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
  getAllServices,
  calculateUserPrice,
  mapCategoryByName,
  DEFAULT_MARKUP_PERCENT,
  type PVAService,
} from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
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

    // Fetch all live services from PVADeals
    const pvaResult = await getAllServices();

    if (!pvaResult.success || !pvaResult.data) {
      return NextResponse.json(
        { success: false, error: pvaResult.error || "Failed to fetch services from provider" },
        { status: 502 }
      );
    }

    const allServices: PVAService[] = pvaResult.data.services || [];

    // Filter to UK (GB) only
    const ukServices = allServices.filter(
      (s) => s.country && s.country.toUpperCase() === "GB"
    );

    // Fetch dynamic exchange rate
    let exchangeRate = 15.5;
    try {
      const settings = await sql`
        SELECT value FROM app_settings WHERE key = 'exchange_rate'
      `;
      if (settings.length > 0) {
        exchangeRate = parseFloat((settings[0] as any).value) || exchangeRate;
      }
    } catch {
      // use default
    }

    // Fetch DB overrides for markup
    let dbOverrides: Record<string, { markup_percentage: number; is_active: boolean }> = {};
    try {
      const rows = await sql`
        SELECT pvadeals_service_id, markup_percentage, is_active
        FROM verification_services
        WHERE country = 'GB'
      `;
      for (const row of rows as any[]) {
        dbOverrides[row.pvadeals_service_id] = {
          markup_percentage: Number(row.markup_percentage),
          is_active: row.is_active,
        };
      }
    } catch {
      // table may not exist yet
    }

    const services = ukServices
      .map((svc) => {
        const override = dbOverrides[svc._id];
        if (override && !override.is_active) return null;

        const markup = override?.markup_percentage ?? DEFAULT_MARKUP_PERCENT;
        const category = mapCategoryByName(svc.name);

        return {
          id: svc._id,
          pvadeals_service_id: svc._id,
          name: svc.name,
          picture_url: svc.picture,
          country: "GB",
          country_name: "United Kingdom",
          category,
          str_price_usd: svc.STRprice,
          ltr3_price_usd: svc.LTR3price,
          ltr7_price_usd: svc.LTR7price,
          ltr14_price_usd: svc.LTR14price,
          ltr30_price_usd: svc.LTR30price,
          str_price: calculateUserPrice(svc.STRprice, exchangeRate, markup),
          ltr3_price: calculateUserPrice(svc.LTR3price, exchangeRate, markup),
          ltr7_price: calculateUserPrice(svc.LTR7price, exchangeRate, markup),
          ltr14_price: calculateUserPrice(svc.LTR14price, exchangeRate, markup),
          ltr30_price: calculateUserPrice(svc.LTR30price, exchangeRate, markup),
          markup_percentage: markup,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        services,
        total: services.length,
        exchange_rate: exchangeRate,
        country: "GB",
        country_name: "United Kingdom",
      },
    });
  } catch (error) {
    console.error("[UK Numbers API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch UK numbers" },
      { status: 500 }
    );
  }
}
