export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGuestOrderByTracking } from "@/lib/guest-orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const { trackingNumber } = await params;
  const normalizedTracking = trackingNumber.trim().toUpperCase();

  const order = await getGuestOrderByTracking(normalizedTracking);

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  // Return public-safe fields
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
      customer_email_masked:
        order.customer_email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
    },
  });
}
