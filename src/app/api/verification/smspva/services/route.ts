import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isSmspvaConfigured } from "@/lib/env";
import { SMSPVA_SERVICES, SMSPVA_COUNTRIES, calculateSmspvaPrice } from "@/lib/smspva";
import { USD_TO_GHS_RATE } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    if (!isSmspvaConfigured()) {
      return NextResponse.json(
        { success: false, error: "International numbers are not available at this time" },
        { status: 503 }
      );
    }

    let services: Array<{ code: string; name: string; category: string; baseUsdPrice: number; ghsPrice: number }> = [];

    try {
      const rows = await sql`
        SELECT service_code, name, category, base_usd_price, markup_percentage
        FROM smspva_services
        WHERE is_active = TRUE
        ORDER BY category, name
      `;

      if (rows.length > 0) {
        services = (rows as any[]).map((row) => ({
          code: row.service_code,
          name: row.name,
          category: row.category,
          baseUsdPrice: parseFloat(String(row.base_usd_price)),
          ghsPrice: calculateSmspvaPrice(
            parseFloat(String(row.base_usd_price)),
            USD_TO_GHS_RATE,
            parseFloat(String(row.markup_percentage))
          ),
        }));
      }
    } catch {
      // DB table may not exist yet — fall through to hardcoded fallback
    }

    if (services.length === 0) {
      const DEFAULT_MARKUP = 40;
      services = SMSPVA_SERVICES.map((s) => ({
        code: s.code,
        name: s.name,
        category: s.category,
        baseUsdPrice: s.baseUsdPrice,
        ghsPrice: calculateSmspvaPrice(s.baseUsdPrice, USD_TO_GHS_RATE, DEFAULT_MARKUP),
      }));
    }

    return NextResponse.json({
      success: true,
      data: { services, countries: SMSPVA_COUNTRIES },
    });
  } catch (error) {
    console.error("[SMSPVA Services] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
