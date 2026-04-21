import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseStorageEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

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

    // List all files in the bucket recursively
    const { data: files, error } = await client.storage
      .from(bucketName)
      .list("homepage", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("[STORAGE_FILES] Error listing files:", error);
      return NextResponse.json({
        success: false,
        error: `Failed to list files: ${error.message}`
      }, { status: 500 });
    }

    // Flatten the file list and get public URLs
    const flattenFiles = (items: any[], prefix = ""): any[] => {
      let result: any[] = [];
      
      for (const item of items || []) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        
        if (item.id) {
          // It's a file
          const { data: publicUrlData } = client.storage
            .from(bucketName)
            .getPublicUrl(`homepage/${path}`);
          
          result.push({
            name: item.name,
            path: `homepage/${path}`,
            fullPath: path,
            size: item.metadata?.size || 0,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            publicUrl: publicUrlData.publicUrl,
            type: getFileType(item.name, item.metadata?.mimetype),
          });
        } else if (item.name) {
          // It's a folder - need to list its contents
          // For now, just add as folder marker
          result.push({
            name: item.name,
            path: `homepage/${path}`,
            isFolder: true,
            itemCount: item.metadata?.itemCount || 0,
          });
        }
      }
      
      return result;
    };

    const fileList = flattenFiles(files || []);

    return NextResponse.json({
      success: true,
      files: fileList,
      count: fileList.length,
      bucket: bucketName,
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
    const { section_key, storage_path, asset_type, alt_text, sort_order = 0, is_active = true } = body;

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
      INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active)
      VALUES (${section_key}, ${asset_type || 'image'}, ${storage_path}, ${publicUrlData.publicUrl}, ${alt_text || null}, ${sort_order}, ${is_active})
      RETURNING id, section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, created_at, updated_at
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
