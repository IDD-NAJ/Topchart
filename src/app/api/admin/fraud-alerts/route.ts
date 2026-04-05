import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all fraud alerts
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let query = `
      SELECT 
        fa.*,
        rp.business_name as reseller_name,
        u.email as user_email
      FROM fraud_alerts fa
      LEFT JOIN reseller_profiles rp ON fa.reseller_id = rp.id
      LEFT JOIN users u ON fa.user_id = u.id
      WHERE 1=1
    `;

    if (status !== "all") {
      query += ` AND fa.status = '${status}'`;
    }

    query += ` ORDER BY fa.created_at DESC`;

    const alerts = await sqlUnsafe(query);

    return NextResponse.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error("Admin fraud alerts GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
