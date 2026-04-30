import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorageEnv } from "@/lib/env";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const env = getSupabaseStorageEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase storage is not configured.");
    }
    const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Fetch Supabase files
    const { data: folders, error: foldersError } = await client.storage.from(bucketName).list();
    if (foldersError) throw foldersError;

    const supabaseFiles = [];
    for (const folder of folders || []) {
      if (!folder.id) { // It's a folder
        const { data: files } = await client.storage.from(bucketName).list(folder.name);
        for (const file of files || []) {
          if (file.name !== ".emptyFolderPlaceholder") {
            const path = `${folder.name}/${file.name}`;
            const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(path);
            supabaseFiles.push({
              id: file.id,
              name: file.name,
              path: path,
              publicUrl: publicUrlData.publicUrl,
              size: file.metadata?.size || 0,
              mimeType: file.metadata?.mimetype || "application/octet-stream",
              source: "supabase",
              folder: folder.name
            });
          }
        }
      } else { // It's a file in the root
        const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(folder.name);
        supabaseFiles.push({
          id: folder.id,
          name: folder.name,
          path: folder.name,
          publicUrl: publicUrlData.publicUrl,
          size: folder.metadata?.size || 0,
          mimeType: folder.metadata?.mimetype || "application/octet-stream",
          source: "supabase",
          folder: "root"
        });
      }
    }

    // 2. Fetch Local files
    const localFiles = [];
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "homepage-media");
    if (fs.existsSync(uploadsDir)) {
      const folders = fs.readdirSync(uploadsDir, { withFileTypes: true });
      for (const folder of folders) {
        if (folder.isDirectory()) {
          const files = fs.readdirSync(path.join(uploadsDir, folder.name));
          for (const file of files) {
            const filePath = path.join(uploadsDir, folder.name, file);
            const stats = fs.statSync(filePath);
            localFiles.push({
              id: `local_${folder.name}_${file}`,
              name: file,
              path: `/uploads/homepage-media/${folder.name}/${file}`,
              publicUrl: `/uploads/homepage-media/${folder.name}/${file}`,
              size: stats.size,
              mimeType: file.endsWith(".mp4") ? "video/mp4" : "image/jpeg", // Basic fallback
              source: "local",
              folder: folder.name
            });
          }
        }
      }
    }

    const dbMediaRows = (await sql`
      SELECT storage_path, file_url FROM homepage_media
    `) as Array<{ storage_path: string | null; file_url: string | null }>;
    const dbPathSet = new Set<string>();
    for (const row of dbMediaRows) {
      if (row.storage_path) dbPathSet.add(String(row.storage_path));
      if (row.file_url) dbPathSet.add(String(row.file_url));
    }

    const files = [...supabaseFiles, ...localFiles]
      .map((file) => ({
        ...file,
        linkedInDatabase: dbPathSet.has(file.path) || dbPathSet.has(file.publicUrl),
      }))
      .sort((a, b) => b.name.localeCompare(a.name));

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load files" },
      { status: 500 }
    );
  }
}
