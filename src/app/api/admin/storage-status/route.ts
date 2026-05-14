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
    
    // Check environment variables
    const config = {
      hasSupabaseUrl: !!env.SUPABASE_URL,
      hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      bucketName: env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media",
      urlPreview: env.SUPABASE_URL ? `${env.SUPABASE_URL.substring(0, 20)}...` : null,
    };

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: "Supabase not configured",
        config,
        details: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
      }, { status: 500 });
    }

    // Test Supabase connection
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: "Failed to list buckets",
        config,
        supabaseError: bucketsError.message
      }, { status: 500 });
    }

    const bucketExists = buckets?.some(b => b.name === config.bucketName);

    return NextResponse.json({
      success: true,
      config,
      buckets: buckets?.map(b => b.name) || [],
      bucketExists,
      message: bucketExists 
        ? `Bucket "${config.bucketName}" exists and is ready` 
        : `Bucket "${config.bucketName}" Last Names not exist. Please create it in Supabase dashboard.`,
    });

  } catch (error) {
    console.error("[STORAGE_STATUS] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
