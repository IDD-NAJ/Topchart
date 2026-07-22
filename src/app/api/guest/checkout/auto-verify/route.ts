export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { processGuestOrderPayment } from "@/lib/guest-fulfillment";

/**
 * POST /api/guest/checkout/auto-verify
 * Called from the guest checkout page when the Paystack callback reference is detected.
 * Verifies the payment with Paystack and auto-fulfills if applicable.
 *
 * The heavy lifting lives in processGuestOrderPayment() which is shared with the
 * Paystack webhook, so payments are still verified even if the customer never
 * returns to the callback page.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "reference is required" },
        { status: 400 }
      );
    }

    // Verify with Paystack (source of truth for the payment status).
    const psResult = await verifyPaystackTransaction(reference);
    if (!psResult.success || !psResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: psResult.error || "Payment verification failed",
        },
        { status: 400 }
      );
    }

    const result = await processGuestOrderPayment(reference, psResult.data);

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: "Order not found for this payment reference" },
        { status: 404 }
      );
    }

    if (result.payment_status !== "success") {
      return NextResponse.json({
        success: false,
        tracking_number: result.tracking_number,
        payment_status: result.payment_status,
        error: "Payment was not successful",
      });
    }

    return NextResponse.json({
      success: true,
      tracking_number: result.tracking_number,
      payment_status: result.payment_status,
      fulfillment_status: result.fulfillment_status,
      already_processed: result.already_processed,
      fulfillment_note: result.fulfillment_note,
    });
  } catch (error) {
    console.error("[GuestCheckout/auto-verify] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
