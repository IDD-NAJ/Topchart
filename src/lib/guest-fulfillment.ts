import {
  getGuestOrderByPaystackRef,
  updateGuestOrderPayment,
  updateGuestOrderFulfillment,
  type GuestOrder,
} from "@/lib/guest-orders";
import {
  createDatamartOrder,
  submitDatamartPurchase,
  resolveNetworkCode,
  isValidGhanaPhone,
} from "@/lib/datamart-v2";
import { sendGuestOrderConfirmationEmail } from "@/lib/email";
import type { PaystackVerifyResponse } from "@/lib/paystack";

export interface GuestFulfillmentResult {
  found: boolean;
  tracking_number?: string;
  payment_status?: string;
  fulfillment_status?: string;
  already_processed?: boolean;
  fulfillment_note?: string;
}

type PaystackData = PaystackVerifyResponse["data"];

/**
 * Idempotently process a Paystack payment for a guest order:
 * - Marks payment success/failed/abandoned based on Paystack status.
 * - Attempts DataMart auto-fulfillment for data bundles when possible.
 * - Sends the confirmation email.
 *
 * Safe to call multiple times (callback page + webhook). If the order is
 * already marked success it returns early without re-crediting or re-fulfilling.
 */
export async function processGuestOrderPayment(
  reference: string,
  psData: PaystackData
): Promise<GuestFulfillmentResult> {
  const order = await getGuestOrderByPaystackRef(reference);
  if (!order) {
    return { found: false };
  }

  // Already processed — do nothing (idempotent).
  if (order.payment_status === "success") {
    return {
      found: true,
      tracking_number: order.tracking_number,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      already_processed: true,
    };
  }

  const paystackStatus = psData.status; // success | failed | abandoned | pending

  if (paystackStatus !== "success") {
    // Only persist terminal non-success states.
    if (paystackStatus === "failed" || paystackStatus === "abandoned") {
      await updateGuestOrderPayment(order.id, paystackStatus, {
        status: psData.status,
        gateway_response: psData.gateway_response,
        paid_at: psData.paid_at,
      });
    }
    return {
      found: true,
      tracking_number: order.tracking_number,
      payment_status: paystackStatus,
    };
  }

  // Mark payment as succeeded.
  await updateGuestOrderPayment(order.id, "success", {
    status: psData.status,
    gateway_response: psData.gateway_response,
    paid_at: psData.paid_at,
    channel: psData.channel,
    amount: psData.amount,
  });

  // Attempt auto-fulfillment for data bundles when we have delivery details.
  if (order.product_type === "data_bundle") {
    const fulfillmentStatus = await tryFulfillDataBundle(order);
    if (fulfillmentStatus) {
      return {
        found: true,
        tracking_number: order.tracking_number,
        payment_status: "success",
        fulfillment_status: fulfillmentStatus,
        fulfillment_note:
          fulfillmentStatus === "failed"
            ? "Payment received. Fulfillment is being reviewed by our team."
            : undefined,
      };
    }
  }

  // All other cases: payment succeeded, fulfillment is manual/pending.
  await updateGuestOrderFulfillment(order.id, "pending");
  void sendGuestOrderConfirmationEmail({
    tracking_number: order.tracking_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    product_type: order.product_type,
    product_details: order.product_details,
    amount_ghs: Number(order.amount_ghs),
    fulfillment_status: "pending",
  }).catch((err) =>
    console.error("[guest-fulfillment] Email error:", err)
  );

  return {
    found: true,
    tracking_number: order.tracking_number,
    payment_status: "success",
    fulfillment_status: "pending",
  };
}

/**
 * Attempts DataMart fulfillment for a data bundle order.
 * Returns the resulting fulfillment_status, or null when delivery details are
 * missing (caller should fall back to manual pending fulfillment).
 */
async function tryFulfillDataBundle(
  order: GuestOrder
): Promise<"completed" | "processing" | "failed" | null> {
  const { product_details } = order;
  const phoneNumber = String(
    product_details.phone_number || product_details.phoneNumber || ""
  );
  const networkInput = String(product_details.network || "");
  const capacity = String(product_details.capacity || "");

  if (
    !phoneNumber ||
    !networkInput ||
    !capacity ||
    !isValidGhanaPhone(phoneNumber)
  ) {
    return null; // insufficient details for auto-fulfillment
  }

  try {
    let network;
    try {
      network = resolveNetworkCode(networkInput);
    } catch {
      await updateGuestOrderFulfillment(order.id, "failed", {
        notes: `Invalid network code: ${networkInput}`,
      });
      return "failed";
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

    void sendGuestOrderConfirmationEmail({
      tracking_number: order.tracking_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      product_type: order.product_type,
      product_details: order.product_details,
      amount_ghs: Number(order.amount_ghs),
      fulfillment_status: fulfilled ? "completed" : "processing",
    }).catch((err) => console.error("[guest-fulfillment] Email error:", err));

    return fulfilled ? "completed" : "processing";
  } catch (err) {
    console.error("[guest-fulfillment] DataMart fulfillment error:", err);
    await updateGuestOrderFulfillment(order.id, "failed", {
      notes: `DataMart error: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    });

    void sendGuestOrderConfirmationEmail({
      tracking_number: order.tracking_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      product_type: order.product_type,
      product_details: order.product_details,
      amount_ghs: Number(order.amount_ghs),
      fulfillment_status: "failed",
    }).catch((emailErr) =>
      console.error("[guest-fulfillment] Email error:", emailErr)
    );

    return "failed";
  }
}
