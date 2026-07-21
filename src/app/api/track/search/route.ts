export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGuestOrderByTracking } from "@/lib/guest-orders";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get("tracking")?.trim().toUpperCase();

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, error: "tracking number is required" },
      { status: 400 }
    );
  }

  const order = await getGuestOrderByTracking(trackingNumber);

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  // Return public-safe fields only
  return NextResponse.json({
    success: true,
    order: {
      tracking_number: order.tracking_number,
      product_type: order.product_type,
      product_details: order.product_details,
      amount_ghs: order.amount_ghs,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      datamart_order_status: order.datamart_order_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      // Mask email for privacy
      customer_email_masked:
        order.customer_email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
    },
  });
}
