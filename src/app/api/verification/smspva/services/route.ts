import { NextRequest, NextResponse } from "next/server";
import { isSmspvaConfigured } from "@/lib/env";
import { SMSPVA_SERVICES, SMSPVA_COUNTRIES, calculateSmspvaPrice } from "@/lib/smspva";
import { USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isSmspvaConfigured()) {
      return NextResponse.json(
        { success: false, error: "SMSPVA provider not configured" },
        { status: 503 }
      );
    }

    const services = SMSPVA_SERVICES.map((s) => ({
      ...s,
      ghsPrice: calculateSmspvaPrice(s.baseUsdPrice, USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT),
    }));

    return NextResponse.json({
      success: true,
      data: {
        services,
        countries: SMSPVA_COUNTRIES,
      },
    });
  } catch (error) {
    console.error("[SMSPVA Services] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SMSPVA services" },
      { status: 500 }
    );
  }
}
