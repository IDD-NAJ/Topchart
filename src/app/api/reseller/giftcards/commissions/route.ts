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
      SELECT id, commission_rate, total_commission_earned FROM reseller_profiles WHERE user_id = ${userId}
    `;

    if (resellerCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }

    const resellerId = resellerCheck[0].id;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    let dateFilter = "";
    if (period === "7d") {
      dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === "30d") {
      dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    } else if (period === "90d") {
      dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
    }

    const commissions = await sqlUnsafe(`
      SELECT 
        id, product_name, brand_name, amount_ghs, commission_amount, commission_rate,
        payment_method, created_at
      FROM giftcard_orders
      WHERE reseller_id = ${resellerId} AND status = 'success' ${dateFilter}
      ORDER BY created_at DESC
    `);

    const totalCommission = await sqlUnsafe(`
      SELECT 
        COALESCE(SUM(commission_amount), 0) as total,
        COUNT(*) as orders
      FROM giftcard_orders
      WHERE reseller_id = ${resellerId} AND status = 'success' ${dateFilter}
    `) as any[];

    return NextResponse.json({
      success: true,
      data: {
        commissions: commissions.map((order: any) => ({
          id: order.id,
          product: {
            name: order.product_name,
            brand: order.brand_name,
          },
          amountGHS: order.amount_ghs,
          commissionAmount: order.commission_amount,
          commissionRate: order.commission_rate,
          paymentMethod: order.payment_method,
          createdAt: order.created_at,
        })),
        summary: {
          totalCommission: Number(totalCommission[0].total),
          totalOrders: Number(totalCommission[0].orders),
          commissionRate: Number(resellerCheck[0].commission_rate),
          totalCommissionEarned: Number(resellerCheck[0].total_commission_earned),
        },
        period,
      },
    });
  } catch (error) {
    console.error("Reseller giftcard commissions GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch commissions" }, { status: 500 });
  }
}
