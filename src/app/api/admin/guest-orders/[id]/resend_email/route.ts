export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGuestOrderById } from "@/lib/guest-orders";
import { sendGuestOrderConfirmationEmail } from "@/lib/email";

/**
 * POST /api/admin/guest-orders/[id]/resend_email
 * Admin action to resend confirmation email to guest
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

    // Send email
    await sendGuestOrderConfirmationEmail({
      tracking_number: order.tracking_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      product_type: order.product_type,
      product_details: order.product_details,
      amount_ghs: Number(order.amount_ghs),
      fulfillment_status: order.fulfillment_status,
    });

    return NextResponse.json({
      success: true,
      message: "Confirmation email sent",
    });
  } catch (error) {
    console.error("[Admin/resend_email] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}
