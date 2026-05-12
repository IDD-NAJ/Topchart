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

const CATEGORIES = [
  { id: "social_media", name: "Social Media", icon: "MessageCircle" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial", icon: "CreditCard" },
  { id: "professional_tools", name: "Professional Tools", icon: "Briefcase" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment", icon: "Play" },
];

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

    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");

    // Fetch live services from PVADeals
    const pvaResult = await getAllServices();

    if (!pvaResult.success || !pvaResult.data) {
      console.error("[Verification Services] PVADeals fetch failed:", pvaResult.error);
      return NextResponse.json(
        { success: false, error: pvaResult.error || "Failed to fetch services from provider" },
        { status: 502 }
      );
    }

    const pvaServices: PVAService[] = pvaResult.data.services || [];

    // Load our DB overrides for category assignment and markup
    let dbOverrides: Record<string, { category: string; markup_percentage: number; is_active: boolean }> = {};
    try {
      const rows = await sql`
        SELECT pvadeals_service_id, category, markup_percentage, is_active
        FROM verification_services
      `;
      for (const row of rows as any[]) {
        dbOverrides[row.pvadeals_service_id] = {
          category: row.category,
          markup_percentage: Number(row.markup_percentage),
          is_active: row.is_active,
        };
      }
    } catch {
      // Table might not exist yet — proceed with defaults
    }

    // Fetch dynamic exchange rate from settings
    let exchangeRate = 15.5;
    try {
      const settings = await sql`
        SELECT value FROM app_settings WHERE key = 'exchange_rate'
      `;
      if (settings.length > 0) {
        exchangeRate = parseFloat((settings[0] as any).value) || exchangeRate;
      }
    } catch {
      try {
        const settings = await sql`
          SELECT "configValue" as value FROM "AppSetting" WHERE "configKey" = 'exchange_rate'
        `;
        if (settings.length > 0) {
          exchangeRate = parseFloat((settings[0] as any).value) || exchangeRate;
        }
      } catch {
        // Neither table exists — use default
      }
    }

    // Build enriched services
    const services = pvaServices
      .map((svc) => {
        const override = dbOverrides[svc._id];
        if (override && !override.is_active) return null;

        const markup = override?.markup_percentage ?? DEFAULT_MARKUP_PERCENT;
        const category = override?.category ?? mapCategoryByName(svc.name);

        return {
          id: svc._id,
          pvadeals_service_id: svc._id,
          name: svc.name,
          picture_url: svc.picture,
          country: svc.country,
          category,
          // USD prices from PVADeals
          str_price_usd: svc.STRprice,
          ltr3_price_usd: svc.LTR3price,
          ltr7_price_usd: svc.LTR7price,
          ltr14_price_usd: svc.LTR14price,
          ltr30_price_usd: svc.LTR30price,
          // GHS prices with markup for display
          str_price: calculateUserPrice(svc.STRprice, exchangeRate, markup),
          ltr3_price: calculateUserPrice(svc.LTR3price, exchangeRate, markup),
          ltr7_price: calculateUserPrice(svc.LTR7price, exchangeRate, markup),
          ltr14_price: calculateUserPrice(svc.LTR14price, exchangeRate, markup),
          ltr30_price: calculateUserPrice(svc.LTR30price, exchangeRate, markup),
          markup_percentage: markup,
        };
      })
      .filter(Boolean);

    const filtered = categoryFilter
      ? services.filter((s: any) => s.category === categoryFilter)
      : services;

    const grouped = filtered.reduce((acc: Record<string, any[]>, svc: any) => {
      if (!acc[svc.category]) acc[svc.category] = [];
      acc[svc.category].push(svc);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        services: filtered,
        grouped,
        categories: CATEGORIES,
        exchange_rate: exchangeRate,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errCode = (error as any)?.code;
    console.error("[Verification Services] Error:", { message: errMsg, code: errCode });
    return NextResponse.json(
      { success: false, error: errCode === "42P01" ? "Database tables not found. Run migrations first." : "Failed to fetch services" },
      { status: 500 }
    );
  }
}
