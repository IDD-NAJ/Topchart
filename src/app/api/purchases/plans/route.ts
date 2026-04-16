import { NextRequest, NextResponse } from "next/server";
import { getDataPlans, getNetworks, getAccountInfo } from "@/lib/datamart";
import { requireAdmin } from "@/lib/admin-auth";
import { sqlUnsafe } from "@/lib/db";
import { dataPlans as staticDataPlans } from "@/lib/networks";

export const revalidate = 300;
export const runtime = "nodejs";

type PlansCacheEntry = {
  data: unknown[];
  fetchedAt: string;
};

const globalCache = globalThis as unknown as {
  datamartPlansCache?: PlansCacheEntry;
  datamartNetworksCache?: PlansCacheEntry;
};

function buildStaticFallbackPlans(network?: string) {
  const filtered = network
    ? staticDataPlans.filter(
        (plan) =>
          plan.networkId.toLowerCase() === network.toLowerCase() ||
          plan.name.toLowerCase().includes(network.toLowerCase())
      )
    : staticDataPlans;

  return filtered.map((plan) => ({
    id: plan.id,
    networkId: plan.networkId,
    network: plan.networkId.toUpperCase(),
    name: `${plan.name} ${plan.size}`.trim(),
    validity: plan.validity,
    validityHours: null,
    validityDays: null,
    price: Number(plan.price),
    isPopular: false,
    isActive: true,
    datamartPlanId: null,
    datamartPlanType: plan.type,
    syncedAt: null,
  }));
}

async function fetchPlansFromDatabase(network?: string) {
  const selectBase = `
      SELECT
        id,
        {{NETWORK_COLUMN}} as "networkId",
        network,
        name,
        validity,
        validity_hours as "validityHours",
        validity_days as "validityDays",
        price,
        is_popular as "isPopular",
        is_active as "isActive",
        datamart_plan_id as "datamartPlanId",
        datamart_plan_type as "datamartPlanType",
        synced_at as "syncedAt"
      FROM data_bundles
      WHERE is_active = true
  `;

  const runQueryForNetworkColumn = async (networkColumn: "network_id" | "\"networkId\"") => {
    const queryText = `${selectBase.replace("{{NETWORK_COLUMN}}", networkColumn)}${network ? " AND network = $1" : ""}`;
    const params = network ? [network] : undefined;
    return sqlUnsafe(queryText, params);
  };

  try {
    let plans: unknown[] = [];
    try {
      plans = await runQueryForNetworkColumn("network_id");
    } catch (error) {
      const e = error as { code?: string; message?: string };
      const message = `${e?.message || ""}`.toLowerCase();
      const missingLegacyColumn = e?.code === "42703" && message.includes("network_id");
      if (!missingLegacyColumn) {
        throw error;
      }

      plans = await runQueryForNetworkColumn("\"networkId\"");
    }
    
    if (plans.length > 0) {
      return { success: true, data: plans, fromDatabase: true };
    }
    
    return { success: false, error: "No plans found in database" };
  } catch (error) {
    const e = error as { code?: string; message?: string };
    if (e?.code === "42703") {
      return { success: false, error: "Data bundle schema mismatch" };
    }
    console.error("Database fetch error:", error);
    return { success: false, error: "Failed to fetch from database" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");
    const query = searchParams.get("q");

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
          providerError: result.error,
        });
      }
      return NextResponse.json(
        { success: false, error: result.error || "Failed to fetch networks" }, 
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

    const dbResult = await fetchPlansFromDatabase(network || undefined);
    
    if (dbResult.success) {
      return NextResponse.json({
        success: true,
        data: dbResult.data,
        stale: false,
        fromDatabase: true,
        fetchedAt: new Date().toISOString(),
      });
    }

    const result = await getDataPlans(network || undefined);
    if (!result.success) {
      const staticFallback = buildStaticFallbackPlans(network || undefined);
      if (staticFallback.length > 0) {
        return NextResponse.json({
          success: true,
          data: staticFallback,
          stale: true,
          fetchedAt: new Date().toISOString(),
          providerError: result.error || "Failed to fetch data plans from DataMart",
          code: result.errorCode,
          fromStaticFallback: true,
        });
      }
      if (globalCache.datamartPlansCache) {
        return NextResponse.json({
          success: true,
          data: globalCache.datamartPlansCache.data,
          stale: true,
          fetchedAt: globalCache.datamartPlansCache.fetchedAt,
          providerError: result.error || "Failed to fetch data plans from DataMart",
          code: result.errorCode,
        });
      }
      console.error(`DataMart API failed: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error || "Failed to fetch data plans from DataMart", code: result.errorCode },
        { status: 502 }
      );
    }

    globalCache.datamartPlansCache = {
      data: Array.isArray(result.data) ? result.data : [],
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json({
      success: true,
      data: result.data,
      stale: false,
      fetchedAt: globalCache.datamartPlansCache.fetchedAt,
      attempts: result.attempts || 1,
      fromDatabase: false,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
