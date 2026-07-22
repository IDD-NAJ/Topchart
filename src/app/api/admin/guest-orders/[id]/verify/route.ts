export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { getGuestOrderById } from "@/lib/guest-orders";
import { processGuestOrderPayment } from "@/lib/guest-fulfillment";

/**
 * POST /api/admin/guest-orders/[id]/verify
 * Admin action to manually verify a guest order payment against Paystack and
 * (for data bundles) auto-fulfill. Uses the shared processGuestOrderPayment
 * helper so behavior matches the customer callback and webhook.
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

    if (!order.paystack_reference) {
      return NextResponse.json(
        { success: false, error: "No Paystack reference for this order" },
        { status: 400 }
      );
    }

    if (order.payment_status === "success") {
      return NextResponse.json({ success: true, message: "Order already verified" });
    }

    // Verify with Paystack (source of truth).
    const psResult = await verifyPaystackTransaction(order.paystack_reference);
    if (!psResult.success || !psResult.data) {
      return NextResponse.json(
        { success: false, error: psResult.error || "Failed to verify with Paystack" },
        { status: 400 }
      );
    }

    if (psResult.data.status !== "success") {
      return NextResponse.json(
        { success: false, error: `Payment status is ${psResult.data.status}` },
        { status: 400 }
      );
    }

    const result = await processGuestOrderPayment(order.paystack_reference, psResult.data);

    return NextResponse.json({
      success: true,
      message: "Order verified successfully",
      tracking_number: result.tracking_number,
      payment_status: result.payment_status,
      fulfillment_status: result.fulfillment_status,
    });
  } catch (error) {
    console.error("[Admin/verify] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}
