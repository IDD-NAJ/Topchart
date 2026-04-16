import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { uploadHomepageMedia, type HomepageMediaAssetType } from "@/lib/supabase-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const media = await sql`
      SELECT id, section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, created_at, updated_at
      FROM homepage_media
      ORDER BY section_key ASC, sort_order ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, media });
  } catch (error: unknown) {
    const message = String((error as { message?: string })?.message || "");
    if (message.includes("does not exist") || message.includes("relation")) {
      return NextResponse.json({ success: true, media: [] });
    }
    console.error("Homepage media admin GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load homepage media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const form = await request.formData();
    const sectionKey = String(form.get("section_key") || "").trim();
    const assetType = String(form.get("asset_type") || "image").trim() as HomepageMediaAssetType;
    const altText = String(form.get("alt_text") || "").trim() || null;
    const sortOrder = Number(form.get("sort_order") || 0);
    const isActiveRaw = String(form.get("is_active") || "true").trim().toLowerCase();
    const isActive = isActiveRaw !== "false";
    const file = form.get("file");

    if (!sectionKey) {
      return NextResponse.json({ success: false, error: "section_key is required" }, { status: 400 });
    }
    if (assetType !== "image" && assetType !== "video") {
      return NextResponse.json({ success: false, error: "asset_type must be image or video" }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }

    const uploaded = await uploadHomepageMedia({ file, sectionKey, assetType });

    const inserted = await sql`
      INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active)
      VALUES (${sectionKey}, ${assetType}, ${uploaded.storagePath}, ${uploaded.publicUrl}, ${altText}, ${sortOrder}, ${isActive})
      RETURNING id, section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, created_at, updated_at
    `;

    return NextResponse.json({ success: true, media: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Homepage media admin POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload homepage media" }, { status: 500 });
  }
}
