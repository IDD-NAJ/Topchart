import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { name, type, category, file_url, thumbnail_url, dimensions, file_size, is_active } = body;

  try {
    const updated = await sql`
      UPDATE marketing_assets
      SET
        name             = COALESCE(${name ?? null}, name),
        type             = COALESCE(${type ?? null}, type),
        category         = COALESCE(${category ?? null}, category),
        file_url         = COALESCE(${file_url ?? null}, file_url),
        thumbnail_url    = COALESCE(${thumbnail_url ?? null}, thumbnail_url),
        dimensions       = COALESCE(${dimensions ?? null}, dimensions),
        file_size        = COALESCE(${file_size ?? null}, file_size),
        is_active        = COALESCE(${is_active ?? null}, is_active),
        updated_at       = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset: updated[0] });
  } catch (error) {
    console.error("Marketing asset PUT error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
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

  const { id } = await context.params;

  try {
    const deleted = await sql`
      DELETE FROM marketing_assets WHERE id = ${id} RETURNING id
    `;

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Marketing asset DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
