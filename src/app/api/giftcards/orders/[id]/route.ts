import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const userId = sessions[0].user_id;
    const orderId = params.id;

    const orders = await sql`
      SELECT 
        id, reloadly_order_id, reloadly_product_id, product_name, brand_name,
        country_code, denomination, currency, recipient_email, recipient_phone,
        recipient_name, is_gift, sender_message, gift_card_code, pin_code,
        expiry_date, status, amount_ghs, reloadly_cost_usd, markup_percentage,
        commission_amount, commission_rate, payment_method, payment_reference,
        error_message, created_at, updated_at
      FROM giftcard_orders
      WHERE id = ${orderId} AND user_id = ${userId}
    `;

    if (orders.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        reloadlyOrderId: order.reloadly_order_id,
        product: {
          id: order.reloadly_product_id,
          name: order.product_name,
          brand: order.brand_name,
        },
        country: order.country_code,
        denomination: order.denomination,
        currency: order.currency,
        recipient: {
          email: order.recipient_email,
          phone: order.recipient_phone,
          name: order.recipient_name,
        },
        isGift: order.is_gift,
        senderMessage: order.sender_message,
        giftCardCode: order.gift_card_code,
        pinCode: order.pin_code,
        expiryDate: order.expiry_date,
        status: order.status,
        amountGHS: order.amount_ghs,
        reloadlyCostUSD: order.reloadly_cost_usd,
        markupPercentage: order.markup_percentage,
        commissionAmount: order.commission_amount,
        commissionRate: order.commission_rate,
        paymentMethod: order.payment_method,
        paymentReference: order.payment_reference,
        errorMessage: order.error_message,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    console.error("Get giftcard order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
