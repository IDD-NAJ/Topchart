import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all commissions
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const resellerId = searchParams.get("reseller_id");

    const commissionColumnsRows = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reseller_commissions'
    `;
    const commissionColumns = new Set(
      (commissionColumnsRows as Array<{ column_name: string }>).map((row) => row.column_name)
    );

    const salesColumnsRows = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reseller_sales'
    `;
    const salesColumns = new Set(
      (salesColumnsRows as Array<{ column_name: string }>).map((row) => row.column_name)
    );

    const commissionAmountExpr = commissionColumns.has("amount")
      ? "rc.amount"
      : commissionColumns.has("commission_amount")
        ? "rc.commission_amount"
        : "0";
    const commissionAmountStatsExpr = commissionColumns.has("amount")
      ? "amount"
      : commissionColumns.has("commission_amount")
        ? "commission_amount"
        : "0";

    const saleAmountExpr = salesColumns.has("amount")
      ? "rs.amount"
      : commissionColumns.has("transaction_amount")
        ? "rc.transaction_amount"
        : "NULL";

    const joinResellerSales = commissionColumns.has("sale_id");
    const productExpr = salesColumns.has("product_name")
      ? "rs.product_name"
      : salesColumns.has("product_type")
        ? "rs.product_type"
        : "NULL::text";

    // Get commissions with reseller details
    let commissions: any[] = [];
    try {
      const params: unknown[] = [];
      let whereClause = "";

      if (resellerId) {
        params.push(resellerId);
        whereClause += ` WHERE rc.reseller_id = $${params.length}`;
      }

      if (status !== "all") {
        params.push(status);
        whereClause += whereClause ? ` AND rc.status = $${params.length}` : ` WHERE rc.status = $${params.length}`;
      }

      const query = `
        SELECT
          rc.id,
          rc.reseller_id,
          ${joinResellerSales ? "rc.sale_id" : "NULL::uuid AS sale_id"},
          ${commissionAmountExpr} AS amount,
          rc.status,
          rc.created_at,
          rp.business_name as reseller_name,
          rp.reseller_code,
          ${saleAmountExpr} AS sale_amount,
          ${joinResellerSales ? `${productExpr} AS product_name` : "NULL::text AS product_name"}
        FROM reseller_commissions rc
        JOIN reseller_profiles rp ON rc.reseller_id = rp.id
        ${joinResellerSales ? "LEFT JOIN reseller_sales rs ON rc.sale_id = rs.id" : ""}
        ${whereClause}
        ORDER BY rc.created_at DESC
        LIMIT 100
      `;

      commissions = await sqlUnsafe(query, params);
    } catch {
      commissions = [];
    }

    // Calculate stats
    const statsResult = await sqlUnsafe(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN ${commissionAmountStatsExpr} ELSE 0 END), 0) as pending_payouts,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN ${commissionAmountStatsExpr} ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(${commissionAmountStatsExpr}), 0) as total_commissions
      FROM reseller_commissions
    `);

    const stats = (statsResult[0] || {
      totalCommissions: 0,
      pendingPayouts: 0,
      totalPaid: 0
    }) as {
      total_commissions?: string | number;
      pending_payouts?: string | number;
      total_paid?: string | number;
    };

    return NextResponse.json({
      success: true,
      commissions,
      stats: {
        totalCommissions: parseFloat(String(stats.total_commissions || 0)),
        pendingPayouts: parseFloat(String(stats.pending_payouts || 0)),
        totalPaid: parseFloat(String(stats.total_paid || 0))
      }
    });
  } catch (error) {
    console.error("Admin commissions GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update commission status (mark as paid)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const { commission_id, status } = body;

    if (!commission_id || !status) {
      return NextResponse.json(
        { success: false, error: "Commission ID and status are required" },
        { status: 400 }
      );
    }

    if (status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Invalid status transition. Only pending to paid is allowed" },
        { status: 400 }
      );
    }

    const commissionRows = await sql`
      SELECT id, status
      FROM reseller_commissions
      WHERE id = ${commission_id}
      LIMIT 1
    `;

    if (!Array.isArray(commissionRows) || commissionRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Commission not found" },
        { status: 404 }
      );
    }

    const existingCommission = commissionRows[0] as { id: string; status: string };
    if (existingCommission.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending commissions can be marked as paid" },
        { status: 400 }
      );
    }

    const commissionColumnsRows = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reseller_commissions'
    `;
    const commissionColumns = new Set(
      (commissionColumnsRows as Array<{ column_name: string }>).map((row) => row.column_name)
    );
    const hasUpdatedAt = commissionColumns.has("updated_at");
    const hasPaidAt = commissionColumns.has("paid_at");

    const updateParts = ["status = $1"];
    if (hasPaidAt) {
      updateParts.push("paid_at = NOW()");
    }
    if (hasUpdatedAt) {
      updateParts.push("updated_at = NOW()");
    }

    await sqlUnsafe(
      `
      UPDATE reseller_commissions
      SET ${updateParts.join(", ")}
      WHERE id = $2
      `,
      [status, commission_id]
    );

    return NextResponse.json({
      success: true,
      message: `Commission marked as ${status}`
    });
  } catch (error) {
    console.error("Admin commissions PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
