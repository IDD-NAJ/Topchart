import { NextRequest, NextResponse } from "next/server";
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
    const services = await sql`
      SELECT 
        id, title, description, href, label, icon, 
        priority, is_active, created_at, updated_at
      FROM homepage_services
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("[ADMIN_SERVICES_GET] Failed to load services:", error);
    return NextResponse.json({ success: false, error: "Failed to load services" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { title, description, href, label, icon, priority, is_active } = body;

    if (!title || !description || !href || !label) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await sql`
      INSERT INTO homepage_services (title, description, href, label, icon, priority, is_active)
      VALUES (${title}, ${description}, ${href}, ${label}, ${icon || 'Wifi'}, ${priority || 0}, ${is_active !== false})
      RETURNING *
    `;

    return NextResponse.json({ success: true, service: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_SERVICES_POST] Failed to create service:", error);
    return NextResponse.json({ success: false, error: "Failed to create service" }, { status: 500 });
  }
}
