import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const orders = await sql`
      SELECT 
        id, reloadly_order_id, reloadly_product_id, product_name, brand_name,
        country_code, denomination, currency, recipient_email, recipient_phone,
        recipient_name, is_gift, sender_message, gift_card_code, pin_code,
        expiry_date, status, amount_ghs, reloadly_cost_usd, markup_percentage,
        commission_amount, commission_rate, payment_method, payment_reference,
        error_message, created_at, updated_at
      FROM giftcard_orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM giftcard_orders WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((order: any) => ({
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
        })),
        total: Number(countResult[0].total),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get giftcard orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
