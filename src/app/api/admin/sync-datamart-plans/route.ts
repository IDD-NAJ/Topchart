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

    return NextResponse.json({
      success: true,
      message: `Sync completed. Synced ${result.syncedCount} plans, ${result.errorCount} errors, ${result.priceChanges.length} price changes.`,
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
