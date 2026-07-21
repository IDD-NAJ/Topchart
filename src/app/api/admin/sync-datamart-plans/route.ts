export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncDatamartPlans } from "@/lib/datamart-sync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { force = false } = body;

    const result = await syncDatamartPlans({ force });

    console.log("[DataMart Manual Sync] Completed", {
      syncedCount: result.syncedCount,
      errorCount: result.errorCount,
      priceChanges: result.priceChanges.length,
      deactivatedCount: result.deactivatedCount,
      source: result.source,
      networkResults: result.networkResults,
      rejectedPrices: result.rejectedPrices.length,
    });

    return NextResponse.json({
      success: true,
      message: `Sync completed. Synced ${result.syncedCount} plans, ${result.errorCount} errors, ${result.priceChanges.length} price changes, ${result.rejectedPrices.length} rejected prices.`,
      ...result,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
