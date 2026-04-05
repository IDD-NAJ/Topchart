import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { resolution_notes } = body;

  try {
    const updated = await sql`
      UPDATE fraud_alerts
      SET
        status            = 'resolved',
        resolved_by       = ${admin.userId},
        resolved_at       = NOW(),
        resolution_notes  = ${resolution_notes ?? null},
        updated_at        = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert: updated[0] });
  } catch (error) {
    console.error("Fraud alert resolve error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
