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
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const sectionKey = typeof body.section_key === "string" ? body.section_key : null;
  const altText = typeof body.alt_text === "string" ? body.alt_text : null;
  const sortOrder = typeof body.sort_order === "number" ? body.sort_order : null;
  const priority = typeof body.priority === "number" ? body.priority : sortOrder;
  const isActive = typeof body.is_active === "boolean" ? body.is_active : null;

  try {
    if (isActive === true) {
      const current = await sql`
        SELECT slot_key, section_key FROM homepage_media WHERE id = ${id} LIMIT 1
      `;
      if (current.length) {
        const targetSection = sectionKey ?? current[0].slot_key ?? current[0].section_key;
        await sql`
          UPDATE homepage_media
          SET is_active = FALSE, updated_at = NOW()
          WHERE COALESCE(slot_key, section_key) = ${targetSection} AND id != ${id}
        `;
      }
    }

    const updated = await sql`
      UPDATE homepage_media
      SET
        section_key = COALESCE(${sectionKey}, section_key),
        slot_key    = COALESCE(${sectionKey}, slot_key),
        alt_text    = COALESCE(${altText},    alt_text),
        priority    = COALESCE(${priority},  priority),
        is_active   = COALESCE(${isActive},   is_active),
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING id, section_key, slot_key, asset_type, media_type, storage_path, public_url, file_url, alt_text, priority, is_active, created_at, updated_at
    `;

    if (!updated.length) {
      const duration = Date.now() - startTime;
      console.log("[HOMEPAGE_MEDIA] PATCH - not found", { requestId, id, duration });
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    console.log("[HOMEPAGE_MEDIA] PATCH completed", { requestId, id, duration });
    return NextResponse.json({ success: true, media: updated[0] });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[HOMEPAGE_MEDIA] PATCH error", {
      requestId,
      id,
      duration,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ success: false, error: "Failed to update homepage media" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

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
      const duration = Date.now() - startTime;
      console.log("[HOMEPAGE_MEDIA] DELETE - already deleted", { requestId, id, duration });
      return NextResponse.json({ success: true, alreadyDeleted: true, deleted: id });
    }

    const storagePath = existing[0].storage_path as string;
    if (storagePath && !storagePath.startsWith("seed/")) {
      try {
        await deleteHomepageMediaObject(storagePath);
      } catch (storageError) {
        console.error("[HOMEPAGE_MEDIA] Storage delete failed (continuing with DB delete)", {
          requestId,
          id,
          storagePath,
          error: storageError instanceof Error ? storageError.message : String(storageError)
        });
      }
    }

    await sql`DELETE FROM homepage_media WHERE id = ${id}`;
    const duration = Date.now() - startTime;
    console.log("[HOMEPAGE_MEDIA] DELETE completed", { requestId, id, duration });
    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[HOMEPAGE_MEDIA] DELETE error", {
      requestId,
      id,
      duration,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ success: false, error: "Failed to delete homepage media" }, { status: 500 });
  }
}
