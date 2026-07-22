import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if table exists; if not, return empty data gracefully
    const tableExists = (await sqlUnsafe(`SELECT to_regclass('public.verification_numbers')`, [])) as any[];
    if (!tableExists[0]?.to_regclass) {
      return NextResponse.json({
        success: true,
        verifications: [],
        requests: [],
        data: [],
        total: 0,
        warning: "table not provisioned",
      });
    }

    const conditions: string[] = ["1=1"];
    const filterParams: unknown[] = [];

    if (status) {
      filterParams.push(status);
      conditions.push(`vn.status = $${filterParams.length}`);
    }

    const query = `
      SELECT 
        vn.id, vn.number, vn.service_id, vn.country, vn.status,
        vn.purchase_price, vn.user_id, vn.created_at, vn.updated_at,
        u.email as user_email
      FROM verification_numbers vn
      LEFT JOIN users u ON vn.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY vn.created_at DESC
      LIMIT $${filterParams.length + 1}
      OFFSET $${filterParams.length + 2}
    `;

    filterParams.push(limit);
    filterParams.push(offset);

    const verifications = (await sqlUnsafe(query, filterParams)) as any[];

    const countQuery = `
      SELECT COUNT(*) as total FROM verification_numbers vn
      WHERE ${conditions.join(" AND ")}
    `;
    const countResult = (await sqlUnsafe(countQuery, filterParams.slice(0, -2))) as any[];
    const total = (countResult[0] as any)?.total || 0;

    return NextResponse.json({
      success: true,
      verifications,
      requests: verifications,
      data: verifications,
      total,
    });
  } catch (error) {
    console.error("[ADMIN_VERIFICATION_GET] Error:", error);
    return NextResponse.json({
      success: true,
      verifications: [],
      requests: [],
      data: [],
      total: 0,
      warning: "Failed to load verifications",
    });
  }
}
