import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const health = {
    database: "unknown",
    apis: {
      paystack: "unknown",
      datamart: "unknown",
      reloadly: "unknown",
    },
    timestamp: new Date().toISOString(),
  };

  // 1. Check Database
  try {
    await sql`SELECT 1`;
    health.database = "connected";
  } catch (error) {
    health.database = "error";
    logger.error({ message: "Health check: Database failed", error });
  }

  // 2. Check External APIs
  health.apis.paystack = process.env.PAYSTACK_SECRET_KEY ? "configured" : "missing";
  health.apis.datamart = process.env.DATAMART_API_KEY ? "configured" : "missing";
  health.apis.reloadly = (process.env.RELOADLY_CLIENT_ID && process.env.RELOADLY_CLIENT_SECRET) ? "configured" : "missing";
  
  // 3. Check Supabase Storage
  let storageStatus = "missing";
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const bucketName = process.env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
      const { error } = await client.storage.getBucket(bucketName);
      storageStatus = error ? `error: ${error.message}` : "configured";
    } catch (e) {
      storageStatus = "error";
    }
  }
  (health.apis as any).supabase_storage = storageStatus;

  return NextResponse.json({
    success: true,
    health,
  });
}
