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
        error: "Supabase not configured",
        env: { hasUrl: !!env.SUPABASE_URL, hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY }
      }, { status: 500 });
    }

    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";

    // Test 1: Check bucket exists and is public
    const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
    const bucketInfo = buckets?.find(b => b.name === bucketName);

    // Test 2: List files
    const { data: files, error: filesError } = await client.storage
      .from(bucketName)
      .list();

    // Test 3: Get public URL for first file if exists
    let publicUrlTest = null;
    let firstFile = null;
    
    if (files && files.length > 0) {
      // Find first actual file (not folder)
      firstFile = files.find(f => f.id);
      
      if (firstFile) {
        const { data: urlData } = client.storage
          .from(bucketName)
          .getPublicUrl(firstFile.name);
        
        publicUrlTest = {
          path: firstFile.name,
          url: urlData.publicUrl,
        };
      }
    }

    return NextResponse.json({
      success: true,
      bucket: {
        name: bucketName,
        exists: !!bucketInfo,
        public: bucketInfo?.public,
        info: bucketInfo,
      },
      files: {
        count: files?.length || 0,
        error: filesError?.message,
        firstFile: firstFile ? {
          name: firstFile.name,
          id: firstFile.id,
          size: firstFile.metadata?.size,
        } : null,
      },
      publicUrlTest,
      supabaseUrl: env.SUPABASE_URL,
    });

  } catch (error) {
    console.error("[STORAGE_TEST] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
