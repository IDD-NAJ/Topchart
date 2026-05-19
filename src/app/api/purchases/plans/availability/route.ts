import { NextResponse } from "next/server";
import { getDataPackages, type DatamartNetworkCode } from "@/lib/datamart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NETWORKS: DatamartNetworkCode[] = ["YELLO", "TELECEL", "AT_PREMIUM"];

const cache = globalThis as unknown as {
  planAvailabilityCache?: { data: Record<string, boolean>; fetchedAt: number };
};

const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (
    cache.planAvailabilityCache &&
    Date.now() - cache.planAvailabilityCache.fetchedAt < CACHE_TTL_MS
  ) {
    return NextResponse.json({
      success: true,
      data: cache.planAvailabilityCache.data,
      fromCache: true,
    });
  }

  try {
    const results = await Promise.allSettled(
      NETWORKS.map((network) => getDataPackages(network))
    );

    const availability: Record<string, boolean> = {};

    for (let i = 0; i < NETWORKS.length; i++) {
      const network = NETWORKS[i];
      const result = results[i];
      if (result.status === "fulfilled" && result.value.success && Array.isArray(result.value.data)) {
        for (const pkg of result.value.data) {
          const capacityStr = String(pkg.capacity).replace(/[^0-9]/g, "");
          if (capacityStr) {
            availability[`${network}_${capacityStr}`] = Boolean(pkg.inStock);
          }
        }
      }
    }

    cache.planAvailabilityCache = { data: availability, fetchedAt: Date.now() };

    return NextResponse.json({ success: true, data: availability, fromCache: false });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
