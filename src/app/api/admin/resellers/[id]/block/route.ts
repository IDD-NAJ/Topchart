import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { reason } = body;

  try {
    const updated = await sql`
      UPDATE reseller_profiles
      SET
        status      = 'blocked',
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Reseller not found" }, { status: 404 });
    }

    if (reason) {
      await sql`
        INSERT INTO fraud_alerts (
          reseller_id, alert_type, severity, description, status, created_at, updated_at
        ) VALUES (
          ${id}, 'admin_block', 'high', ${reason}, 'open', NOW(), NOW()
        )
      `.catch(() => null);
    }

    return NextResponse.json({ success: true, reseller: updated[0] });
  } catch (error) {
    console.error("Reseller block error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
