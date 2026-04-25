import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorageEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const env = getSupabaseStorageEnv();
    
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "";

    const { data, error } = await client.storage.from(bucketName).list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const files = (data || []).map((item) => ({
      name: item.name,
      id: item.id,
      metadata: item.metadata,
      size: item.metadata?.size || 0,
      mimeType: item.metadata?.mimetype || "",
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      lastAccessedAt: item.last_accessed_at,
      path: path ? `${path}/${item.name}` : item.name,
      publicUrl: client.storage.from(bucketName).getPublicUrl(path ? `${path}/${item.name}` : item.name).data.publicUrl,
    }));

    return NextResponse.json({
      success: true,
      files,
      currentPath: path,
      bucket: bucketName,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to list files" },
      { status: 500 }
    );
  }
}
