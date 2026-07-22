export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { checkAndCreditReferrer } from "@/lib/referral-utils";

/**
 * POST /api/admin/transactions/[id]/action
 * Body: { action: "verify" | "cancel" }
 *
 * verify: Verifies the transaction against Paystack. If Paystack reports
 *         success and the transaction is a wallet deposit, the wallet is
 *         credited exactly once (idempotent guard on status != 'success').
 * cancel: Marks a still-pending transaction as cancelled. Cannot cancel a
 *         transaction that already succeeded.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    if (!["verify", "cancel"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'verify' or 'cancel'." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, reference, type, status, amount, user_id, metadata
      FROM transactions
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const tx = rows[0] as {
      id: string;
      reference: string | null;
      type: string | null;
      status: string;
      amount: number | string;
      user_id: string | null;
      metadata: Record<string, unknown> | null;
    };

    // ─── CANCEL ────────────────────────────────────────────────────────────
    if (action === "cancel") {
      if (tx.status === "success" || tx.status === "completed") {
        return NextResponse.json(
          { success: false, error: "Cannot cancel a transaction that already succeeded" },
          { status: 400 }
        );
      }
      if (tx.status === "cancelled") {
        return NextResponse.json({ success: true, message: "Transaction already cancelled" });
      }

      await sql`
        UPDATE transactions
        SET status = 'cancelled',
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              cancelled_by_admin: true,
              cancelled_by: auth.email,
              cancelled_at: new Date().toISOString(),
            })}::jsonb,
            updated_at = NOW()
        WHERE id = ${id}
      `;
      return NextResponse.json({ success: true, message: "Transaction cancelled", status: "cancelled" });
    }

    // ─── VERIFY ────────────────────────────────────────────────────────────
    if (!tx.reference) {
      return NextResponse.json(
        { success: false, error: "This transaction has no Paystack reference to verify" },
        { status: 400 }
      );
    }

    if (tx.status === "success" || tx.status === "completed") {
      return NextResponse.json({ success: true, message: "Transaction already verified", status: tx.status });
    }

    const psResult = await verifyPaystackTransaction(tx.reference);
    if (!psResult.success || !psResult.data) {
      return NextResponse.json(
        { success: false, error: psResult.error || "Failed to verify with Paystack" },
        { status: 400 }
      );
    }

    const psData = psResult.data;
    const paystackStatus = psData.status;
    const txType = String(tx.metadata?.payment_type || tx.type || "").toLowerCase();

    if (paystackStatus === "success") {
      if (txType === "deposit") {
        // Credit the wallet exactly once.
        await sql`
          WITH updated_tx AS (
            UPDATE transactions
            SET status = 'success',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  verified_by_admin: true,
                  verified_by: auth.email,
                  verified_at: new Date().toISOString(),
                  paystack_id: psData.id,
                  paid_at: psData.paid_at,
                  channel: psData.channel,
                  gateway_response: psData.gateway_response,
                })}::jsonb,
                payment_channel = ${psData.channel},
                paid_at = ${psData.paid_at ? new Date(psData.paid_at).toISOString() : null},
                updated_at = NOW()
            WHERE id = ${id}
              AND status != 'success'
            RETURNING user_id, amount
          )
          UPDATE users
          SET wallet_balance = COALESCE(wallet_balance, 0) + (SELECT amount FROM updated_tx),
              total_deposits = COALESCE(total_deposits, 0) + (SELECT amount FROM updated_tx)
          WHERE id::text = (SELECT user_id FROM updated_tx)
            AND EXISTS (SELECT 1 FROM updated_tx)
        `;

        if (tx.user_id) {
          await checkAndCreditReferrer(tx.user_id, Number(psData.amount) / 100);
        }

        return NextResponse.json({
          success: true,
          message: "Payment verified and wallet credited",
          status: "success",
        });
      }

      // Non-deposit transactions: mark verified without touching the wallet.
      await sql`
        UPDATE transactions
        SET status = 'success',
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              verified_by_admin: true,
              verified_by: auth.email,
              verified_at: new Date().toISOString(),
              paystack_id: psData.id,
              gateway_response: psData.gateway_response,
            })}::jsonb,
            updated_at = NOW()
        WHERE id = ${id}
          AND status != 'success'
      `;
      return NextResponse.json({
        success: true,
        message: "Payment verified (no wallet credit — not a deposit)",
        status: "success",
      });
    }

    if (paystackStatus === "failed" || paystackStatus === "abandoned") {
      await sql`
        UPDATE transactions
        SET status = 'failed',
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              verified_by_admin: true,
              verified_by: auth.email,
              verified_at: new Date().toISOString(),
              paystack_status: paystackStatus,
              gateway_response: psData.gateway_response,
            })}::jsonb,
            updated_at = NOW()
        WHERE id = ${id}
      `;
      return NextResponse.json({
        success: false,
        error: `Paystack reports this payment as ${paystackStatus}`,
        status: paystackStatus,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Payment is still pending on Paystack",
      status: "pending",
    });
  } catch (error) {
    console.error("[Admin/transactions/action] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
