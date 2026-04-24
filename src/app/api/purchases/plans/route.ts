import { NextRequest, NextResponse } from "next/server";
import { getDataPackages, getNetworks, getBalance, resolveNetworkCode, getNetworkDisplayName, type DatamartNetworkCode } from "@/lib/datamart";
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

const FRONTEND_TO_DB_NETWORK: Record<string, string> = {
  mtn: "MTN",
  vodafone: "VODAFONE",
  telecel: "VODAFONE",
  airteltigo: "AIRTELTIGO",
  "airtel-tigo": "AIRTELTIGO",
  at: "AIRTELTIGO",
  glo: "GLO",
};

async function fetchPlansFromCache(network?: string): Promise<{ success: true; data: CachedPlan[]; stale: boolean; fetchedAt: string | null } | { success: false; error: string }> {
  try {
    const dbNetworkCode = network ? (FRONTEND_TO_DB_NETWORK[network.toLowerCase()] || network.toUpperCase()) : undefined;

    const rows = dbNetworkCode
      ? sql`
          SELECT 
            b.id,
            b."networkId",
            n.name as "networkName",
            n.code as "networkCode",
            b.name,
            b."sizeMb",
            b."validityHours",
            b.price as "providerPrice",
            b."priceOverride",
            b."markupPercent",
            b."isPopular",
            b."isActive",
            b."isFeatured",
            b."createdAt" as "syncedAt",
            b."updatedAt"
          FROM data_bundles b
          JOIN networks n ON n.id = b."networkId"
          WHERE b."isActive" = true AND n.code = ${dbNetworkCode}
          ORDER BY b.price ASC
        `
      : sql`
          SELECT 
            b.id,
            b."networkId",
            n.name as "networkName",
            n.code as "networkCode",
            b.name,
            b."sizeMb",
            b."validityHours",
            b.price as "providerPrice",
            b."priceOverride",
            b."markupPercent",
            b."isPopular",
            b."isActive",
            b."isFeatured",
            b."createdAt" as "syncedAt",
            b."updatedAt"
          FROM data_bundles b
          JOIN networks n ON n.id = b."networkId"
          WHERE b."isActive" = true
          ORDER BY n.code, b.price ASC
        `;

    const result = await rows;

    if (result.length === 0) {
      return { success: false, error: "No cached plans found" };
    }

    const plans: CachedPlan[] = result.map((row: Record<string, unknown>) => {
      const providerPrice = Number(row.providerPrice);
      const priceOverride = row.priceOverride ? Number(row.priceOverride) : null;
      const markupPercent = row.markupPercent ? Number(row.markupPercent) : null;
      let effectivePrice = providerPrice;
      if (priceOverride !== null && priceOverride > 0) {
        effectivePrice = priceOverride;
      } else if (markupPercent !== null && markupPercent > 0) {
        effectivePrice = Number((providerPrice + providerPrice * (markupPercent / 100)).toFixed(2));
      }
      return {
        id: String(row.id),
        networkId: String(row.networkId),
        network: String(row.networkCode || row.networkName || ""),
        name: String(row.name),
        validity: row.validityHours ? `${Math.round(Number(row.validityHours) / 24)} days` : null,
        validityHours: row.validityHours ? Number(row.validityHours) : null,
        validityDays: row.validityHours ? Math.round(Number(row.validityHours) / 24) : null,
        providerPrice,
        effectivePrice,
        priceOverride,
        markupPercent,
        isPopular: Boolean(row.isPopular),
        isActive: Boolean(row.isActive),
        isFeatured: Boolean(row.isFeatured),
        datamartPlanId: String(row.id),
        datamartPlanType: "capacity",
        syncedAt: row.syncedAt ? String(row.syncedAt) : null,
      };
    });

    const oldestSync = plans
      .filter(p => p.syncedAt)
      .map(p => new Date(p.syncedAt!).getTime())
      .sort((a, b) => a - b)[0];
    
    const isStale = !oldestSync || Date.now() - oldestSync > 48 * 60 * 60 * 1000;
    const fetchedAt = oldestSync ? new Date(oldestSync).toISOString() : null;

    return { success: true, data: plans, stale: isStale, fetchedAt };
  } catch (error) {
    const e = error as { code?: string; message?: string };
    if (e?.code === "42P01") {
      console.error("[Plans API] Database table not found - migrations may be required");
      return { 
        success: false, 
        error: "Database table not found. Please run migrations.",
        errorCode: "MIGRATION_REQUIRED" 
      };
    }
    if (e?.code === "ECONNREFUSED" || e?.code === "ENOTFOUND") {
      console.error("[Plans API] Database connection failed:", e.message);
      return { 
        success: false, 
        error: "Database connection failed",
        errorCode: "DB_CONNECTION_ERROR" 
      };
    }
    console.error("[Plans API] Cache fetch error:", error);
    return { 
      success: false, 
      error: e?.message || "Failed to fetch from cache",
      errorCode: "CACHE_ERROR" 
    };
  }
}

async function syncPlansFromDataMart(network?: string): Promise<{ success: boolean; syncedCount?: number; error?: string; errorCode?: string }> {
  const networkCodes: DatamartNetworkCode[] = network
    ? [resolveNetworkCode(network)]
    : ["YELLO", "TELECEL", "AT_PREMIUM"];

  const DATAMART_TO_DB_NETWORK: Record<string, string> = {
    YELLO: "MTN",
    TELECEL: "VODAFONE",
    AT_PREMIUM: "AIRTELTIGO",
    at: "AIRTELTIGO",
  };

  let syncedCount = 0;

  const networkRows = await sql`SELECT id, code FROM networks`;
  const networkIdMap: Record<string, string> = {};
  for (const row of networkRows) {
    networkIdMap[row.code] = row.id;
  }

  const categoryRows = await sql`SELECT id, networkId, name FROM data_bundle_categories`;
  const categoryMap: Record<string, string> = {};
  for (const row of categoryRows) {
    categoryMap[row.networkId] = row.id;
  }

  for (const code of networkCodes) {
    try {
      const plansResult = await getDataPackages(code);
      if (!plansResult.success) {
        console.warn(`Failed to fetch packages for network ${code}: ${plansResult.error}`);
        continue;
      }

      const packages_ = plansResult.data || [];
      const dbNetworkCode = DATAMART_TO_DB_NETWORK[code];
      const dbNetworkId = networkIdMap[dbNetworkCode];

      if (!dbNetworkId) {
        console.warn(`No DB network found for DataMart code ${code} (mapped to ${dbNetworkCode})`);
        continue;
      }

      let categoryId = categoryMap[dbNetworkId];
      if (!categoryId) {
        const catResult = await sql`
          INSERT INTO data_bundle_categories (id, "networkId", name, "updatedAt")
          VALUES (${crypto.randomUUID()}, ${dbNetworkId}, ${'Data Bundles'}, NOW())
          RETURNING id
        `;
        categoryId = catResult[0]?.id;
        if (categoryId) categoryMap[dbNetworkId] = categoryId;
      }

      for (const pkg of packages_) {
        try {
          const mb = parseInt(pkg.mb, 10);
          const providerPrice = parseFloat(pkg.price);
          const displayName = getNetworkDisplayName(code);
          const planName = `${pkg.capacity}GB ${displayName}`;
          const bundleId = `dm_${code}_${pkg.capacity}gb`;
          const validityHours = 90 * 24;

          await sql`
            INSERT INTO data_bundles (id, "networkId", "categoryId", name, "sizeMb", "validityHours", price, "isPopular", "isActive", "updatedAt")
            VALUES (${bundleId}, ${dbNetworkId}, ${categoryId}, ${planName}, ${mb}, ${validityHours}, ${providerPrice}, false, ${pkg.inStock}, NOW())
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              "sizeMb" = EXCLUDED."sizeMb",
              "validityHours" = EXCLUDED."validityHours",
              price = EXCLUDED.price,
              "isActive" = EXCLUDED."isActive",
              "updatedAt" = NOW()
          `;

          syncedCount++;
        } catch (planError) {
          console.error(`Failed to sync package ${code}_${pkg.capacity}GB:`, planError);
        }
      }
    } catch (networkError) {
      console.error(`Failed to process network ${code}:`, networkError);
    }
  }

  if (syncedCount === 0 && networkCodes.length > 0) {
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

    let syncResult;
    try {
      syncResult = await syncPlansFromDataMart(network || undefined);
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
