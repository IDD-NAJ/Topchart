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
import { calculateTotalWithServiceCharge } from "@/lib/service-charge";

const bodySchema = z.object({
  // Accept the fields the checkout page actually sends.
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  product_type: z.enum(["data_bundle", "bill_payment", "foreign_number"]),
  // Data bundle selection (primary key from /api/purchases/plans).
  bundle_id: z.string().optional(),
  // Fallback amount for non-bundle products (bill payment / foreign number).
  amount: z.number().positive().optional(),
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

    const { email, full_name, phone, product_type, bundle_id, amount } =
      parsed.data;

    // Resolve the canonical base price server-side. Never trust the
    // client-provided amount for data bundles.
    let basePriceGhs: number | null = null;
    const productDetails: Record<string, unknown> = {};

    if (product_type === "data_bundle") {
      if (!bundle_id) {
        return NextResponse.json(
          { success: false, error: "Please select a data bundle" },
          { status: 400 }
        );
      }

      const bundleRows = await sql`
        SELECT id, name, "sizeMb", "validityHours", price,
               "priceOverride", "markupPercent", network_id
        FROM data_bundles
        WHERE id = ${bundle_id}
          AND "isActive" = true
        LIMIT 1
      `;

      if (bundleRows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Selected bundle is no longer available" },
          { status: 404 }
        );
      }

      const bundle = bundleRows[0] as {
        id: string;
        name: string;
        sizeMb: number | null;
        validityHours: number | null;
        price: string | number;
        priceOverride: string | number | null;
        markupPercent: string | number | null;
        network_id: string | null;
      };

      const providerPrice = Number(bundle.price);
      const priceOverride = bundle.priceOverride ? Number(bundle.priceOverride) : null;
      const markupPercent = bundle.markupPercent ? Number(bundle.markupPercent) : null;

      if (priceOverride && priceOverride > 0) {
        basePriceGhs = priceOverride;
      } else if (markupPercent && markupPercent > 0) {
        basePriceGhs = Number((providerPrice * (1 + markupPercent / 100)).toFixed(2));
      } else {
        basePriceGhs = providerPrice;
      }

      productDetails.bundle_id = bundle.id;
      productDetails.name = bundle.name;
      productDetails.sizeMb = bundle.sizeMb;
      productDetails.validityHours = bundle.validityHours;
      productDetails.network_id = bundle.network_id;
    } else {
      // Non-bundle products: use the client-provided amount.
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, error: "A valid amount is required" },
          { status: 400 }
        );
      }
      basePriceGhs = amount;
    }

    // Add the service charge (customer pays on top).
    const { base, serviceCharge, total } =
      calculateTotalWithServiceCharge(basePriceGhs);

    productDetails.base_price_ghs = base;
    productDetails.service_charge_ghs = serviceCharge;
    productDetails.total_ghs = total;

    // Create the pending guest order in DB with the total the customer pays.
    const order = await createGuestOrder({
      customer_email: email,
      customer_name: full_name,
      customer_phone: phone,
      product_type: product_type as ProductType,
      product_details: productDetails,
      amount_ghs: total,
    });

    // Build Paystack callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://topchart.store";
    const callbackUrl = `${appUrl}/checkout/callback`;

    const paystackRef = generatePaystackReference();
    const amountPesewas = Math.round(total * 100);

    const paystackResult = await initializePaystackTransaction(
      email,
      amountPesewas,
      paystackRef,
      {
        guest_order_id: order.id,
        tracking_number: order.tracking_number,
        product_type,
        customer_name: full_name ?? "",
        base_price_ghs: base,
        service_charge_ghs: serviceCharge,
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
      base_price_ghs: base,
      service_charge_ghs: serviceCharge,
      amount_ghs: total,
    });
  } catch (error) {
    console.error("[GuestCheckout/initialize] Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
