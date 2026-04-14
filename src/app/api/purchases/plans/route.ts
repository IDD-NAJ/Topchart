import { NextRequest, NextResponse } from "next/server";
import { getDataPlans, getNetworks, getAccountInfo } from "@/lib/datamart";
import { requireAdmin } from "@/lib/admin-auth";

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

    const result = await getDataPlans(network || undefined);
    if (!result.success) {
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
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
