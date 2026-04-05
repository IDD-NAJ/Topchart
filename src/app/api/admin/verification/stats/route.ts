import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // Get daily revenue for last 30 days
    const dailyRevenue = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as revenue,
        type
      FROM transactions
      WHERE type IN ('verification_onetime', 'verification_rental', 'verification_extension')
        AND created_at > NOW() - INTERVAL '30 days'
        AND status = 'success'
      GROUP BY DATE(created_at), type
      ORDER BY date DESC
    `;

    // Get service popularity
    const serviceStats = await sql`
      SELECT 
        vs.name,
        vs.category,
        COUNT(vn.id) as purchase_count,
        SUM(vn.purchase_price) as total_revenue
      FROM verification_numbers vn
      JOIN verification_services vs ON vn.service_id = vs.id
      WHERE vn.created_at > NOW() - INTERVAL '30 days'
      GROUP BY vs.id, vs.name, vs.category
      ORDER BY purchase_count DESC
      LIMIT 10
    `;

    // Get summary metrics
    const summary = await sql`
      SELECT 
        COUNT(*) as total_purchases,
        COUNT(CASE WHEN type = 'onetime' THEN 1 END) as onetime_count,
        COUNT(CASE WHEN type = 'rental' THEN 1 END) as rental_count,
        SUM(purchase_price) as total_revenue,
        AVG(purchase_price) as avg_price
      FROM verification_numbers
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;

    // Get active numbers count (currently active)
    const activeNow = await sql`
      SELECT COUNT(*) as count
      FROM verification_numbers
      WHERE status = 'active' AND expires_at > NOW()
    `;

    return NextResponse.json({
      success: true,
      data: {
        dailyRevenue,
        serviceStats,
        summary: summary[0],
        activeNow: activeNow[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Admin verification stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
