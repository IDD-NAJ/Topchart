import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin access
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const serviceId = searchParams.get("service_id");
    const userId = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let whereClause = sql`WHERE 1=1`;
    
    if (status) {
      whereClause = sql`${whereClause} AND vn.status = ${status}`;
    }
    if (serviceId) {
      whereClause = sql`${whereClause} AND vn.service_id = ${serviceId}`;
    }
    if (userId) {
      whereClause = sql`${whereClause} AND vn.user_id = ${userId}`;
    }

    // Get numbers with user and service info
    const numbers = await sql`
      SELECT 
        vn.id,
        vn.number,
        vn.type,
        vn.status,
        vn.purchase_price,
        vn.rental_duration_hours,
        vn.expires_at,
        vn.completed_at,
        vn.created_at,
        vn.updated_at,
        vn.textverified_order_id,
        u.id as user_id,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        vs.id as service_id,
        vs.name as service_name,
        vs.category as service_category,
        COUNT(vsms.id) as sms_count
      FROM verification_numbers vn
      JOIN users u ON vn.user_id = u.id
      JOIN verification_services vs ON vn.service_id = vs.id
      LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
      ${whereClause}
      GROUP BY vn.id, u.id, u.email, u.first_name, u.last_name, vs.id, vs.name, vs.category
      ORDER BY vn.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM verification_numbers vn
      ${whereClause}
    `;

    // Get summary stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_numbers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_numbers,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_numbers,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_numbers,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_numbers,
        SUM(purchase_price) as total_revenue
      FROM verification_numbers
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;

    return NextResponse.json({
      success: true,
      data: {
        numbers,
        pagination: {
          total: parseInt(countResult[0]?.total || "0"),
          limit,
          offset,
        },
        stats: stats[0],
      },
    });
  } catch (error) {
    console.error("Admin verification numbers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch numbers" },
      { status: 500 }
    );
  }
}
