import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql, withTransaction } from "@/lib/db";
import { getOrderStatus } from "@/lib/datamart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error, correlationId }, { status: adminCheck.status });
    }

    const pendingRows = await sql`
      SELECT reference, amount, user_id, metadata
      FROM transactions
      WHERE status = 'pending'
        AND COALESCE(metadata->>'provider', '') = 'datamart'
      ORDER BY created_at ASC
      LIMIT 50
    `;

    let successCount = 0;
    let failedCount = 0;
    let unresolvedCount = 0;
    for (const row of pendingRows as Array<{ reference: string; amount: number; user_id: string; metadata: Record<string, unknown> }>) {
      const providerOrderRef = row.metadata?.provider_order_ref || row.metadata?.provider_order_id;
      if (!providerOrderRef) {
        unresolvedCount += 1;
        continue;
      }

      const statusResult = await getOrderStatus(String(providerOrderRef));
      if (!statusResult.success || !statusResult.data) {
        unresolvedCount += 1;
        continue;
      }

      const providerStatus = String(statusResult.data.orderStatus || "").toLowerCase();
      if (providerStatus === "completed") {
        await sql`
          UPDATE transactions
          SET status = 'success',
              metadata = metadata || ${JSON.stringify({
                state: "success",
                provider_confirmed_at: new Date().toISOString(),
              })}::jsonb,
              updated_at = NOW()
          WHERE reference = ${row.reference}
        `;
        successCount += 1;
      } else if (providerStatus === "failed") {
        await withTransaction(async (query) => {
          await query(
            `UPDATE transactions
             SET status = 'failed',
                 metadata = metadata || $1::jsonb,
                 updated_at = NOW()
             WHERE reference = $2`,
            [JSON.stringify({ state: "refunded", provider_confirmed_failed_at: new Date().toISOString() }), row.reference]
          );
          await query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [Number(row.amount), row.user_id]);
        });
        failedCount += 1;
      } else {
        unresolvedCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: pendingRows.length,
        successCount,
        failedCount,
        unresolvedCount,
      },
      correlationId,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error", correlationId }, { status: 500 });
  }
}
