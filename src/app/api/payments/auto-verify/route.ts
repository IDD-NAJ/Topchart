import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Reference is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

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

    const existingTx = await sql`
      SELECT id, status, amount, user_id, type, metadata
      FROM transactions
      WHERE reference = ${reference}
    `;

    if (existingTx.length === 0) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = existingTx[0];

    if (transaction.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (transaction.status === "success" || transaction.status === "completed") {
      return NextResponse.json({
        success: true,
        data: {
          status: transaction.status,
          amount: Number(transaction.amount),
          reference,
          message: "Payment already verified",
        },
      });
    }

    const verifyResult = await verifyPaystackTransaction(reference);

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      );
    }

    const paystackData = verifyResult.data!;
    const paystackStatus = paystackData.status;

    if (paystackStatus === "success") {
      const paidAmount = paystackData.amount / 100;
      const txMetadata = (transaction.metadata || {}) as Record<string, unknown>;
      const txType = String(txMetadata.payment_type || transaction.type || "").toLowerCase();

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
          WHERE reference = ${reference}
            AND status != 'success'
          RETURNING user_id, amount
        )
        UPDATE users
        SET wallet_balance = wallet_balance + (SELECT amount FROM updated_tx),
            total_deposits = total_deposits + (SELECT amount FROM updated_tx)
        WHERE id::text = (SELECT user_id FROM updated_tx)
          AND EXISTS (SELECT 1 FROM updated_tx)
      `;

      const userResult = await sql`
        SELECT wallet_balance FROM users WHERE id = ${userId}
      `;

      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          amount: paidAmount,
          reference,
          message: "Payment auto-verified and wallet credited",
          newBalance: Number(userResult[0]?.wallet_balance || 0),
        },
      });
    } else if (paystackStatus === "failed" || paystackStatus === "abandoned") {
      await sql`
        UPDATE transactions
        SET status = 'failed',
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              auto_verified_at: new Date().toISOString(),
              paystack_status: paystackStatus,
              gateway_response: paystackData.gateway_response,
            })}::jsonb
        WHERE reference = ${reference}
      `;

      return NextResponse.json({
        success: false,
        data: {
          status: paystackStatus,
          reference,
          message: paystackData.gateway_response || "Payment was not successful",
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          status: "pending",
          reference,
          message: "Payment is still being processed",
        },
      });
    }
  } catch (error) {
    console.error("Auto-verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to auto-verify payment" },
      { status: 500 }
    );
  }
}
