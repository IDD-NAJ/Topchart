export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import {
  getGuestOrderByPaystackRef,
  updateGuestOrderPayment,
  updateGuestOrderFulfillment,
} from "@/lib/guest-orders";
import {
  createDatamartOrder,
  submitDatamartPurchase,
  resolveNetworkCode,
  isValidGhanaPhone,
} from "@/lib/datamart-v2";
import { sql } from "@/lib/db";
import { sendGuestOrderConfirmationEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { success: false, error: "reference is required" },
      { status: 400 }
    );
  }

  // Verify with Paystack
  const psResult = await verifyPaystackTransaction(reference);
  if (!psResult.success || !psResult.data) {
    return NextResponse.json(
      { success: false, error: psResult.error || "Payment verification failed" },
      { status: 400 }
    );
  }

  const psData = psResult.data;
  const paystackStatus = psData.status; // "success" | "failed" | "abandoned" | "pending"

  // Look up our order by Paystack reference
  const order = await getGuestOrderByPaystackRef(reference);
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found for this payment reference" },
      { status: 404 }
    );
  }

  // Already processed
  if (order.payment_status === "success") {
    return NextResponse.json({
      success: true,
      tracking_number: order.tracking_number,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      already_processed: true,
    });
  }

  if (paystackStatus !== "success") {
    await updateGuestOrderPayment(order.id, paystackStatus as "failed" | "abandoned", {
      status: psData.status,
      gateway_response: psData.gateway_response,
      paid_at: psData.paid_at,
    });
    return NextResponse.json({
      success: false,
      tracking_number: order.tracking_number,
      payment_status: paystackStatus,
      error: "Payment was not successful",
    });
  }

  // Mark payment as succeeded
  await updateGuestOrderPayment(order.id, "success", {
    status: psData.status,
    gateway_response: psData.gateway_response,
    paid_at: psData.paid_at,
    channel: psData.channel,
    amount: psData.amount,
  });

  // Attempt auto-fulfillment for data bundles
  if (order.product_type === "data_bundle") {
    const { product_details } = order;
    const phoneNumber = String(product_details.phone_number || product_details.phoneNumber || "");
    const networkInput = String(product_details.network || "");
    const capacity = String(product_details.capacity || "");

    if (phoneNumber && networkInput && capacity && isValidGhanaPhone(phoneNumber)) {
      try {
        let network;
        try {
          network = resolveNetworkCode(networkInput);
        } catch {
          await updateGuestOrderFulfillment(order.id, "failed", {
            notes: `Invalid network code: ${networkInput}`,
          });
          return NextResponse.json({
            success: true,
            tracking_number: order.tracking_number,
            payment_status: "success",
            fulfillment_status: "failed",
          });
        }

        await updateGuestOrderFulfillment(order.id, "processing");

        // Create DataMart order record and submit
        const dmOrder = await createDatamartOrder({
          phoneNumber,
          network,
          capacity,
          price: Number(order.amount_ghs),
        });

        const purchase = await submitDatamartPurchase({
          phoneNumber,
          network,
          capacity,
          idempotencyKey: dmOrder.idempotencyKey,
        });

        const fulfilled = ["completed", "delivered"].includes(
          purchase.orderStatus.toLowerCase()
        );

        await updateGuestOrderFulfillment(
          order.id,
          fulfilled ? "completed" : "processing",
          {
            datamartOrderReference: purchase.orderReference,
            datamartPurchaseId: purchase.purchaseId,
            datamartOrderStatus: purchase.orderStatus,
          }
        );

        // Send confirmation email (fire-and-forget)
        sendGuestOrderConfirmationEmail({
          tracking_number: order.tracking_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          product_type: order.product_type,
          product_details: order.product_details,
          amount_ghs: Number(order.amount_ghs),
          fulfillment_status: fulfilled ? "completed" : "processing",
        }).catch((err) => console.error("[GuestCheckout/verify] Email error:", err));

        return NextResponse.json({
          success: true,
          tracking_number: order.tracking_number,
          payment_status: "success",
          fulfillment_status: fulfilled ? "completed" : "processing",
        });
      } catch (err) {
        console.error("[GuestCheckout/verify] DataMart fulfillment error:", err);
        await updateGuestOrderFulfillment(order.id, "failed", {
          notes: `DataMart error: ${err instanceof Error ? err.message : "Unknown error"}`,
        });

        // Still send email — payment succeeded, fulfillment failed
        sendGuestOrderConfirmationEmail({
          tracking_number: order.tracking_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          product_type: order.product_type,
          product_details: order.product_details,
          amount_ghs: Number(order.amount_ghs),
          fulfillment_status: "failed",
        }).catch((emailErr) => console.error("[GuestCheckout/verify] Email error:", emailErr));

        return NextResponse.json({
          success: true,
          tracking_number: order.tracking_number,
          payment_status: "success",
          fulfillment_status: "failed",
          fulfillment_note: "Payment received. Fulfillment is being reviewed by our team.",
        });
      }
    }
  }

  // For all other product types: payment succeeded, fulfillment is manual/pending
  await updateGuestOrderFulfillment(order.id, "pending");

  sendGuestOrderConfirmationEmail({
    tracking_number: order.tracking_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    product_type: order.product_type,
    product_details: order.product_details,
    amount_ghs: Number(order.amount_ghs),
    fulfillment_status: "pending",
  }).catch((err) => console.error("[GuestCheckout/verify] Email error:", err));

  return NextResponse.json({
    success: true,
    tracking_number: order.tracking_number,
    payment_status: "success",
    fulfillment_status: "pending",
  });
}
