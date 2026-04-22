import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteHomepageMediaObject } from "@/lib/supabase-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const isActive = typeof body.is_active === "boolean" ? body.is_active : null;
  const priority = typeof body.priority === "number" ? body.priority : null;

  try {
    if (isActive === true) {
      await sql`
        UPDATE homepage_media AS hm
        SET is_active = FALSE, updated_at = NOW()
        WHERE hm.id <> ${id}
          AND hm.slot_key = (SELECT slot_key FROM homepage_media WHERE id = ${id} LIMIT 1)
      `;
    }

    const updated = await sql`
      UPDATE homepage_media
      SET
        is_active = COALESCE(${isActive}, is_active),
        priority = COALESCE(${priority}, priority),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, media: updated[0] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update media" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }
  const { id } = await context.params;
  try {
    const existing = await sql`
      SELECT id, storage_path, storage_source FROM homepage_media WHERE id = ${id} LIMIT 1
    `;
    if (!existing.length) {
      return NextResponse.json({ success: true, alreadyDeleted: true, deleted: id });
    }

    const item = existing[0];
    if (item.storage_source === "supabase" && item.storage_path && !String(item.storage_path).startsWith("seed/")) {
      try {
        await deleteHomepageMediaObject(String(item.storage_path));
      } catch {}
    }

    await sql`DELETE FROM homepage_media WHERE id = ${id}`;
    return NextResponse.json({ success: true, deleted: id });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete media" }, { status: 500 });
  }
}
