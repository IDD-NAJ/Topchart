import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { label, href, description, icon, parent_id, priority, is_active } = body;
    const { id } = params;

    const updated = await sql`
      UPDATE navigation_links
      SET 
        label = COALESCE(${label}, label),
        href = COALESCE(${href}, href),
        description = COALESCE(${description}, description),
        icon = COALESCE(${icon}, icon),
        parent_id = COALESCE(${parent_id}, parent_id),
        priority = COALESCE(${priority}, priority),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Navigation link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, link: updated[0] });
  } catch (error) {
    console.error("[ADMIN_NAVIGATION_PATCH] Failed to update navigation link:", error);
    return NextResponse.json({ success: false, error: "Failed to update navigation link" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const { id } = params;

    const deleted = await sql`
      DELETE FROM navigation_links WHERE id = ${id} RETURNING *
    `;

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Navigation link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, link: deleted[0] });
  } catch (error) {
    console.error("[ADMIN_NAVIGATION_DELETE] Failed to delete navigation link:", error);
    return NextResponse.json({ success: false, error: "Failed to delete navigation link" }, { status: 500 });
  }
}
