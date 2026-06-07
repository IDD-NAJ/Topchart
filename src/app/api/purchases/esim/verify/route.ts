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

    if (tx.status === "success" || tx.status === "completed") {
      return NextResponse.json({ success: true, data: { status: "success", reference, amount: Number(tx.amount) } });
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

    // Mark eSIM order as processing after Paystack success
    try {
      await sql`
        UPDATE esim_orders
        SET processing_status = 'processing', updated_at = NOW()
        WHERE transaction_reference = ${tx.id}
      `;
    } catch {}

    await sql`
      UPDATE transactions
      SET metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ verified_at: new Date().toISOString() })}::jsonb,
          payment_channel = ${data.channel},
          paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
          updated_at = NOW()
      WHERE reference = ${reference}
    `;

    return NextResponse.json({ success: true, data: { status: "processing", reference, amount: Number(tx.amount) } });
  } catch (error) {
    console.error("eSIM verify error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 });
  }
}
