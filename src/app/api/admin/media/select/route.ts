import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { inferSectionFromSlotKey, isHomepageSection, isValidSlotKey, allowsMultipleForSlot } from "@/lib/homepage-media";
import { getSupabaseStorageEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { slot_key, section: sectionInput, priority, alt_text, file_url, source, file_name, mime_type, file_size } = body;
    const isActive = true;

    if (!slot_key || !file_url) {
      return NextResponse.json({ success: false, error: "slot_key and file_url are required" }, { status: 400 });
    }

    const section = isHomepageSection(sectionInput) ? sectionInput : inferSectionFromSlotKey(slot_key);
    
    if (!isValidSlotKey(section, slot_key)) {
      return NextResponse.json({ success: false, error: `Invalid slot_key "${slot_key}" for section "${section}"` }, { status: 400 });
    }

    let finalUrl = file_url;
    let finalSource = source;
    let finalPath = file_url;

    // Migrate Local to Supabase
    if (source === "local") {
      const env = getSupabaseStorageEnv();
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase not configured");
      }
      const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
      const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
      
      const localFilePath = path.join(process.cwd(), "public", file_url);
      if (!fs.existsSync(localFilePath)) {
        throw new Error("Local file not found for migration");
      }
      
      const buffer = fs.readFileSync(localFilePath);
      const uniqueFileName = `${uuidv4()}_${file_name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storagePath = `${section}/${uniqueFileName}`;
      
      const { error } = await client.storage.from(bucketName).upload(storagePath, buffer, {
        upsert: false,
        contentType: mime_type,
      });
      
      if (error) throw new Error(`Migration failed: ${error.message}`);
      
      const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(storagePath);
      finalUrl = publicUrlData.publicUrl;
      finalSource = "supabase";
      finalPath = storagePath;
    }

    const mediaType = mime_type?.startsWith("video/") ? "video" : "image";
    const status = isActive ? "active" : "inactive";

    if (!allowsMultipleForSlot(section, slot_key) && isActive) {
      await sql`
        UPDATE homepage_media
        SET status = 'inactive'
        WHERE section = ${section} AND slot_key = ${slot_key} AND status = 'active'
      `;
    }

    const inserted = await sql`
      INSERT INTO homepage_media (
        section, slot_key, media_type, file_url, storage_source, file_name, mime_type, file_size,
        storage_path, public_url, section_key, asset_type, alt_text, priority, status, version
      ) VALUES (
        ${section}, ${slot_key}, ${mediaType}, ${finalUrl}, ${finalSource}, ${file_name}, ${mime_type}, ${file_size},
        ${finalPath}, ${finalUrl}, ${slot_key}, ${mediaType}, ${alt_text}, ${Number.isFinite(priority) ? priority : 0}, ${status}, 1
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, media: inserted[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Selection failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
