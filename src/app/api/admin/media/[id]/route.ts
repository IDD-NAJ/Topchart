import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteHomepageMediaObject } from "@/lib/supabase-storage";
import { allowsMultipleForSlot } from "@/lib/homepage-media";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

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
  const status = body.status === "active" || body.status === "inactive" || body.status === "archived" ? body.status : null;
  const priority = typeof body.priority === "number" ? body.priority : null;
  const altText = typeof body.alt_text === "string" ? body.alt_text : null;

  try {
    const existing = await sql`
      SELECT id, section, slot_key, status FROM homepage_media WHERE id = ${id} LIMIT 1
    `;
    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    const item = existing[0];

    if (status === "active" && !allowsMultipleForSlot(item.section, item.slot_key)) {
      await sql`
        UPDATE homepage_media
        SET status = 'inactive'
        WHERE section = ${item.section} AND slot_key = ${item.slot_key} AND status = 'active' AND id <> ${id}
      `;
    }

    const updated = await sql`
      UPDATE homepage_media
      SET
        status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        alt_text = COALESCE(${altText}, alt_text),
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
      SELECT id, storage_path, storage_source, file_url FROM homepage_media WHERE id = ${id} LIMIT 1
    `;
    if (!existing.length) {
      return NextResponse.json({ success: true, alreadyDeleted: true, deleted: id });
    }

    const item = existing[0];
    
    if (item.storage_source === "supabase" && item.storage_path && !String(item.storage_path).startsWith("seed/")) {
      try {
        await deleteHomepageMediaObject(String(item.storage_path));
      } catch {}
    } else if (item.storage_source === "local" && item.file_url) {
      try {
        const filePath = path.join(process.cwd(), "public", item.file_url.replace(/^\//, ""));
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch {}
    }

    await sql`DELETE FROM homepage_media WHERE id = ${id}`;
    return NextResponse.json({ success: true, deleted: id });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete media" }, { status: 500 });
  }
}
