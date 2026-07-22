export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getGuestOrderById,
  updateGuestOrderPayment,
  updateGuestOrderFulfillment,
} from "@/lib/guest-orders";

/**
 * POST /api/admin/guest-orders/[id]/cancel
 * Admin action to cancel a guest order. This only marks the order as cancelled
 * in our system (no Paystack refund is issued here — refunds are handled
 * manually in the Paystack dashboard when required).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { id: orderId } = await params;

    const order = await getGuestOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status === "cancelled") {
      return NextResponse.json({ success: true, message: "Order already cancelled" });
    }

    const wasPaid = order.payment_status === "success";

    // Mark as cancelled (mark-only, no refund).
    await updateGuestOrderPayment(order.id, "cancelled", {
      cancelled_by_admin: true,
      cancelled_by: auth.email,
      cancelled_at: new Date().toISOString(),
      was_paid: wasPaid,
    });

    // Stop any in-flight fulfillment for cancelled orders.
    if (order.fulfillment_status === "pending" || order.fulfillment_status === "processing") {
      await updateGuestOrderFulfillment(order.id, "failed", {
        notes: `Order cancelled by admin (${auth.email})${wasPaid ? " — was paid; refund manually via Paystack if required" : ""}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: wasPaid
        ? "Order cancelled. This order was already paid — issue a refund in Paystack if required."
        : "Order cancelled successfully",
      was_paid: wasPaid,
    });
  } catch (error) {
    console.error("[Admin/cancel] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
