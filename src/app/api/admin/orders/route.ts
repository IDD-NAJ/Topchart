export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page    = Math.max(1, parseInt(searchParams.get("page")   || "1",  10));
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset  = (page - 1) * limit;
  const status  = searchParams.get("status")  || "";
  const network = searchParams.get("network") || "";
  const search  = searchParams.get("search")  || "";
  const source  = searchParams.get("source")  || "all"; // "datamart" | "transactions" | "all"

  try {
    // Build a unified view from datamart_orders joined with users
    let rows: any[] = [];
    let total = 0;

    if (source === "all" || source === "datamart") {
      const dmRows = await sql`
        SELECT
          d.id,
          d.phone_number,
          d.network,
          d.capacity,
          d.price,
          d.status,
          d.order_reference,
          d.transaction_reference,
          d.processing_method,
          d.gateway,
          d.error_message,
          d.created_at,
          d.updated_at,
          u.id          AS user_id,
          u.email       AS user_email,
          u.first_name  AS user_first_name,
          u.last_name   AS user_last_name,
          'datamart'    AS source
        FROM datamart_orders d
        LEFT JOIN transactions t ON t.reference = d.transaction_reference
        LEFT JOIN users u ON u.id::text = t.user_id::text
        WHERE (
          ${status  ? sql`LOWER(d.status) = LOWER(${status})`  : sql`TRUE`}
          AND ${network ? sql`LOWER(d.network) ILIKE ${'%' + network + '%'}` : sql`TRUE`}
          AND ${search  ? sql`(
            d.phone_number ILIKE ${'%' + search + '%'} OR
            d.order_reference ILIKE ${'%' + search + '%'} OR
            d.transaction_reference ILIKE ${'%' + search + '%'} OR
            u.email ILIKE ${'%' + search + '%'}
          )` : sql`TRUE`}
        )
        ORDER BY d.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      rows = [...rows, ...dmRows];

      const countRow = await sql`
        SELECT COUNT(*) AS cnt
        FROM datamart_orders d
        LEFT JOIN transactions t ON t.reference = d.transaction_reference
        LEFT JOIN users u ON u.id::text = t.user_id::text
        WHERE (
          ${status  ? sql`LOWER(d.status) = LOWER(${status})`  : sql`TRUE`}
          AND ${network ? sql`LOWER(d.network) ILIKE ${'%' + network + '%'}` : sql`TRUE`}
          AND ${search  ? sql`(
            d.phone_number ILIKE ${'%' + search + '%'} OR
            d.order_reference ILIKE ${'%' + search + '%'} OR
            d.transaction_reference ILIKE ${'%' + search + '%'} OR
            u.email ILIKE ${'%' + search + '%'}
          )` : sql`TRUE`}
        )
      `;
      total += parseInt(String(countRow[0]?.cnt ?? 0));
    }

    // Aggregate stats
    const statsRows = await sql`
      SELECT
        COUNT(*)                                                         AS total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'completed')            AS completed,
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending')              AS pending,
        COUNT(*) FILTER (WHERE LOWER(status) = 'failed')               AS failed,
        COALESCE(SUM(price) FILTER (WHERE LOWER(status) = 'completed'), 0) AS revenue
      FROM datamart_orders
    `;
    const stats = statsRows[0] ?? {};

    return NextResponse.json({
      success: true,
      orders: rows,
      total,
      page,
      limit,
      stats: {
        total:     parseInt(String(stats.total     ?? 0)),
        completed: parseInt(String(stats.completed ?? 0)),
        pending:   parseInt(String(stats.pending   ?? 0)),
        failed:    parseInt(String(stats.failed    ?? 0)),
        revenue:   parseFloat(String(stats.revenue ?? 0)),
      },
    });
  } catch (error) {
    console.error("[admin/orders] GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, status, error_message, notes } = body;

    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    const validStatuses = ["pending", "processing", "completed", "failed", "cancelled", "refunded"];
    if (status && !validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    await sql`
      UPDATE datamart_orders
      SET
        status        = COALESCE(${status        ?? null}, status),
        error_message = COALESCE(${error_message ?? null}, error_message),
        updated_at    = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("[admin/orders] PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    await sql`DELETE FROM datamart_orders WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error) {
    console.error("[admin/orders] DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}
