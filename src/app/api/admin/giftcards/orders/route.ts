import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    let query = `
      SELECT 
        go.id, go.user_id, go.reseller_id, go.reloadly_order_id, go.reloadly_product_id,
        go.product_name, go.brand_name, go.country_code, go.denomination, go.currency,
        go.recipient_email, go.recipient_phone, go.recipient_name, go.is_gift, go.sender_message,
        go.gift_card_code, go.pin_code, go.expiry_date, go.status, go.amount_ghs,
        go.reloadly_cost_usd, go.markup_percentage, go.commission_amount, go.commission_rate,
        go.payment_method, go.payment_reference, go.error_message, go.created_at, go.updated_at,
        u.email, u.phone, u.first_name, u.last_name,
        rp.business_name as reseller_business_name
      FROM giftcard_orders go
      LEFT JOIN users u ON u.id = go.user_id
      LEFT JOIN reseller_profiles rp ON rp.id = go.reseller_id
    `;

    const params: any[] = [];
    
    if (status) {
      query += ` WHERE go.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY go.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const orders = await sqlUnsafe(query, params);

    const countQuery = status 
      ? `SELECT COUNT(*) as total FROM giftcard_orders WHERE status = $1`
      : `SELECT COUNT(*) as total FROM giftcard_orders`;
    
    const countParams = status ? [status] : [];
    const countResult = await sqlUnsafe(countQuery, countParams) as any[];

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
          reseller: order.reseller_id ? {
            id: order.reseller_id,
            businessName: order.reseller_business_name,
          } : null,
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
    console.error("Admin giftcard orders GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
