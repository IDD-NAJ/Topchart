export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import {
  getGuestOrderById,
  updateGuestOrderPayment,
  updateGuestOrderFulfillment,
} from "@/lib/guest-orders";
import {
  createDatamartOrder,
  submitDatamartPurchase,
  resolveNetworkCode,
  isValidGhanaPhone,
} from "@/lib/datamart-v2";
import { sendGuestOrderConfirmationEmail } from "@/lib/email";

/**
 * POST /api/admin/guest-orders/[id]/verify
 * Admin action to manually verify a guest order payment
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

    // If no Paystack reference, can't verify
    if (!order.paystack_reference) {
      return NextResponse.json(
        { success: false, error: "No Paystack reference for this order" },
        { status: 400 }
      );
    }

    // Verify with Paystack
    const psResult = await verifyPaystackTransaction(order.paystack_reference);
    if (!psResult.success || !psResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: psResult.error || "Failed to verify with Paystack",
        },
        { status: 400 }
      );
    }

    const psData = psResult.data;

    if (psData.status !== "success") {
      return NextResponse.json(
        { success: false, error: `Payment status is ${psData.status}` },
        { status: 400 }
      );
    }

    // Already processed
    if (order.payment_status === "success") {
      return NextResponse.json({
        success: true,
        message: "Order already verified",
      });
    }

    // Mark payment as succeeded
    await updateGuestOrderPayment(order.id, "success", {
      status: psData.status,
      gateway_response: psData.gateway_response,
      paid_at: psData.paid_at,
      channel: psData.channel,
      amount: psData.amount,
      verified_by_admin: true,
      verified_at: new Date().toISOString(),
    });

    // Auto-fulfill data bundles
    if (order.product_type === "data_bundle") {
      const { product_details } = order;
      const phoneNumber = String(
        product_details.phone_number || product_details.phoneNumber || ""
      );
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
              message: "Payment verified but fulfillment failed - invalid network",
            });
          }

          await updateGuestOrderFulfillment(order.id, "processing");

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
        } catch (err) {
          console.error("[Admin/verify] DataMart error:", err);
          await updateGuestOrderFulfillment(order.id, "failed", {
            notes: `DataMart error: ${
              err instanceof Error ? err.message : "Unknown error"
            }`,
          });
        }
      }
    }

    // Mark as pending fulfillment if not data bundle
    if (order.product_type !== "data_bundle") {
      await updateGuestOrderFulfillment(order.id, "pending");
    }

    return NextResponse.json({
      success: true,
      message: "Order verified successfully",
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
