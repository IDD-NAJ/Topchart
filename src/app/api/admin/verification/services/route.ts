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

    const services = await sql`
      SELECT 
        vs.id,
        vs.pvadeals_service_id,
        vs.name,
        vs.category,
        vs.picture_url,
        vs.country,
        vs.is_active,
        vs.markup_percentage,
        vs.str_price,
        vs.ltr3_price,
        vs.ltr7_price,
        vs.ltr14_price,
        vs.ltr30_price,
        vs.created_at,
        vs.updated_at,
        COALESCE(vn_stats.purchase_count, 0) as purchase_count,
        COALESCE(vn_stats.total_revenue, 0) as total_revenue
      FROM verification_services vs
      LEFT JOIN (
        SELECT service_id, COUNT(*) as purchase_count, SUM(purchase_price) as total_revenue
        FROM verification_numbers
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY service_id
      ) vn_stats ON vs.id = vn_stats.service_id
      ORDER BY vs.category, vs.name
    `;

    return NextResponse.json({
      success: true,
      data: { services },
    });
  } catch (error) {
    console.error("Admin verification services error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { serviceId, markupPercentage, isActive, category } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE verification_services
      SET 
        markup_percentage = COALESCE(${markupPercentage ?? null}, markup_percentage),
        is_active = COALESCE(${isActive ?? null}, is_active),
        category = COALESCE(${category ?? null}, category),
        updated_at = NOW()
      WHERE id = ${serviceId}
    `;

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error("Admin update service error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}
