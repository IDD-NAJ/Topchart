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
    const tableExists = await sql`SELECT to_regclass('public.pricing_proxies')`;
    if (!tableExists[0].to_regclass) {
      return NextResponse.json({ success: true, data: [], warning: "table not provisioned" });
    }

    const proxies = await sql`
      SELECT id, name, description, type, price_per_gb, duration_days, is_active, created_at, updated_at
      FROM pricing_proxies
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ success: true, data: proxies });
  } catch (error) {
    console.error("[ADMIN_PROXY_SERVICES_GET] Error:", error);
    return NextResponse.json({ success: true, data: [], warning: "Failed to load proxy services" });
  }
}
