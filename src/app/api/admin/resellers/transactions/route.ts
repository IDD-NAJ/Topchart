import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";

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
    const statusFilter = (url.searchParams.get("status") || "").trim().toLowerCase();
    const typeFilter = (url.searchParams.get("type") || "reseller_application").trim().toLowerCase();

    // Get all transactions related to reseller applications
    const rows = await sql`
      SELECT
        t.id,
        t.user_id,
        t.type,
        t.amount,
        t.status,
        t.reference,
        t.source AS description,
        t.currency,
        t.metadata,
        t.created_at,
        t.updated_at,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        ra.id AS application_id,
        ra.business_name,
        ra.application_status,
        ra.payment_status AS app_payment_status
      FROM transactions t
      LEFT JOIN users u ON u.id::text = t.user_id::text
      LEFT JOIN reseller_applications ra ON ra.id::text = (t.metadata->>'application_id')::text
      WHERE (
        t.type = 'reseller_application' 
        OR t.metadata->>'payment_type' = 'reseller_application'
        OR ${typeFilter}::text = ''
        OR LOWER(t.type::text) = ${typeFilter}
      )
      AND (${statusFilter}::text = '' OR LOWER(t.status::text) = ${statusFilter})
      ORDER BY t.created_at DESC
    `;

    const transactionsArray = Array.isArray(rows) ? rows : [];

    // Get summary stats
    const statsRows = await sql`
      SELECT 
        COUNT(*)::int as total_count,
        COUNT(*) FILTER (WHERE status IN ('success', 'completed'))::int as success_count,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending_count,
        COUNT(*) FILTER (WHERE status = 'failed')::int as failed_count,
        COUNT(*) FILTER (WHERE status = 'refunded')::int as refunded_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)::numeric as refunded_amount,
        COALESCE(SUM(amount) FILTER (WHERE status IN ('success', 'completed')), 0)::numeric as total_revenue
      FROM transactions
      WHERE type = 'reseller_application' 
        OR metadata->>'payment_type' = 'reseller_application'
    `;

    const stats = Array.isArray(statsRows) && statsRows.length > 0 ? statsRows[0] : {
      total_count: 0,
      success_count: 0,
      pending_count: 0,
      failed_count: 0,
      refunded_count: 0,
      refunded_amount: 0,
      total_revenue: 0
    };

    return NextResponse.json(
      { success: true, transactions: transactionsArray, stats },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Admin reseller transactions error:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PATCH to update transaction status (confirm payment or refund)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { transaction_id, action, reason } = body;

    if (!transaction_id || !action) {
      return NextResponse.json(
        { success: false, error: "Transaction ID and action are required" },
        { status: 400 }
      );
    }

    // Get transaction details
    const txRows = await sql`
      SELECT * FROM transactions WHERE id = ${transaction_id}
    `;

    if (!Array.isArray(txRows) || txRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = txRows[0];

    if (action === "confirm_payment") {
      if (transaction.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "Can only confirm pending transactions" },
          { status: 400 }
        );
      }

      await sql`
        UPDATE transactions
        SET metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
          confirmed_at: new Date().toISOString(),
          confirmed_by: "admin",
          confirmation_reason: reason || "Manual confirmation by admin",
        })}::jsonb,
            updated_at = NOW()
        WHERE id = ${transaction_id}
      `;

      const finalized = await finalizeResellerApplicationPayment({
        transactionId: transaction_id,
        applicationId:
          typeof transaction.metadata?.application_id === "string"
            ? transaction.metadata.application_id
            : undefined,
        actor: "admin",
        reason: reason || "admin_manual_confirmation",
      });

      if (!finalized.ok) {
        return NextResponse.json(
          { success: false, error: finalized.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: finalized.message
      });
    }

    if (action === "refund") {
      // Only allow refunding successful transactions
      if (!["success", "completed"].includes(transaction.status)) {
        return NextResponse.json(
          { success: false, error: "Can only refund successful transactions" },
          { status: 400 }
        );
      }

      // Update transaction status to refunded
      await sql`
        UPDATE transactions
        SET status = 'refunded',
            metadata = metadata || ${JSON.stringify({
              refunded_at: new Date().toISOString(),
              refunded_by: "admin",
              refund_reason: reason || "Manual refund by admin"
            })}::jsonb,
            updated_at = NOW()
        WHERE id = ${transaction_id}
      `;

      // Update application payment status to refunded
      const applicationId = transaction.metadata?.application_id;
      if (applicationId) {
        await sql`
          UPDATE reseller_applications
          SET payment_status = 'refunded',
              application_status = 'rejected',
              updated_at = NOW()
          WHERE id = ${applicationId}
        `;
      }

      return NextResponse.json({
        success: true,
        message: "Transaction refunded successfully"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'confirm_payment' or 'refund'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Admin transaction update error:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
