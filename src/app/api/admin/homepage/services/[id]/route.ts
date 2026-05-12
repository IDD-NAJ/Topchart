import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { title, description, href, label, icon, priority, is_active } = body;
    const { id } = await context.params;

    const updated = await sql`
      UPDATE homepage_services
      SET 
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        href = COALESCE(${href}, href),
        label = COALESCE(${label}, label),
        icon = COALESCE(${icon}, icon),
        priority = COALESCE(${priority}, priority),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: updated[0] });
  } catch (error) {
    console.error("[ADMIN_SERVICES_PATCH] Failed to update service:", error);
    return NextResponse.json({ success: false, error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const { id } = await context.params;

    const deleted = await sql`
      DELETE FROM homepage_services WHERE id = ${id} RETURNING *
    `;

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: deleted[0] });
  } catch (error) {
    console.error("[ADMIN_SERVICES_DELETE] Failed to delete service:", error);
    return NextResponse.json({ success: false, error: "Failed to delete service" }, { status: 500 });
  }
}
