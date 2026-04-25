import { NextRequest, NextResponse } from "next/server";
import { getNetworks, getBalance, resolveNetworkCode, type DatamartNetworkCode } from "@/lib/datamart";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { syncDatamartPlans } from "@/lib/datamart-sync";

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

const FRONTEND_TO_DB_NETWORK: Record<string, string> = {
  mtn: "MTN",
  vodafone: "VODAFONE",
  telecel: "VODAFONE",
  airteltigo: "AIRTELTIGO",
  "airtel-tigo": "AIRTELTIGO",
  at: "AIRTELTIGO",
  glo: "GLO",
};

function getScopedDatamartNetworks(network?: string): DatamartNetworkCode[] | undefined {
  if (!network) return undefined;
  const resolved = resolveNetworkCode(network);
  if (resolved === "YELLO" || resolved === "TELECEL" || resolved === "AT_PREMIUM" || resolved === "at") {
    return [resolved as DatamartNetworkCode];
  }
  return undefined;
}

async function fetchPlansFromCache(network?: string): Promise<{ success: true; data: CachedPlan[]; stale: boolean; fetchedAt: string | null } | { success: false; error: string }> {
  try {
    const dbNetworkCode = network ? (FRONTEND_TO_DB_NETWORK[network.toLowerCase()] || network.toUpperCase()) : undefined;

    const rows = dbNetworkCode
      ? sql`
          SELECT 
            b.id,
            b.network_id,
            b.name,
            b.size_mb,
            b.validity_hours,
            b.price as "providerPrice",
            b.price_override as "priceOverride",
            b.markup_percent as "markupPercent",
            b.is_popular as "isPopular",
            b.is_active as "isActive",
            b.is_featured as "isFeatured",
            b.datamart_plan_id as "datamartPlanId",
            b.datamart_plan_type as "datamartPlanType",
            b.synced_at as "syncedAt",
            b.updated_at
          FROM data_bundles b
          WHERE b.is_active = true AND b.network_id = ${dbNetworkCode}
          ORDER BY b.price ASC
        `
      : sql`
          SELECT 
            b.id,
            b.network_id,
            b.name,
            b.size_mb,
            b.validity_hours,
            b.price as "providerPrice",
            b.price_override as "priceOverride",
            b.markup_percent as "markupPercent",
            b.is_popular as "isPopular",
            b.is_active as "isActive",
            b.is_featured as "isFeatured",
            b.datamart_plan_id as "datamartPlanId",
            b.datamart_plan_type as "datamartPlanType",
            b.synced_at as "syncedAt",
            b.updated_at
          FROM data_bundles b
          WHERE b.is_active = true
          ORDER BY b.network_id, b.price ASC
        `;

    const result = await rows;

    if (result.length === 0) {
      return { success: false, error: "No cached plans found" };
    }

    const plans: CachedPlan[] = result.map((row: Record<string, unknown>) => {
      const providerPrice = Number(row.providerPrice);
      const priceOverride = row.priceOverride ? Number(row.priceOverride) : null;
      const markupPercent = row.markupPercent ? Number(row.markupPercent) : null;
      const effectivePrice = calculateEffectivePrice(providerPrice, priceOverride, markupPercent);
      return {
        id: String(row.id),
        networkId: String(row.network_id),
        network: String(row.network_id || ""),
        name: String(row.name),
        validity: row.validity_hours ? `${Math.round(Number(row.validity_hours) / 24)} days` : null,
        validityHours: row.validity_hours ? Number(row.validity_hours) : null,
        validityDays: row.validity_hours ? Math.round(Number(row.validity_hours) / 24) : null,
        providerPrice,
        effectivePrice,
        priceOverride,
        markupPercent,
        isPopular: Boolean(row.isPopular),
        isActive: Boolean(row.isActive),
        isFeatured: Boolean(row.isFeatured),
        datamartPlanId: row.datamartPlanId ? String(row.datamartPlanId) : null,
        datamartPlanType: row.datamartPlanType ? String(row.datamartPlanType) : null,
        syncedAt: row.syncedAt ? String(row.syncedAt) : null,
      };
    });

    const oldestSync = plans
      .filter(p => p.syncedAt)
      .map(p => new Date(p.syncedAt!).getTime())
      .sort((a, b) => a - b)[0];
    
    const isStale = !oldestSync || Date.now() - oldestSync > 48 * 60 * 60 * 1000;
    const fetchedAt = result[0]?.updated_at ? new Date(String(result[0].updated_at)).toISOString() : null;

    return { success: true, data: plans, stale: isStale, fetchedAt };
  } catch (error) {
    const e = error as { code?: string; message?: string };
    if (e?.code === "42P01") {
      console.error("[Plans API] Database table not found - migrations may be required");
      return { success: false, error: "[MIGRATION_REQUIRED] Database table not found. Please run migrations." };
    }
    if (e?.code === "ECONNREFUSED" || e?.code === "ENOTFOUND") {
      console.error("[Plans API] Database connection failed:", e.message);
      return { success: false, error: "[DB_CONNECTION_ERROR] Database connection failed" };
    }
    console.error("[Plans API] Cache fetch error:", error);
    return { success: false, error: e?.message || "Failed to fetch from cache" };
  }
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
      const result = await getBalance();
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

    let syncResult: { success: boolean; syncedCount?: number; error?: string; errorCode?: string };
    try {
      const scopedNetworks = getScopedDatamartNetworks(network || undefined);
      const result = await syncDatamartPlans({ networks: scopedNetworks });
      syncResult = {
        success: result.syncedCount > 0,
        syncedCount: result.syncedCount,
        error:
          result.syncedCount > 0
            ? undefined
            : result.errors[0] || "No plans could be synced from DataMart",
        errorCode: result.syncedCount > 0 ? undefined : "PROVIDER_SYNC_FAILED",
      };
    } catch (syncError) {
      console.error("DataMart sync error:", syncError);
      syncResult = { success: false, error: syncError instanceof Error ? syncError.message : "Sync failed", errorCode: "PROVIDER_SYNC_ERROR" };
    }

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
    console.error("Error details:", err instanceof Error ? err.stack : String(err));
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
