import { NextRequest, NextResponse } from "next/server";
import { syncDatamartPlans } from "@/lib/datamart-sync";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;

  const isValidAuth =
    (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecretHeader && cronSecret && cronSecretHeader === cronSecret);

  if (!cronSecret || !isValidAuth) {
    console.error("[DataMart Sync] Unauthorized cron request");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncDatamartPlans();

    return NextResponse.json({
      success: true,
      message: `Scheduled sync completed. Synced ${result.syncedCount} plans, ${result.errorCount} errors, ${result.priceChanges.length} price changes.`,
      ...result,
    });
  } catch (error) {
    console.error("Scheduled sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
