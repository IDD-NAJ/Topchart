export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { flagNumber } from "@/lib/pvadeals";
import { banSmspvaNumber } from "@/lib/smspva";
import { syncPvadealsRequestAndSms } from "@/lib/verification-sms-sync";

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

    // Verify session — check public auth_sessions first, then neon_auth.session
    let userId: string | null = null;

    try {
      const sessions = await sql`
        SELECT user_id FROM auth_sessions
        WHERE token = ${sessionToken} AND expires_at > NOW()
        LIMIT 1
      `;
      if (sessions.length > 0) userId = String(sessions[0].user_id);
    } catch {
      // column may not exist
    }

    if (!userId) {
      try {
        const sessions = await sql`
          SELECT "userId" AS user_id FROM neon_auth.session
          WHERE token = ${sessionToken} AND "expiresAt" > NOW()
          LIMIT 1
        `;
        if (sessions.length > 0) userId = String(sessions[0].user_id);
      } catch {
        // neon_auth not available
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Session expired or invalid" },
        { status: 401 }
      );
    }

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
      SELECT id, pvadeals_request_id, status, type, expires_at, allow_flag, purchase_price, metadata
      FROM verification_numbers
      WHERE id::text = ${numberId}::text AND user_id::text = ${userId}::text
    `;

    if (numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Number not found or you don't have permission to cancel it" },
        { status: 404 }
      );
    }

    const number = numbers[0];

    if (number.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "This number has already been cancelled" },
        { status: 400 }
      );
    }

    if (number.status !== "active") {
      return NextResponse.json(
        { success: false, error: `Cannot cancel a number with status: ${number.status}` },
        { status: 400 }
      );
    }

    // Best-effort: pull the latest status + SMS from the provider before deciding,
    // so we don't cancel/refund a number that just received a code.
    const meta = (number.metadata as any) || {};
    const provider = meta.provider || "pvadeals";
    if (provider !== "smspva" && number.pvadeals_request_id) {
      try {
        const synced = await syncPvadealsRequestAndSms({
          numberId: String(number.id),
          pvadealsRequestId: String(number.pvadeals_request_id),
        });
        if (synced.ok && synced.dbStatus !== "active") {
          return NextResponse.json(
            { success: false, error: `Cannot cancel — this number is already ${synced.dbStatus}` },
            { status: 400 }
          );
        }
      } catch {
        // Provider sync is best-effort; continue with local checks
      }
    }

    // allow_flag = false means provider doesn't support flagging, but we still cancel internally
    // We only block if there's already been an SMS (delivery confirmed)
    const smsRecords = await sql`
      SELECT id FROM verification_sms WHERE number_id::text = ${numberId}::text LIMIT 1
    `;
    if (smsRecords.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel a number that has already received an SMS" },
        { status: 400 }
      );
    }

    // Check if already expired — mark it and return error
    if (number.expires_at && new Date(number.expires_at) < new Date()) {
      await sql`
        UPDATE verification_numbers
        SET status = 'expired', updated_at = NOW()
        WHERE id::text = ${numberId}::text
      `;
      return NextResponse.json(
        { success: false, error: "Number has already expired" },
        { status: 400 }
      );
    }

    // Atomically claim the cancellation. The status='active' guard prevents
    // double-cancel races (e.g. rapid double clicks) from issuing double refunds.
    const claimed = await sql`
      UPDATE verification_numbers
      SET status = 'cancelled', updated_at = NOW()
      WHERE id::text = ${numberId}::text AND status = 'active'
      RETURNING id
    `;
    if (claimed.length === 0) {
      return NextResponse.json(
        { success: false, error: "This number has already been cancelled" },
        { status: 400 }
      );
    }

    // Flag/cancel with the appropriate provider (best-effort)
    if (provider === "smspva" && meta.smspva_order_id && meta.smspva_service) {
      await banSmspvaNumber(parseInt(String(meta.smspva_order_id), 10), String(meta.smspva_service)).catch(() => {});
    } else if (number.pvadeals_request_id) {
      await flagNumber(number.pvadeals_request_id).catch(() => {});
    }

    // ── Refund logic ──────────────────────────────────────────────────────────
    // The number is already cancelled at this point, so refund errors must never
    // bubble up as a 500 — we report a partial result instead.
    const purchasePrice = Number(number.purchase_price) || 0;
    let refundMethod: "wallet" | "paystack" | "none" = "none";
    let refundIssued = false;
    let refundError: string | null = null;

    if (purchasePrice > 0) {
      // Find the linked transaction (wallet → verification_number_id; Paystack → metadata->>'number_id')
      let tx: any = null;
      try {
        const txRows = await sql`
          SELECT id, reference, payment_method, payment_channel, amount, status
          FROM transactions
          WHERE user_id::text = ${userId}::text
            AND verification_number_id::text = ${numberId}::text
            AND status IN ('success', 'pending')
          ORDER BY created_at DESC
          LIMIT 1
        `;
        tx = txRows.length > 0 ? (txRows[0] as any) : null;
      } catch (txLookupError) {
        console.error("Cancel refund: transaction lookup failed:", txLookupError);
        // Continue — the wallet refund below must still be attempted
      }

      const isPaystack = tx?.payment_method === "paystack" || (tx?.payment_channel && tx.payment_channel !== "wallet");

      // Always refund to wallet balance (never Paystack/mobile money refund)
      try {
        await sql`
          UPDATE users SET wallet_balance = wallet_balance + ${purchasePrice} WHERE id::text = ${userId}::text
        `;
        refundMethod = "wallet";
        refundIssued = true;
      } catch (walletError) {
        console.error("Cancel refund: wallet credit failed:", walletError);
        refundError = "Number was cancelled but the refund could not be credited. Please contact support.";
      }

      if (refundIssued && tx) {
        try {
          await sql`
            UPDATE transactions
            SET status = 'refunded',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  refunded_at: new Date().toISOString(),
                  refund_reason: "User cancelled Foreign Number",
                  refund_method: isPaystack ? "wallet_redirect" : "wallet",
                  refund_amount: purchasePrice,
                  original_payment_method: isPaystack ? "paystack" : "wallet",
                })}::jsonb,
                updated_at = NOW()
            WHERE id = ${tx.id}
          `;
        } catch (txUpdateError) {
          // Non-fatal: wallet was already credited, transaction record just won't show refunded
          console.error("Cancel refund: transaction status update failed:", txUpdateError);
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
        refund_error: refundError,
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
