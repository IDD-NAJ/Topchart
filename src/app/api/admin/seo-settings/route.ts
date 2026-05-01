import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await sql`
      SELECT id, page_key, title, meta_description, keywords, og_image_url, favicon_url, canonical_url, no_index, updated_by, updated_at, created_at
      FROM seo_settings
      ORDER BY page_key ASC
    `;

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[SEO Settings API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SEO settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { page_key, title, meta_description, keywords, og_image_url, favicon_url, canonical_url, no_index } = body;

    if (!page_key) {
      return NextResponse.json({ success: false, error: "page_key is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO seo_settings (page_key, title, meta_description, keywords, og_image_url, favicon_url, canonical_url, no_index, updated_by, updated_at)
      VALUES (
        ${page_key},
        ${title || null},
        ${meta_description || null},
        ${keywords || null},
        ${og_image_url || null},
        ${favicon_url || null},
        ${canonical_url || null},
        ${no_index || false},
        ${admin.userId}::uuid,
        NOW()
      )
      ON CONFLICT (page_key) DO UPDATE SET
        title = ${title || null},
        meta_description = ${meta_description || null},
        keywords = ${keywords || null},
        og_image_url = ${og_image_url || null},
        favicon_url = ${favicon_url || null},
        canonical_url = ${canonical_url || null},
        no_index = ${no_index || false},
        updated_by = ${admin.userId}::uuid,
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({ success: true, setting: result[0] });
  } catch (error) {
    console.error("[SEO Settings API] PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save SEO settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { page_key } = body;

    if (!page_key) {
      return NextResponse.json({ success: false, error: "page_key is required" }, { status: 400 });
    }

    await sql`DELETE FROM seo_settings WHERE page_key = ${page_key}`;
    return NextResponse.json({ success: true, deleted: page_key });
  } catch (error) {
    console.error("[SEO Settings API] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete SEO settings" },
      { status: 500 }
    );
  }
}
