import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isSmspvaConfigured } from "@/lib/env";
import {
  SMSPVA_SERVICES,
  SMSPVA_COUNTRIES,
  getSmspvaCountAvailable,
  calculateSmspvaPrice,
} from "@/lib/smspva";
import { USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  { id: "social_media",            name: "Social Media" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment" },
  { id: "professional_tools",      name: "Professional Tools" },
  { id: "ecommerce_financial",     name: "E-Commerce & Financial" },
];

export async function GET(request: NextRequest) {
  try {
    if (!isSmspvaConfigured()) {
      return NextResponse.json(
        { success: false, error: "International numbers are not available at this time" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    if (!country) {
      return NextResponse.json(
        { success: false, error: "country query param is required" },
        { status: 400 }
      );
    }

    // ── 1. Load active services from DB (admin-managed), fall back to verified list ──
    type ServiceRow = {
      code: string;
      name: string;
      category: string;
      baseUsdPrice: number;
      markup: number;
    };

    let services: ServiceRow[] = [];
    try {
      const rows = await sql`
        SELECT service_code, name, category, base_usd_price, markup_percentage
        FROM smspva_services
        WHERE is_active = TRUE
        ORDER BY category, name
      `;
      if ((rows as any[]).length > 0) {
        services = (rows as any[]).map((r) => ({
          code: r.service_code,
          name: r.name,
          category: r.category,
          baseUsdPrice: parseFloat(String(r.base_usd_price)),
          markup: parseFloat(String(r.markup_percentage)),
        }));
      }
    } catch {
      // smspva_services table not yet created — fall back
    }

    if (services.length === 0) {
      services = SMSPVA_SERVICES.map((s) => ({
        code: s.code,
        name: s.name,
        category: s.category,
        baseUsdPrice: s.baseUsdPrice,
        markup: DEFAULT_MARKUP_PERCENT,
      }));
    }

    // ── 2. Fetch dynamic exchange rate ──
    let exchangeRate = USD_TO_GHS_RATE;
    try {
      const rateRows = await sql`SELECT value FROM app_settings WHERE key = 'exchange_rate'`;
      if ((rateRows as any[]).length > 0) {
        exchangeRate = parseFloat(String((rateRows as any[])[0].value)) || exchangeRate;
      }
    } catch { /* use default */ }

    // ── 3. Check cache (30-min TTL) ──
    const cacheThreshold = Math.floor(services.length * 0.8);
    let cached: any[] = [];
    try {
      cached = (await sql`
        SELECT service_code, count, cost_usd
        FROM smspva_availability
        WHERE country_code = ${country}
          AND cached_at > NOW() - INTERVAL '30 minutes'
      `) as any[];
    } catch { /* table may not exist */ }

    const availability: Record<string, { count: number; costUsd?: number }> = {};

    if (cached.length >= cacheThreshold) {
      // Serve from cache
      for (const row of cached) {
        availability[row.service_code] = {
          count: parseInt(String(row.count), 10) || 0,
          costUsd: row.cost_usd ? parseFloat(String(row.cost_usd)) : undefined,
        };
      }
    } else {
      // ── 4. Fetch live counts + live cost from SMSPVA API in parallel ──
      const results = await Promise.allSettled(
        services.map(async (svc) => {
          const avail = await getSmspvaCountAvailable(svc.code, country);
          return { code: svc.code, ...avail };
        })
      );

      const upserts: { code: string; count: number; costUsd?: number }[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          availability[result.value.code] = {
            count: result.value.count,
            costUsd: result.value.costUsd,
          };
          upserts.push({
            code: result.value.code,
            count: result.value.count,
            costUsd: result.value.costUsd,
          });
        }
      }

      // Persist to cache
      if (upserts.length > 0) {
        await Promise.allSettled(
          upserts.map((v) =>
            sql`
              INSERT INTO smspva_availability (country_code, service_code, count, cost_usd, cached_at)
              VALUES (${country}, ${v.code}, ${v.count}, ${v.costUsd ?? null}, NOW())
              ON CONFLICT (country_code, service_code) DO UPDATE
                SET count     = EXCLUDED.count,
                    cost_usd  = EXCLUDED.cost_usd,
                    cached_at = EXCLUDED.cached_at
            `.catch(() => {})
          )
        );
      }
    }

    // ── 5. Build enriched service list (mirrors PVADeals services shape) ──
    const enriched = services.map((svc) => {
      const avail = availability[svc.code] ?? { count: 0 };
      // Prefer live API cost; fall back to DB/static base price
      const costUsd = avail.costUsd ?? svc.baseUsdPrice;
      const ghsPrice = calculateSmspvaPrice(costUsd, exchangeRate, svc.markup);
      return {
        code: svc.code,
        name: svc.name,
        category: svc.category,
        baseUsdPrice: costUsd,
        count: avail.count,
        ghsPrice,
        available: avail.count > 0,
        markup_percentage: svc.markup,
      };
    });

    const grouped = enriched.reduce(
      (acc: Record<string, typeof enriched>, svc) => {
        if (!acc[svc.category]) acc[svc.category] = [];
        acc[svc.category].push(svc);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      data: {
        services: enriched,
        grouped,
        categories: CATEGORIES,
        countries: SMSPVA_COUNTRIES,
        country,
        exchange_rate: exchangeRate,
      },
    });
  } catch (error) {
    console.error("[SMSPVA Numbers]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch international numbers" },
      { status: 500 }
    );
  }
}
