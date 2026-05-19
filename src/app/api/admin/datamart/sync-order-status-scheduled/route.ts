import { NextRequest, NextResponse } from "next/server";
import { syncAllPendingOrders } from "@/lib/datamart-v2";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;

  const isValidAuth =
    (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecretHeader && cronSecret && cronSecretHeader === cronSecret);

  if (!cronSecret || !isValidAuth) {
    console.error("[DataMart Order Sync] Unauthorized cron request");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllPendingOrders(15);

    return NextResponse.json({
      success: true,
      message: `Order status sync completed. Checked ${result.checked} orders, updated ${result.updated}, failed ${result.failed}, skipped ${result.skipped}.`,
      ...result,
    });
  } catch (error) {
    console.error("Order status sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
