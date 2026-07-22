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
    const tableExists = await sql`SELECT to_regclass('public.smspva_services')`;
    if (!tableExists[0].to_regclass) {
      return NextResponse.json({ success: true, data: [], warning: "table not provisioned" });
    }

    const services = await sql`
      SELECT id, service_name, country, price, is_active, last_updated, created_at
      FROM smspva_services
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error("[ADMIN_SMSPVA_MANAGEMENT_GET] Error:", error);
    return NextResponse.json({ success: true, data: [], warning: "Failed to load SMSPVA services" });
  }
}
