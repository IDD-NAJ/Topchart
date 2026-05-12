import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { DATA_PACKAGE_TTL_MS, getPackages, resolveNetworkCode, type DatamartNetworkCode } from "@/lib/datamart-v2";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const networkParam = searchParams.get("network");
  const force = searchParams.get("refresh") === "true";

  let network: DatamartNetworkCode | undefined;
  if (networkParam) {
    try {
      network = resolveNetworkCode(networkParam);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported network code: ${networkParam}`,
          correlationId,
        },
        { status: 400 }
      );
    }
  }

  try {
    const { packages, fromCache, fetchedAt } = await getPackages({ network, forceRefresh: force });
    return NextResponse.json({
      success: true,
      data: packages,
      fromCache,
      fetchedAt: fetchedAt?.toISOString() ?? null,
      ttl: DATA_PACKAGE_TTL_MS,
      correlationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load data packages";
    logger.error({ message: "[DataMart] Data package fetch failed", correlationId, network: networkParam }, error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        correlationId,
      },
      { status: 502 }
    );
  }
}
