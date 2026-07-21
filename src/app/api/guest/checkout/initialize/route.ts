export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createGuestOrder,
  setGuestOrderPaystackRef,
  type ProductType,
} from "@/lib/guest-orders";
import {
  generatePaystackReference,
  initializePaystackTransaction,
} from "@/lib/paystack";
import { sql } from "@/lib/db";

const bodySchema = z.object({
  customer_email: z.string().email("Invalid email address"),
  customer_name: z.string().min(1).max(100).optional(),
  customer_phone: z.string().min(10).max(20).optional(),
  product_type: z.enum([
    "data_bundle",
    "bill_payment",
    "foreign_number",
  ]),
  product_details: z.record(z.unknown()),
  amount_ghs: z.number().positive("Amount must be positive"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { customer_email, customer_name, customer_phone, product_type, product_details, amount_ghs } =
      parsed.data;

    // For data bundles: validate the bundle exists and fetch canonical price
    let resolvedAmountGhs = amount_ghs;
    if (product_type === "data_bundle") {
      const network = product_details.network as string;
      const capacity = product_details.capacity as string;

      if (!network || !capacity) {
        return NextResponse.json(
          { success: false, error: "network and capacity are required for data bundles" },
          { status: 400 }
        );
      }

      // Try to fetch from data_bundles table if it exists (for production)
      // Otherwise use the provided amount (demo mode with sample data)
      try {
        const bundleRows = await sql`
          SELECT price, price_override, markup_percent
          FROM data_bundles
          WHERE datamart_plan_id = ${capacity}
            AND is_active = true
          LIMIT 1
        `;

        if (bundleRows.length > 0) {
          const bundle = bundleRows[0] as {
            price: number;
            price_override: number | null;
            markup_percent: number | null;
          };
          const providerPrice = Number(bundle.price);
          const priceOverride = bundle.price_override ? Number(bundle.price_override) : null;
          const markupPercent = bundle.markup_percent ? Number(bundle.markup_percent) : null;

          if (priceOverride && priceOverride > 0) {
            resolvedAmountGhs = priceOverride;
          } else if (markupPercent && markupPercent > 0) {
            resolvedAmountGhs = Number((providerPrice * (1 + markupPercent / 100)).toFixed(2));
          } else {
            resolvedAmountGhs = providerPrice;
          }
        }
        // If not found, use provided amount (demo mode)
      } catch (dbError) {
        // data_bundles table may not exist in demo/test environment
        // Use the provided amount from the client
        console.warn("[GuestCheckout] data_bundles table lookup failed, using client-provided amount", dbError);
      }
    }

    // Create the pending guest order in DB
    const order = await createGuestOrder({
      customer_email,
      customer_name,
      customer_phone,
      product_type: product_type as ProductType,
      product_details,
      amount_ghs: resolvedAmountGhs,
    });

    // Build Paystack callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://topchart.store";
    const callbackUrl = `${appUrl}/checkout/callback`;

    const paystackRef = generatePaystackReference();
    const amountPesewas = Math.round(resolvedAmountGhs * 100);

    const paystackResult = await initializePaystackTransaction(
      customer_email,
      amountPesewas,
      paystackRef,
      {
        guest_order_id: order.id,
        tracking_number: order.tracking_number,
        product_type,
        customer_name: customer_name ?? "",
      },
      callbackUrl
    );

    if (!paystackResult.success || !paystackResult.data) {
      return NextResponse.json(
        { success: false, error: paystackResult.error || "Failed to initialize payment" },
        { status: 500 }
      );
    }

    // Store the Paystack reference on the order
    await setGuestOrderPaystackRef(order.id, paystackRef);

    return NextResponse.json({
      success: true,
      tracking_number: order.tracking_number,
      authorization_url: paystackResult.data.authorization_url,
      paystack_reference: paystackRef,
      amount_ghs: resolvedAmountGhs,
    });
  } catch (error) {
    console.error("[GuestCheckout/initialize] Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
