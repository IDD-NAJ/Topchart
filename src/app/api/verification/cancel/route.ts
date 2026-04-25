import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { flagNumber } from "@/lib/pvadeals";
import { createPaystackRefund } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const sessions = await sql`
      SELECT s.user_id
      FROM auth_sessions s
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const userId = sessions[0].user_id;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { numberId } = body;

    if (!numberId) {
      return NextResponse.json(
        { success: false, error: "Number ID is required" },
        { status: 400 }
      );
    }

    // Get number details including purchase_price for refund
    const numbers = await sql`
      SELECT id, pvadeals_request_id, status, type, expires_at, allow_flag, purchase_price
      FROM verification_numbers
      WHERE id = ${numberId} AND user_id = ${userId}
    `;

    if (numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Number not found" },
        { status: 404 }
      );
    }

    const number = numbers[0];

    if (number.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Number is not active" },
        { status: 400 }
      );
    }

    if (!number.allow_flag) {
      return NextResponse.json(
        { success: false, error: "This number cannot be flagged/cancelled" },
        { status: 400 }
      );
    }

    // Guard: Do not allow cancellation if SMS has already been received
    const smsRecords = await sql`
      SELECT id FROM verification_sms WHERE number_id = ${numberId} LIMIT 1
    `;
    if (smsRecords.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel a number that has already received an SMS" },
        { status: 400 }
      );
    }

    // Check if already expired
    if (new Date(number.expires_at) < new Date()) {
      await sql`
        UPDATE verification_numbers
        SET status = 'expired', updated_at = NOW()
        WHERE id = ${numberId}
      `;
      
      return NextResponse.json(
        { success: false, error: "Number has already expired" },
        { status: 400 }
      );
    }

    // Flag/cancel with PVADeals
    if (number.pvadeals_request_id) {
      await flagNumber(number.pvadeals_request_id);
    }

    // Update status
    await sql`
      UPDATE verification_numbers
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${numberId}
    `;

    // ── Refund logic ──────────────────────────────────────────────────────────
    const purchasePrice = Number(number.purchase_price) || 0;
    let refundMethod: "wallet" | "paystack" | "none" = "none";
    let refundIssued = false;

    if (purchasePrice > 0) {
      // Find the linked transaction (wallet → verification_number_id; Paystack → metadata->>'number_id')
      const txRows = await sql`
        SELECT id, reference, payment_method, payment_channel, amount, status
        FROM transactions
        WHERE user_id = ${userId}
          AND (
            verification_number_id::text = ${numberId}
            OR (metadata->>'number_id') = ${numberId}
          )
          AND status IN ('success', 'pending')
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const tx = txRows.length > 0 ? (txRows[0] as any) : null;
      const isPaystack = tx?.payment_method === "paystack" || (tx?.payment_channel && tx.payment_channel !== "wallet");

      if (isPaystack && tx) {
        // Attempt Paystack refund (amount in pesewas = GHS * 100)
        const refundResult = await createPaystackRefund(tx.reference, Math.round(purchasePrice * 100));

        if (refundResult.success) {
          refundMethod = "paystack";
          refundIssued = true;
          await sql`
            UPDATE transactions
            SET status = 'refunded',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  refunded_at: new Date().toISOString(),
                  refund_reason: "User cancelled verification number",
                  refund_method: "paystack",
                  refund_amount: purchasePrice,
                  paystack_refund_id: refundResult.data?.id,
                })}::jsonb,
                updated_at = NOW()
            WHERE id = ${tx.id}
          `;
        } else {
          // Paystack refund failed — fall back to wallet credit
          console.warn("Paystack refund failed, falling back to wallet credit:", refundResult.error);
          await sql`
            UPDATE users SET wallet_balance = wallet_balance + ${purchasePrice} WHERE id = ${userId}
          `;
          refundMethod = "wallet";
          refundIssued = true;
          if (tx) {
            await sql`
              UPDATE transactions
              SET status = 'refunded',
                  metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                    refunded_at: new Date().toISOString(),
                    refund_reason: "User cancelled verification number",
                    refund_method: "wallet_fallback",
                    refund_amount: purchasePrice,
                    paystack_refund_error: refundResult.error,
                  })}::jsonb,
                  updated_at = NOW()
              WHERE id = ${tx.id}
            `;
          }
        }
      } else {
        // Wallet purchase — credit back
        await sql`
          UPDATE users SET wallet_balance = wallet_balance + ${purchasePrice} WHERE id = ${userId}
        `;
        refundMethod = "wallet";
        refundIssued = true;
        if (tx) {
          await sql`
            UPDATE transactions
            SET status = 'refunded',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  refunded_at: new Date().toISOString(),
                  refund_reason: "User cancelled verification number",
                  refund_method: "wallet",
                  refund_amount: purchasePrice,
                })}::jsonb,
                updated_at = NOW()
            WHERE id = ${tx.id}
          `;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        number_id: numberId,
        status: "cancelled",
        refunded: refundIssued,
        refund_method: refundMethod,
        refund_amount: refundIssued ? purchasePrice : 0,
      },
    });
  } catch (error) {
    console.error("Cancel number error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel number" },
      { status: 500 }
    );
  }
}
