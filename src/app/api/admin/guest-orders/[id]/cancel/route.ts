export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGuestOrderById, updateGuestOrderPayment } from "@/lib/guest-orders";

/**
 * POST /api/admin/guest-orders/[id]/cancel
 * Admin action to cancel a guest order payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Get the order
    const order = await getGuestOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Can't cancel if already processed
    if (order.payment_status === "success") {
      return NextResponse.json(
        { success: false, error: "Cannot cancel a completed payment" },
        { status: 400 }
      );
    }

    // Mark as cancelled
    await updateGuestOrderPayment(order.id, "cancelled", {
      cancelled_by_admin: true,
      cancelled_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
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
