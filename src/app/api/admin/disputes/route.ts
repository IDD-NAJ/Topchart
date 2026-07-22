import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const url = new URL(request.url);
    const statusFilter = (url.searchParams.get("status") || "").trim().toUpperCase();

    const rows = await sql`
      SELECT
        d.id,
        d."transactionId" AS transaction_id,
        d."userId" AS user_id,
        d.status,
        d.reason,
        d.resolution,
        d."createdAt" AS created_at,
        d."resolvedAt" AS resolved_at,
        t.type AS transaction_type,
        t.amount AS transaction_amount,
        t.reference AS transaction_reference,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name
      FROM disputes d
      LEFT JOIN transactions t ON t.id::text = d."transactionId"::text
      LEFT JOIN users u ON u.id::text = d."userId"::text
      WHERE (${statusFilter}::text = '' OR d.status::text = ${statusFilter})
      ORDER BY d."createdAt" DESC
      LIMIT 500
    `;

    return NextResponse.json({ success: true, disputes: Array.isArray(rows) ? rows : [] }, { status: 200 });
  } catch (error: any) {
    console.error("Admin disputes error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    const status = String(body.status || "").toUpperCase();
    const resolution = body.resolution !== undefined ? String(body.resolution) : null;

    if (!id) {
      return NextResponse.json({ success: false, error: "Dispute id is required" }, { status: 400 });
    }

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const isFinal = status === "RESOLVED" || status === "CLOSED";

    const updated = await sql`
      UPDATE disputes
      SET
        status = COALESCE(${status || null}::"DisputeStatus", status),
        resolution = COALESCE(${resolution}, resolution),
        "resolvedAt" = CASE WHEN ${isFinal} THEN NOW() ELSE "resolvedAt" END
      WHERE id::text = ${id}
      RETURNING id
    `;

    if (!Array.isArray(updated) || updated.length === 0) {
      return NextResponse.json({ success: false, error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Admin update dispute error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
