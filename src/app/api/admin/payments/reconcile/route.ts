export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const secret = process.env.CRON_SECRET || "";
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pending = await sql`
      SELECT id, reference, type, status, metadata, user_id
      FROM transactions
      WHERE status = 'pending'
      ORDER BY updated_at DESC
      LIMIT 200
    `;

    let fixed = 0;

    for (const row of pending as Array<{ id: string; reference: string; type: string; status: string; metadata: any; user_id?: string }>) {
      const type = String(row.type || (row.metadata?.payment_type || "")).toLowerCase();

      if (type === 'giftcard') {
        const verify = await verifyPaystackTransaction(row.reference);
        if (verify.success && verify.data?.status === 'success') {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          const seg = () => Array.from({ length: 4 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
          const code = row.metadata?.code || `${seg()}-${seg()}-${seg()}-${seg()}`;
          await sql`
            UPDATE transactions
            SET status = 'completed',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ reconciled_at: new Date().toISOString() })}::jsonb,
                updated_at = NOW()
            WHERE id = ${row.id}
          `;
          await sql`
            UPDATE transactions SET metadata = metadata || jsonb_build_object('code', ${code}) WHERE id = ${row.id}
          `;
          fixed += 1;
        }
      } else if (type === 'bill_payment') {
        const verify = await verifyPaystackTransaction(row.reference);
        if (verify.success && verify.data?.status === 'success') {
          const receipt = `RCT-${Date.now()}`;
          await sql`
            UPDATE transactions
            SET status = 'completed',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ reconciled_at: new Date().toISOString() })}::jsonb,
                updated_at = NOW()
            WHERE id = ${row.id}
          `;
          await sql`
            UPDATE transactions SET metadata = metadata || jsonb_build_object('receipt', ${receipt}) WHERE id = ${row.id}
          `;
          fixed += 1;
        }
      }
    }

    return NextResponse.json({ success: true, fixed, scanned: pending.length });
  } catch (error) {
    console.error("Admin reconcile error:", error);
    return NextResponse.json({ success: false, error: "Failed to reconcile" }, { status: 500 });
  }
}
