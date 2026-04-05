import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
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
        { success: false, error: "Session expired - Please log in again" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reference, application_id } = body;

    if (!reference || !application_id) {
      return NextResponse.json(
        { success: false, error: "Reference and application_id are required" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const verification = await verifyPaystackTransaction(reference);

    if (!verification.success || verification.data?.status !== "success") {
      // Update transaction status to failed
      await sql`
        UPDATE transactions
        SET status = 'failed',
            updated_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              paystack_status: verification.data?.status,
              paystack_response: verification.data,
            })}::jsonb
        WHERE reference = ${reference}
      `;

      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Payment successful - update transaction
    await sql`
      UPDATE transactions
      SET status = 'completed',
          updated_at = NOW(),
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            paystack_status: verification.data?.status,
            paid_at: verification.data?.paid_at,
            channel: verification.data?.channel,
            card_type: verification.data?.authorization?.card_type,
            last4: verification.data?.authorization?.last4,
          })}::jsonb
      WHERE reference = ${reference}
    `;

    // Update application payment status
    await sql`
      UPDATE reseller_applications
      SET payment_status = 'paid',
          application_status = 'pending',
          paid_at = NOW(),
          updated_at = NOW()
      WHERE id = ${application_id}
    `;

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        reference,
        amount: verification.data?.amount ? verification.data.amount / 100 : 0,
        paid_at: verification.data?.paid_at,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
