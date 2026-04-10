import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, sqlUnsafe } from "@/lib/db";

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

    const resellerCheck = await sql`
      SELECT id, commission_rate FROM reseller_profiles WHERE user_id = ${userId}
    `;

    if (resellerCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }

    const resellerId = resellerCheck[0].id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    let query = `
      SELECT 
        go.id, go.user_id, go.reloadly_order_id, go.reloadly_product_id,
        go.product_name, go.brand_name, go.country_code, go.denomination, go.currency,
        go.recipient_email, go.recipient_phone, go.recipient_name, go.is_gift, go.sender_message,
        go.gift_card_code, go.pin_code, go.expiry_date, go.status, go.amount_ghs,
        go.reloadly_cost_usd, go.markup_percentage, go.commission_amount, go.commission_rate,
        go.payment_method, go.payment_reference, go.error_message, go.created_at, go.updated_at,
        u.email, u.phone, u.first_name, u.last_name
      FROM giftcard_orders go
      JOIN users u ON u.id = go.user_id
      WHERE go.reseller_id = ${resellerId}
    `;

    if (status) {
      query += ` AND go.status = ${status}`;
    }

    query += ` ORDER BY go.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const orders = await sqlUnsafe(query);

    const countQuery = status 
      ? `SELECT COUNT(*) as total FROM giftcard_orders WHERE reseller_id = ${resellerId} AND status = ${status}`
      : `SELECT COUNT(*) as total FROM giftcard_orders WHERE reseller_id = ${resellerId}`;
    
    const countResult = await sqlUnsafe(countQuery) as any[];

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((order: any) => ({
          id: order.id,
          user: {
            id: order.user_id,
            email: order.email,
            phone: order.phone,
            firstName: order.first_name,
            lastName: order.last_name,
          },
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
        commissionRate: Number(resellerCheck[0].commission_rate),
      },
    });
  } catch (error) {
    console.error("Reseller giftcard orders GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
