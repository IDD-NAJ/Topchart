import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { checkAndCreditReferrer } from "@/lib/referral-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const pending = await sql`
      SELECT id, reference, type, status, amount, user_id, metadata
      FROM transactions
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    let verified = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of pending as Array<{
      id: string;
      reference: string;
      type: string;
      status: string;
      amount: number;
      user_id?: string;
      metadata?: Record<string, unknown>;
    }>) {
      try {
        const verifyResult = await verifyPaystackTransaction(row.reference);

        if (!verifyResult.success) {
          errors.push(`Failed to verify ${row.reference}: ${verifyResult.error}`);
          skipped++;
          continue;
        }

        const paystackData = verifyResult.data!;
        const paystackStatus = paystackData.status;

        if (paystackStatus === "success") {
          const paidAmount = paystackData.amount / 100;

          await sql`
            WITH updated_tx AS (
              UPDATE transactions
              SET status = 'success',
                  metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                    auto_verified_at: new Date().toISOString(),
                    paystack_id: paystackData.id,
                    paid_at: paystackData.paid_at,
                    channel: paystackData.channel,
                    gateway_response: paystackData.gateway_response,
                    customer_email: paystackData.customer.email,
                  })}::jsonb,
                  payment_channel = ${paystackData.channel},
                  card_type = ${paystackData.authorization?.card_type},
                  card_last4 = ${paystackData.authorization?.last4},
                  bank_name = ${paystackData.authorization?.bank},
                  paid_at = ${paystackData.paid_at ? new Date(paystackData.paid_at).toISOString() : null},
                  ip_address = ${paystackData.ip_address},
                  updated_at = NOW()
              WHERE reference = ${row.reference}
                AND status != 'success'
              RETURNING user_id, amount
            )
            UPDATE users
            SET wallet_balance = wallet_balance + (SELECT amount FROM updated_tx),
                total_deposits = total_deposits + (SELECT amount FROM updated_tx)
            WHERE id::text = (SELECT user_id FROM updated_tx)
              AND EXISTS (SELECT 1 FROM updated_tx)
          `;

          if (row.user_id) {
            await checkAndCreditReferrer(row.user_id, paidAmount);
          }

          verified++;
        } else if (paystackStatus === "failed" || paystackStatus === "abandoned") {
          await sql`
            UPDATE transactions
            SET status = 'failed',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  auto_verified_at: new Date().toISOString(),
                  paystack_status: paystackStatus,
                  gateway_response: paystackData.gateway_response,
                })}::jsonb
            WHERE reference = ${row.reference}
          `;
          failed++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        errors.push(`Error processing ${row.reference}: ${err?.message || String(err)}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      verified,
      failed,
      skipped,
      total: pending.length,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Auto-verify error:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
