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
    const period = searchParams.get("period") || "30d";

    let dateFilter = "";
    if (period === "7d") {
      dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === "30d") {
      dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    } else if (period === "90d") {
      dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
    }

    const totalSales = await sqlUnsafe(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(amount_ghs), 0) as total_amount_ghs,
        COALESCE(SUM(reloadly_cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders
      FROM giftcard_orders
      WHERE 1=1 ${dateFilter}
    `) as any[];

    const salesByBrand = await sqlUnsafe(`
      SELECT 
        brand_name,
        COUNT(*) as orders,
        COALESCE(SUM(amount_ghs), 0) as total_amount_ghs
      FROM giftcard_orders
      WHERE status = 'success' ${dateFilter}
      GROUP BY brand_name
      ORDER BY total_amount_ghs DESC
      LIMIT 10
    `) as any[];

    const salesByCountry = await sqlUnsafe(`
      SELECT 
        country_code,
        country_name,
        COUNT(*) as orders,
        COALESCE(SUM(amount_ghs), 0) as total_amount_ghs
      FROM giftcard_orders
      WHERE status = 'success' ${dateFilter}
      GROUP BY country_code, country_name
      ORDER BY total_amount_ghs DESC
      LIMIT 10
    `) as any[];

    const salesByStatus = await sqlUnsafe(`
      SELECT 
        status,
        COUNT(*) as orders,
        COALESCE(SUM(amount_ghs), 0) as total_amount_ghs
      FROM giftcard_orders
      WHERE 1=1 ${dateFilter}
      GROUP BY status
      ORDER BY orders DESC
    `) as any[];

    const dailySales = await sqlUnsafe(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(amount_ghs), 0) as total_amount_ghs
      FROM giftcard_orders
      WHERE status = 'success' ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `) as any[];

    const resellerSales = await sqlUnsafe(`
      SELECT 
        rp.business_name,
        COUNT(go.id) as orders,
        COALESCE(SUM(go.amount_ghs), 0) as total_amount_ghs,
        COALESCE(SUM(go.commission_amount), 0) as total_commission
      FROM giftcard_orders go
      JOIN reseller_profiles rp ON rp.id = go.reseller_id
      WHERE go.status = 'success' ${dateFilter}
      GROUP BY rp.business_name
      ORDER BY total_amount_ghs DESC
      LIMIT 10
    `) as any[];

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders: Number(totalSales[0].total_orders),
          totalAmountGHS: Number(totalSales[0].total_amount_ghs),
          totalCostUSD: Number(totalSales[0].total_cost_usd),
          totalCommission: Number(totalSales[0].total_commission),
          successfulOrders: Number(totalSales[0].successful_orders),
          failedOrders: Number(totalSales[0].failed_orders),
          successRate: totalSales[0].total_orders > 0 
            ? (Number(totalSales[0].successful_orders) / Number(totalSales[0].total_orders) * 100).toFixed(2)
            : "0",
        },
        salesByBrand: salesByBrand.map((row: any) => ({
          brand: row.brand_name,
          orders: Number(row.orders),
          totalAmountGHS: Number(row.total_amount_ghs),
        })),
        salesByCountry: salesByCountry.map((row: any) => ({
          countryCode: row.country_code,
          countryName: row.country_name,
          orders: Number(row.orders),
          totalAmountGHS: Number(row.total_amount_ghs),
        })),
        salesByStatus: salesByStatus.map((row: any) => ({
          status: row.status,
          orders: Number(row.orders),
          totalAmountGHS: Number(row.total_amount_ghs),
        })),
        dailySales: dailySales.map((row: any) => ({
          date: row.date,
          orders: Number(row.orders),
          totalAmountGHS: Number(row.total_amount_ghs),
        })).reverse(),
        resellerSales: resellerSales.map((row: any) => ({
          businessName: row.business_name,
          orders: Number(row.orders),
          totalAmountGHS: Number(row.total_amount_ghs),
          totalCommission: Number(row.total_commission),
        })),
        period,
      },
    });
  } catch (error) {
    console.error("Admin giftcard analytics GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
