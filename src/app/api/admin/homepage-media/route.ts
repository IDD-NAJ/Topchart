import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { uploadHomepageMedia, type HomepageMediaAssetType } from "@/lib/supabase-storage";
import { getSupabaseStorageEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Increase body size limit for video uploads
export const bodyParser = {
  sizeLimit: "100mb",
};

export async function GET() {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

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
    const duration = Date.now() - startTime;
    console.log("[HOMEPAGE_MEDIA] GET completed", { requestId, count: media.length, duration });
    return NextResponse.json({ success: true, media });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = String((error as { message?: string })?.message || "");
    if (message.includes("does not exist") || message.includes("relation")) {
      console.log("[HOMEPAGE_MEDIA] Table does not exist, returning empty", { requestId, duration });
      return NextResponse.json({ success: true, media: [] });
    }
    console.error("[HOMEPAGE_MEDIA] GET error", { requestId, duration, error: message });
    return NextResponse.json({ success: false, error: "Failed to load homepage media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    // Check Supabase config first
    const env = getSupabaseStorageEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[UPLOAD] Supabase not configured", { hasUrl: !!env.SUPABASE_URL, hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY });
      return NextResponse.json({ 
        success: false, 
        error: "Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local" 
      }, { status: 500 });
    }

    const form = await request.formData();
    const sectionKey = String(form.get("section_key") || "").trim();
    const assetType = String(form.get("asset_type") || "image").trim() as HomepageMediaAssetType;
    const altText = String(form.get("alt_text") || "").trim() || null;
    const sortOrder = Number(form.get("sort_order") || 0);
    const isActiveRaw = String(form.get("is_active") || "true").trim().toLowerCase();
    const isActive = isActiveRaw !== "false";
    const file = form.get("file");

    console.log("[UPLOAD] Received request", { requestId, sectionKey, assetType, fileSize: file instanceof File ? file.size : 'not a file', fileType: file instanceof File ? file.type : 'unknown' });

    if (!sectionKey) {
      return NextResponse.json({ success: false, error: "section_key is required" }, { status: 400 });
    }
    if (assetType !== "image" && assetType !== "video") {
      return NextResponse.json({ success: false, error: "asset_type must be image or video" }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      console.error("[UPLOAD] File too large", { requestId, size: file.size, maxSize: MAX_FILE_SIZE });
      return NextResponse.json({ success: false, error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    const uploadStartTime = Date.now();
    const uploaded = await Promise.race([
      uploadHomepageMedia({ file, sectionKey, assetType }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Upload timeout")), 60000)
      )
    ]);
    const uploadDuration = Date.now() - uploadStartTime;
    console.log("[UPLOAD] Storage upload completed", { requestId, duration: uploadDuration, size: file.size });

    const inserted = await sql`
      INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active)
      VALUES (${sectionKey}, ${assetType}, ${uploaded.storagePath}, ${uploaded.publicUrl}, ${altText}, ${sortOrder}, ${isActive})
      RETURNING id, section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, created_at, updated_at
    `;

    const totalDuration = Date.now() - startTime;
    console.log("[UPLOAD] Homepage media upload completed", { requestId, totalDuration, mediaId: inserted[0]?.id });

    return NextResponse.json({ success: true, media: inserted[0] }, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error as any;
    console.error("[UPLOAD] Homepage media admin POST error", {
      requestId,
      duration,
      error: err?.message || String(error)
    });
    
    if (err?.message === "Upload timeout") {
      return NextResponse.json({ success: false, error: "Upload timed out. Please try again with a smaller file." }, { status: 504 });
    }
    
    return NextResponse.json({ success: false, error: "Failed to upload homepage media" }, { status: 500 });
  }
}
