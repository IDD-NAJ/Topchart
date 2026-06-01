import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ success: false, error: "Reference is required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, status, amount, metadata FROM transactions WHERE reference = ${reference} LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const tx = rows[0] as { id: string; status: string; amount: number | string; metadata: Record<string, unknown> | null };

    if (tx.status === "completed" || tx.status === "success") {
      const meta = (tx.metadata || {}) as Record<string, unknown>;
      return NextResponse.json({ success: true, data: { status: "success", code: meta.code || meta.giftcard_code || null, reference } });
    }

    const verify = await verifyPaystackTransaction(reference);
    if (!verify.success) {
      return NextResponse.json({ success: false, error: verify.error || "Verification failed" }, { status: 400 });
    }

    const data = verify.data!;
    if (String(data.status).toLowerCase() !== "success") {
      if (data.status === "failed" || data.status === "abandoned") {
        await sql`UPDATE transactions SET status = 'failed', updated_at = NOW() WHERE reference = ${reference}`;
        return NextResponse.json({ success: false, data: { status: data.status, reference }, error: data.gateway_response || "Payment was not successful" });
      }
      return NextResponse.json({ success: true, data: { status: "pending", reference } });
    }

    const meta = (tx.metadata || {}) as Record<string, unknown>;
    let code: string | undefined = typeof meta.code === "string" ? meta.code : undefined;
    if (!code) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const seg = () => Array.from({ length: 4 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
      code = `${seg()}-${seg()}-${seg()}-${seg()}`;
    }

    await sql`
      UPDATE transactions
      SET status = 'completed',
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ verified_at: new Date().toISOString() })}::jsonb,
          payment_channel = ${data.channel},
          card_type = ${data.authorization?.card_type},
          card_last4 = ${data.authorization?.last4},
          bank_name = ${data.authorization?.bank},
          paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
          ip_address = ${data.ip_address},
          updated_at = NOW()
      WHERE reference = ${reference}
    `;

    await sql`
      UPDATE transactions
      SET metadata = metadata || jsonb_build_object('code', ${code}, 'paystack_id', ${data.id}, 'gateway_response', ${data.gateway_response})
      WHERE reference = ${reference}
    `;

    return NextResponse.json({ success: true, data: { status: "success", code, reference } });
  } catch (error) {
    console.error("Giftcards verify error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 });
  }
}
