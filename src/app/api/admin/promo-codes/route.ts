import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    // Check if table exists; if not, return empty data gracefully
    const tableExists = await sql`SELECT to_regclass('public.promo_codes')`;
    if (!tableExists[0].to_regclass) {
      return NextResponse.json({ success: true, data: [], warning: "table not provisioned" });
    }

    const codes = await sql`
      SELECT id, code, discount_type, discount_value, usage_limit, usage_count, is_active, created_at, updated_at
      FROM promo_codes
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, data: codes });
  } catch (error) {
    console.error("[ADMIN_PROMO_CODES_GET] Error:", error);
    return NextResponse.json({ success: true, data: [], warning: "Failed to load promo codes" });
  }
}
