export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getGuestOrderStats } from "@/lib/guest-orders";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Get basic stats
    const stats = await getGuestOrderStats();

    // Get product breakdown
    const productBreakdown = await sql`
      SELECT 
        product_type,
        COUNT(*) as count,
        ROUND(SUM(CAST(amount_ghs AS NUMERIC)), 2) as revenue,
        ROUND(AVG(CAST(amount_ghs AS NUMERIC)), 2) as avg_value
      FROM guest_orders
      GROUP BY product_type
      ORDER BY count DESC
    `;

    // Get payment status breakdown
    const paymentStatus = await sql`
      SELECT 
        payment_status,
        COUNT(*) as count,
        ROUND(SUM(CAST(amount_ghs AS NUMERIC)), 2) as revenue
      FROM guest_orders
      GROUP BY payment_status
    `;

    // Get fulfillment status breakdown
    const fulfillmentStatus = await sql`
      SELECT 
        fulfillment_status,
        COUNT(*) as count
      FROM guest_orders
      GROUP BY fulfillment_status
    `;

    // Get top customers by order count
    const topCustomers = await sql`
      SELECT 
        customer_email,
        customer_name,
        COUNT(*) as order_count,
        ROUND(SUM(CAST(amount_ghs AS NUMERIC)), 2) as total_spent
      FROM guest_orders
      GROUP BY customer_email, customer_name
      ORDER BY order_count DESC
      LIMIT 10
    `;

    // Get recent orders (last 10)
    const recentOrders = await sql`
      SELECT 
        tracking_number,
        customer_email,
        product_type,
        amount_ghs,
        payment_status,
        fulfillment_status,
        created_at
      FROM guest_orders
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalOrders: stats.total,
        totalRevenue: stats.revenueGhs,
        pendingOrders: stats.paymentPending,
        successOrders: stats.paymentSuccess,
        completedFulfillments: stats.fulfillmentCompleted,
        failedFulfillments: stats.fulfillmentFailed,
        averageOrderValue: stats.total > 0 ? (stats.revenueGhs / stats.total) : 0,
        todayOrders: stats.todayCount,
        todayRevenue: stats.todayRevenue,
      },
      breakdown: {
        byProduct: productBreakdown,
        byPaymentStatus: paymentStatus,
        byFulfillmentStatus: fulfillmentStatus,
      },
      topCustomers,
      recentOrders,
    });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
