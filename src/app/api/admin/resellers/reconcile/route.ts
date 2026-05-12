import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const candidates = await sql`
      SELECT t.id, t.reference, t.metadata->>'application_id' AS application_id
      FROM transactions t
      LEFT JOIN reseller_applications ra
        ON ra.id::text = (t.metadata->>'application_id')::text
      WHERE (t.type = 'reseller_application' OR t.metadata->>'payment_type' = 'reseller_application')
        AND t.status = 'success'
        AND (
          ra.id IS NULL
          OR ra.payment_status <> 'paid'
          OR ra.application_status <> 'approved'
          OR NOT EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = t.user_id::text
              AND u.role = 'RESELLER'
          )
          OR NOT EXISTS (
            SELECT 1 FROM reseller_profiles rp
            WHERE rp.user_id::text = t.user_id::text
          )
        )
      ORDER BY t.created_at DESC
      LIMIT 200
    `;

    let repaired = 0;
    let skipped = 0;
    const failures: Array<{ transactionId: string; reason: string }> = [];

    for (const row of candidates as Array<{ id: string; reference: string; application_id?: string }>) {
      const result = await finalizeResellerApplicationPayment({
        transactionId: row.id,
        reference: row.reference,
        applicationId: row.application_id,
        actor: "admin",
        reason: "admin_reconciliation",
      });
      if (!result.ok) {
        failures.push({ transactionId: row.id, reason: result.message });
        continue;
      }
      if (result.applied) {
        repaired += 1;
      } else {
        skipped += 1;
      }
    }

    return NextResponse.json({
      success: true,
      scanned: (candidates as unknown[]).length,
      repaired,
      skipped,
      failures,
    });
  } catch (error) {
    console.error("Admin reseller reconciliation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
