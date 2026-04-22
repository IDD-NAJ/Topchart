import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseStorageEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import { inferSectionFromSlotKey } from "@/lib/homepage-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const env = getSupabaseStorageEnv();
    
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: "Supabase not configured"
      }, { status: 500 });
    }

    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";

    console.log("[STORAGE_FILES] Listing files from bucket:", bucketName);

    // Recursive function to list all files
    const listAllFiles = async (folderPath: string = ""): Promise<any[]> => {
      const { data: items, error } = await client.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 1000,
          offset: 0,
        });

      if (error) {
        console.error(`[STORAGE_FILES] Error listing ${folderPath}:`, error);
        return [];
      }

      let files: any[] = [];

      for (const item of items || []) {
        const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        
        if (item.id) {
          // It's a file - item.id exists for files
          const { data: publicUrlData } = client.storage
            .from(bucketName)
            .getPublicUrl(fullPath);
          
          files.push({
            name: item.name,
            path: fullPath,
            fullPath: fullPath,
            size: item.metadata?.size || 0,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            publicUrl: publicUrlData.publicUrl,
            type: getFileType(item.name, item.metadata?.mimetype),
          });
        } else if (!item.id && item.name) {
          // It's a folder - recursively list
          const subFiles = await listAllFiles(fullPath);
          files = files.concat(subFiles);
        }
      }

      return files;
    };

    // Start listing from root
    const fileList = await listAllFiles("");
    console.log("[STORAGE_FILES] Found files:", fileList.length);

    // Get bucket info to check if public
    const { data: buckets } = await client.storage.listBuckets();
    const bucketInfo = buckets?.find(b => b.name === bucketName);

    return NextResponse.json({
      success: true,
      files: fileList,
      count: fileList.length,
      bucket: {
        name: bucketName,
        public: bucketInfo?.public,
        exists: !!bucketInfo,
      },
      sampleUrl: fileList[0]?.publicUrl || null,
    });

  } catch (error) {
    console.error("[STORAGE_FILES] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function getFileType(filename: string, mimetype?: string): string {
  if (mimetype) {
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("image/")) return "image";
  }
  
  const ext = filename.split(".").pop()?.toLowerCase();
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  
  if (ext && videoExts.includes(ext)) return "video";
  if (ext && imageExts.includes(ext)) return "image";
  
  return "unknown";
}

// POST to create media record from existing storage file
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { section_key, storage_path, asset_type, alt_text, priority = 0, is_active = true, file_name, mime_type, file_size } = body;

    if (!section_key || !storage_path) {
      return NextResponse.json({
        success: false,
        error: "section_key and storage_path are required"
      }, { status: 400 });
    }

    const env = getSupabaseStorageEnv();
    const client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from(bucketName)
      .getPublicUrl(storage_path);

    // Insert into database
    const { sql } = await import("@/lib/db");
    const inserted = await sql`
      INSERT INTO homepage_media (section, slot_key, media_type, file_url, section_key, asset_type, storage_path, public_url, alt_text, priority, is_active, storage_source, file_name, mime_type, file_size)
      VALUES (${inferSectionFromSlotKey(section_key)}, ${section_key}, ${asset_type || 'image'}, ${publicUrlData.publicUrl}, ${section_key}, ${asset_type || 'image'}, ${storage_path}, ${publicUrlData.publicUrl}, ${alt_text || null}, ${priority}, ${is_active}, 'supabase', ${file_name || null}, ${mime_type || null}, ${file_size || null})
      RETURNING id, section, slot_key, media_type, file_url, section_key, asset_type, storage_path, public_url, alt_text, priority, is_active, storage_source, file_name, mime_type, file_size, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      media: inserted[0]
    }, { status: 201 });

  } catch (error) {
    console.error("[STORAGE_FILES_POST] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
