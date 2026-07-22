import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    // Check if table exists; if not, return empty data gracefully
    const tableExists = await sql`SELECT to_regclass('public.kyc_submissions')`;
    if (!tableExists[0].to_regclass) {
      return NextResponse.json({ success: true, data: [], warning: "table not provisioned" });
    }

    const reviews = await sql`
      SELECT id, user_id, status, document_type, rejection_reason, created_at, updated_at
      FROM kyc_submissions
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error("[ADMIN_KYC_REVIEWS_GET] Error:", error);
    return NextResponse.json({ success: true, data: [], warning: "Failed to load KYC reviews" });
  }
}
