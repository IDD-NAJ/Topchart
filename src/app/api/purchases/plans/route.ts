import { NextRequest, NextResponse } from "next/server";
import { getDataPlans, getNetworks, getAccountInfo } from "@/lib/datamart";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const revalidate = 60;
export const runtime = "nodejs";

type CachedPlan = {
  id: string;
  networkId: string;
  network: string;
  name: string;
  validity: string | null;
  validityHours: number | null;
  validityDays: number | null;
  providerPrice: number;
  effectivePrice: number;
  priceOverride: number | null;
  markupPercent: number | null;
  isPopular: boolean;
  isActive: boolean;
  isFeatured: boolean;
  datamartPlanId: string | null;
  datamartPlanType: string | null;
  syncedAt: string | null;
};

const globalCache = globalThis as unknown as {
  datamartPlansCache?: { data: CachedPlan[]; fetchedAt: string };
  datamartNetworksCache?: { data: unknown[]; fetchedAt: string };
};

function calculateEffectivePrice(
  providerPrice: number,
  priceOverride: number | null,
  markupPercent: number | null
): number {
  if (priceOverride !== null && priceOverride > 0) {
    return priceOverride;
  }
  if (markupPercent !== null && markupPercent > 0) {
    const markup = providerPrice * (markupPercent / 100);
    return Number((providerPrice + markup).toFixed(2));
  }
  return providerPrice;
}

async function fetchPlansFromCache(network?: string): Promise<{ success: true; data: CachedPlan[]; stale: boolean; fetchedAt: string | null } | { success: false; error: string }> {
  try {
    const query = network
      ? sql`
          SELECT 
            id,
            network_id as "networkId",
            network,
            name,
            validity,
            validity_hours as "validityHours",
            validity_days as "validityDays",
            price as "providerPrice",
            price_override as "priceOverride",
            markup_percent as "markupPercent",
            is_popular as "isPopular",
            is_active as "isActive",
            is_featured as "isFeatured",
            datamart_plan_id as "datamartPlanId",
            datamart_plan_type as "datamartPlanType",
            synced_at as "syncedAt"
          FROM data_bundles
          WHERE is_active = true AND network = ${network}
          ORDER BY price ASC
        `
      : sql`
          SELECT 
            id,
            network_id as "networkId",
            network,
            name,
            validity,
            validity_hours as "validityHours",
            validity_days as "validityDays",
            price as "providerPrice",
            price_override as "priceOverride",
            markup_percent as "markupPercent",
            is_popular as "isPopular",
            is_active as "isActive",
            is_featured as "isFeatured",
            datamart_plan_id as "datamartPlanId",
            datamart_plan_type as "datamartPlanType",
            synced_at as "syncedAt"
          FROM data_bundles
          WHERE is_active = true
          ORDER BY network, price ASC
        `;

    const rows = await query;

    if (rows.length === 0) {
      return { success: false, error: "No cached plans found" };
    }

    const plans: CachedPlan[] = rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      networkId: String(row.networkId),
      network: String(row.network),
      name: String(row.name),
      validity: row.validity ? String(row.validity) : null,
      validityHours: row.validityHours ? Number(row.validityHours) : null,
      validityDays: row.validityDays ? Number(row.validityDays) : null,
      providerPrice: Number(row.providerPrice),
      effectivePrice: calculateEffectivePrice(
        Number(row.providerPrice),
        row.priceOverride ? Number(row.priceOverride) : null,
        row.markupPercent ? Number(row.markupPercent) : null
      ),
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
      markupPercent: row.markupPercent ? Number(row.markupPercent) : null,
      isPopular: Boolean(row.isPopular),
      isActive: Boolean(row.isActive),
      isFeatured: Boolean(row.isFeatured),
      datamartPlanId: row.datamartPlanId ? String(row.datamartPlanId) : null,
      datamartPlanType: row.datamartPlanType ? String(row.datamartPlanType) : null,
      syncedAt: row.syncedAt ? String(row.syncedAt) : null,
    }));

    const oldestSync = plans
      .filter(p => p.syncedAt)
      .map(p => new Date(p.syncedAt!).getTime())
      .sort((a, b) => a - b)[0];
    
    const isStale = oldestSync ? Date.now() - oldestSync > 24 * 60 * 60 * 1000 : true;
    const fetchedAt = oldestSync ? new Date(oldestSync).toISOString() : null;

    return { success: true, data: plans, stale: isStale, fetchedAt };
  } catch (error) {
    const e = error as { code?: string; message?: string };
    if (e?.code === "42P01") {
      return { success: false, error: "Database table not found" };
    }
    console.error("Cache fetch error:", error);
    return { success: false, error: "Failed to fetch from cache" };
  }
}

async function syncPlansFromDataMart(network?: string): Promise<{ success: boolean; syncedCount?: number; error?: string; errorCode?: string }> {
  const networksResult = await getNetworks();
  if (!networksResult.success) {
    return { 
      success: false, 
      error: networksResult.error || "Failed to fetch networks from DataMart",
      errorCode: networksResult.errorCode || "PROVIDER_NETWORK_ERROR"
    };
  }

  const networks = networksResult.data || [];
  const targetNetworks = network
    ? networks.filter(n => n.name.toLowerCase() === network.toLowerCase() || n.id.toLowerCase() === network.toLowerCase())
    : networks;

  let syncedCount = 0;

  for (const net of targetNetworks) {
    try {
      const plansResult = await getDataPlans(net.id);
      if (!plansResult.success) {
        console.warn(`Failed to fetch plans for network ${net.name}: ${plansResult.error}`);
        continue;
      }

      const plans = plansResult.data || [];

      for (const plan of plans) {
        try {
          const planName = plan.data_plan || "Unknown Plan";
          const providerPrice = parseFloat(plan.plan_amount || "0");
          const monthValidate = plan.month_validate || "";

          let validityHours: number | null = null;
          let validityDays: number | null = null;
          let validity = monthValidate;

          if (monthValidate) {
            const match = monthValidate.match(/(\d+)\s*(hour|hr|day|week|month)/i);
            if (match) {
              const value = parseInt(match[1]);
              const unit = match[2].toLowerCase();
              if (unit.includes("hour")) validityHours = value;
              else if (unit.includes("day")) validityDays = value;
              else if (unit.includes("week")) validityDays = value * 7;
              else if (unit.includes("month")) validityDays = value * 30;
            }
          }

          await sql`
            INSERT INTO data_bundles (
              network_id,
              network,
              name,
              validity,
              validity_hours,
              validity_days,
              price,
              original_price,
              datamart_plan_id,
              datamart_plan_type,
              is_active,
              synced_at,
              metadata
            ) VALUES (
              ${net.id},
              ${net.name},
              ${planName},
              ${validity},
              ${validityHours},
              ${validityDays},
              ${providerPrice},
              ${providerPrice},
              ${plan.id},
              ${plan.plan_type || null},
              ${true},
              ${new Date().toISOString()},
              ${JSON.stringify(plan)}
            )
            ON CONFLICT (datamart_plan_id) 
            DO UPDATE SET
              name = EXCLUDED.name,
              validity = EXCLUDED.validity,
              validity_hours = EXCLUDED.validity_hours,
              validity_days = EXCLUDED.validity_days,
              price = EXCLUDED.price,
              original_price = EXCLUDED.original_price,
              datamart_plan_type = EXCLUDED.datamart_plan_type,
              synced_at = EXCLUDED.synced_at,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
            WHERE data_bundles.price_override IS NULL
          `;

          syncedCount++;
        } catch (planError) {
          console.error(`Failed to sync plan ${plan.id}:`, planError);
        }
      }
    } catch (networkError) {
      console.error(`Failed to process network ${net.name}:`, networkError);
    }
  }

  if (syncedCount === 0 && targetNetworks.length > 0) {
    return { 
      success: false, 
      error: "No plans could be synced from DataMart",
      errorCode: "PROVIDER_SYNC_FAILED"
    };
  }

  return { success: true, syncedCount };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");
    const query = searchParams.get("q");
    const refresh = searchParams.get("refresh") === "true";

    if (query === "networks") {
      const result = await getNetworks();
      if (result.success) {
        globalCache.datamartNetworksCache = {
          data: Array.isArray(result.data) ? result.data : [],
          fetchedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, data: result.data, stale: false });
      }
      if (globalCache.datamartNetworksCache) {
        return NextResponse.json({
          success: true,
          data: globalCache.datamartNetworksCache.data,
          stale: true,
          fetchedAt: globalCache.datamartNetworksCache.fetchedAt,
          providerError: "Provider endpoint is unavailable; showing cached networks.",
          code: result.errorCode,
        });
      }
      return NextResponse.json(
        { success: false, error: result.error || "Failed to fetch networks", code: result.errorCode },
        { status: 502 }
      );
    }

    if (query === "balance") {
      const adminCheck = await requireAdmin();
      if (!adminCheck.ok) {
        return NextResponse.json(
          { success: false, error: adminCheck.error },
          { status: adminCheck.status }
        );
      }
      const result = await getAccountInfo();
      return NextResponse.json(result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error, code: result.errorCode }
      );
    }

    const cacheResult = await fetchPlansFromCache(network || undefined);
    
    if (!refresh && cacheResult.success && !cacheResult.stale) {
      return NextResponse.json({
        success: true,
        data: cacheResult.data,
        stale: false,
        fromCache: true,
        fetchedAt: cacheResult.fetchedAt,
      });
    }

    const syncResult = await syncPlansFromDataMart(network || undefined);

    if (syncResult.success) {
      const freshCache = await fetchPlansFromCache(network || undefined);
      if (freshCache.success) {
        globalCache.datamartPlansCache = {
          data: freshCache.data,
          fetchedAt: new Date().toISOString(),
        };
        return NextResponse.json({
          success: true,
          data: freshCache.data,
          stale: false,
          fromCache: true,
          fetchedAt: freshCache.fetchedAt,
          syncedCount: syncResult.syncedCount,
        });
      }
    }

    if (cacheResult.success) {
      return NextResponse.json({
        success: true,
        data: cacheResult.data,
        stale: true,
        fromCache: true,
        fetchedAt: cacheResult.fetchedAt,
        providerError: "Provider endpoint is unavailable; showing cached plans.",
        code: syncResult.errorCode || "PROVIDER_UNAVAILABLE",
      });
    }

    if (globalCache.datamartPlansCache) {
      return NextResponse.json({
        success: true,
        data: globalCache.datamartPlansCache.data,
        stale: true,
        fetchedAt: globalCache.datamartPlansCache.fetchedAt,
        providerError: "Provider endpoint is unavailable; showing cached plans.",
        code: syncResult.errorCode || "PROVIDER_UNAVAILABLE",
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: syncResult.error || "Provider is temporarily unavailable. Please try again later.",
        code: syncResult.errorCode || "PROVIDER_UNAVAILABLE"
      },
      { status: 502 }
    );
  } catch (err) {
    console.error("Plans API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
