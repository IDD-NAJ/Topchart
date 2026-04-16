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
  const sectionKey = typeof body.section_key === "string" ? body.section_key : null;
  const altText = typeof body.alt_text === "string" ? body.alt_text : null;
  const sortOrder = typeof body.sort_order === "number" ? body.sort_order : null;
  const isActive = typeof body.is_active === "boolean" ? body.is_active : null;

  try {
    const updated = await sql`
      UPDATE homepage_media
      SET
        section_key = COALESCE(${sectionKey}, section_key),
        alt_text = COALESCE(${altText}, alt_text),
        sort_order = COALESCE(${sortOrder}, sort_order),
        is_active = COALESCE(${isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, created_at, updated_at
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, media: updated[0] });
  } catch (error) {
    console.error("Homepage media admin PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update homepage media" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  try {
    const existing = await sql`
      SELECT id, storage_path
      FROM homepage_media
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    const storagePath = existing[0].storage_path as string;
    if (storagePath && !storagePath.startsWith("seed/")) {
      await deleteHomepageMediaObject(storagePath);
    }

    await sql`DELETE FROM homepage_media WHERE id = ${id}`;
    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Homepage media admin DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete homepage media" }, { status: 500 });
  }
}
