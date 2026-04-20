import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, withTransaction } from "@/lib/db";
import { getOrderStatus } from "@/lib/datamart";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = crypto.randomUUID();
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await sql`
      SELECT user_id FROM auth_sessions
      WHERE token = ${sessionToken} AND expires_at > NOW()
      LIMIT 1
    `;
    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }
    const userId = String(sessions[0].user_id);

    const { id } = await params;

    const txRows = await sql`
      SELECT id, reference, status, amount, metadata, user_id, type
      FROM transactions
      WHERE reference = ${id} OR id::text = ${id}
      LIMIT 1
    `;

    if (txRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const tx = txRows[0];
    if (String(tx.user_id) !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const meta = (tx.metadata || {}) as Record<string, unknown>;

    if (tx.status === "success" || tx.status === "failed") {
      return NextResponse.json({
        success: true,
        data: {
          reference: tx.reference,
          status: tx.status,
          amount: Number(tx.amount),
          providerOrderId: meta.provider_order_ref || meta.provider_order_id,
          providerMessage: meta.provider_message || meta.provider_error || meta.reconcile_error,
          fulfilledAt: meta.fulfilled_at || meta.failed_at,
        },
        correlationId,
      });
    }

    const providerOrderRef = meta.provider_order_ref || meta.provider_order_id;
    if (providerOrderRef) {
      let providerStatus = await getOrderStatus(String(providerOrderRef));
      if (!providerStatus.success && (providerStatus.errorCode === "PROVIDER_TIMEOUT" || providerStatus.errorCode === "PROVIDER_5XX")) {
        providerStatus = await getOrderStatus(String(providerOrderRef));
      }
      if (providerStatus.success && providerStatus.data) {
        const status = providerStatus.data.orderStatus?.toLowerCase();

        if (status === "completed") {
          await sql`
            UPDATE transactions
            SET status = 'success',
                metadata = metadata || ${JSON.stringify({
                  provider_confirmed_at: new Date().toISOString(),
                })}::jsonb,
                updated_at = NOW()
            WHERE reference = ${String(tx.reference)}
          `;
          return NextResponse.json({
            success: true,
            data: { reference: tx.reference, status: "success", amount: Number(tx.amount) },
            correlationId,
          });
        }

        if (status === "failed") {
          await withTransaction(async (query) => {
            await query(
              `UPDATE transactions
               SET status = 'failed',
                   metadata = metadata || $1::jsonb,
                   updated_at = NOW()
               WHERE reference = $2`,
              [JSON.stringify({ provider_confirmed_failed_at: new Date().toISOString(), state: "refunded" }), String(tx.reference)]
            );
            await query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [Number(tx.amount), userId]);
          });

          return NextResponse.json({
            success: true,
            data: {
              reference: tx.reference,
              status: "failed",
              amount: Number(tx.amount),
              refunded: true,
            },
            correlationId,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: tx.reference,
        status: "pending",
        amount: Number(tx.amount),
      },
      correlationId,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error", correlationId },
      { status: 500 }
    );
  }
}
