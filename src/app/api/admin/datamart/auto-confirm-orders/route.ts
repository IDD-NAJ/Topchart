import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncAllPendingOrders } from "@/lib/datamart-v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-triggered auto-confirmation of pending DataMart orders.
 * Checks the DataMart API for order status updates and confirms completed orders.
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const maxOrders = Math.min(parseInt(body.maxOrders ?? "50", 10), 100);

    const result = await syncAllPendingOrders(maxOrders);

    console.log("[Admin AutoConfirm] Completed", {
      checked: result.checked,
      updated: result.updated,
      failed: result.failed,
      skipped: result.skipped,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Auto-confirm completed: ${result.checked} checked, ${result.updated} confirmed, ${result.failed} failed, ${result.skipped} skipped.`,
      ...result,
    });
  } catch (error) {
    console.error("[Admin AutoConfirm] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Auto-confirm failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    // Return pending order count for dashboard display
    const { sql } = await import("@/lib/db");
    const [row] = await sql`
      SELECT COUNT(*) as pending_count
      FROM datamart_orders
      WHERE status IN ('pending', 'waiting')
        AND order_reference IS NOT NULL
    ` as Array<{ pending_count: string }>;

    return NextResponse.json({
      success: true,
      pendingCount: parseInt(row?.pending_count ?? "0", 10),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to count pending orders" }, { status: 500 });
  }
}
