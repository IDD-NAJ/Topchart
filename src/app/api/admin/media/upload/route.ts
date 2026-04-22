import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { uploadMedia, type UploadSource } from "@/lib/upload-handler";
import { inferSectionFromSlotKey, isHomepageSection, isValidSlotKey, allowsMultipleForSlot } from "@/lib/homepage-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const uploadRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = uploadRateMap.get(ip);
  if (!record || record.resetAt <= now) {
    uploadRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true, retryAfter: 0 };
  }
  if (record.count >= 20) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((record.resetAt - now) / 1000)) };
  }
  record.count += 1;
  return { ok: true, retryAfter: 0 };
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { success: false, error: "Too many uploads. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  try {
    const form = await request.formData();
    const slotKey = String(form.get("slot_key") || "").trim();
    const sectionInput = String(form.get("section") || "").trim();
    const mediaType = String(form.get("media_type") || "").trim() as "image" | "video";
    const altText = String(form.get("alt_text") || "").trim() || null;
    const priority = Number(form.get("priority") || 0);
    const storageSource = String(form.get("storage_source") || "supabase").trim() as UploadSource;
    const isActive = String(form.get("is_active") || "true").trim().toLowerCase() !== "false";
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
    }
    if (!slotKey) {
      return NextResponse.json({ success: false, error: "slot_key is required" }, { status: 400 });
    }
    if (mediaType !== "image" && mediaType !== "video") {
      return NextResponse.json({ success: false, error: "media_type must be image or video" }, { status: 400 });
    }
    const section = isHomepageSection(sectionInput) ? sectionInput : inferSectionFromSlotKey(slotKey);
    
    if (!isValidSlotKey(section, slotKey)) {
      return NextResponse.json({ success: false, error: `Invalid slot_key "${slotKey}" for section "${section}"` }, { status: 400 });
    }

    const uploaded = await uploadMedia(file, section, storageSource);

    const status = isActive ? "active" : "inactive";

    if (!allowsMultipleForSlot(section, slotKey) && isActive) {
      await sql`
        UPDATE homepage_media
        SET status = 'inactive'
        WHERE section = ${section} AND slot_key = ${slotKey} AND status = 'active'
      `;
    }

    const inserted = await sql`
      INSERT INTO homepage_media (
        section, slot_key, media_type, file_url, storage_source, file_name, mime_type, file_size,
        storage_path, public_url, section_key, asset_type, alt_text, priority, status, version
      ) VALUES (
        ${section}, ${slotKey}, ${mediaType}, ${uploaded.publicUrl}, ${uploaded.source}, ${uploaded.fileName}, ${uploaded.mimeType}, ${uploaded.fileSize},
        ${uploaded.storagePath}, ${uploaded.publicUrl}, ${slotKey}, ${mediaType}, ${altText}, ${Number.isFinite(priority) ? priority : 0}, ${status}, 1
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, media: inserted[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
