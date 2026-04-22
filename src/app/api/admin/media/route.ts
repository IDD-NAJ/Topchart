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
    const media = await sql`
      SELECT id, section, slot_key, media_type, file_url, storage_source, file_name, mime_type, file_size, is_active, priority, created_at, updated_at
      FROM homepage_media
      ORDER BY section ASC, slot_key ASC, priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, media });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load media" }, { status: 500 });
  }
}
