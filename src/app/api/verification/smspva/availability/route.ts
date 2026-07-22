import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isSmspvaConfigured } from "@/lib/env";
import { SMSPVA_SERVICES, getSmspvaCountAvailable, calculateSmspvaPrice } from "@/lib/smspva";
import { USD_TO_GHS_RATE, DEFAULT_MARKUP_PERCENT } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS smspva_availability (
        country_code TEXT NOT NULL,
        service_code TEXT NOT NULL,
        count        INTEGER NOT NULL DEFAULT 0,
        cost_usd     NUMERIC(10,4),
        cached_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (country_code, service_code)
      )
    `;
    tableEnsured = true;
  } catch (e) {
    console.warn("[SMSPVA] smspva_availability table could not be created:", (e as any)?.message);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isSmspvaConfigured()) {
      return NextResponse.json(
        { success: false, error: "Verification service is temporarily unavailable" },
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

    await ensureTable();

    // Load active services from DB (respecting admin toggles + markup), fall back to hardcoded
    let activeServices: Array<{ code: string; name: string; category: string; baseUsdPrice: number; markup: number }> = [];
    try {
      const dbRows = await sql`
        SELECT service_code, name, category, base_usd_price, markup_percentage
        FROM smspva_services
        WHERE is_active = TRUE
        ORDER BY category, name
      `;
      if ((dbRows as any[]).length > 0) {
        activeServices = (dbRows as any[]).map((r) => ({
          code: r.service_code,
          name: r.name,
          category: r.category,
          baseUsdPrice: parseFloat(String(r.base_usd_price)),
          markup: parseFloat(String(r.markup_percentage)),
        }));
      }
    } catch {
      // smspva_services table not seeded yet — fall back to hardcoded list
    }

    if (activeServices.length === 0) {
      activeServices = SMSPVA_SERVICES.map((s) => ({
        code: s.code,
        name: s.name,
        category: s.category,
        baseUsdPrice: s.baseUsdPrice,
        markup: DEFAULT_MARKUP_PERCENT,
      }));
    }

    const cached = await sql`
      SELECT service_code, count, cost_usd
      FROM smspva_availability
      WHERE country_code = ${country}
        AND cached_at > NOW() - INTERVAL '30 minutes'
    `.catch(() => [] as any[]);

    const availability: Record<string, { count: number; costUsd?: number }> = {};

    const cacheThreshold = Math.floor(activeServices.length * 0.8);

    if ((cached as any[]).length >= cacheThreshold) {
      for (const row of cached as any[]) {
        availability[row.service_code] = {
          count: parseInt(String(row.count), 10) || 0,
          costUsd: row.cost_usd ? parseFloat(String(row.cost_usd)) : undefined,
        };
      }
    } else {
      const results = await Promise.allSettled(
        activeServices.map(async (svc) => {
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

      if (tableEnsured) {
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

    const services = activeServices.map((svc) => {
      const avail = availability[svc.code] ?? { count: 0 };
      const costUsd = avail.costUsd ?? svc.baseUsdPrice;
      const ghsPrice = calculateSmspvaPrice(costUsd, USD_TO_GHS_RATE, svc.markup);
      return {
        code: svc.code,
        name: svc.name,
        category: svc.category,
        baseUsdPrice: svc.baseUsdPrice,
        count: avail.count,
        ghsPrice,
        available: avail.count > 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: { services, country },
    });
  } catch (error) {
    console.error("[SMSPVA Availability]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
