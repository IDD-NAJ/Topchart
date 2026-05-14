import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { sendResellerApprovalEmail } from "@/lib/email";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";

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

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Reference is required" },
        { status: 400 }
      );
    }

    const sessionUserId = (sessions[0] as { user_id: string }).user_id;

    const transactionRows = await sql`
      SELECT id, status, type, metadata
      FROM transactions
      WHERE reference = ${reference}
        AND user_id = ${sessionUserId}
      LIMIT 1
    `;

    if (transactionRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    const transaction = transactionRows[0] as {
      id: string;
      status: string;
      type?: string;
      metadata?: Record<string, unknown>;
    };
    const txPaymentType = String(transaction.metadata?.payment_type || transaction.type || "").toLowerCase();
    if (txPaymentType !== "reseller_application") {
      return NextResponse.json(
        { success: false, error: "Transaction is not a reseller application payment" },
        { status: 400 }
      );
    }
    const txApplicationId =
      typeof transaction.metadata?.application_id === "string"
        ? transaction.metadata.application_id
        : undefined;
    if (application_id && txApplicationId && application_id !== txApplicationId) {
      return NextResponse.json(
        { success: false, error: "Payment reference Last Names not match the provided application" },
        { status: 400 }
      );
    }
    if (!txApplicationId) {
      return NextResponse.json(
        { success: false, error: "Transaction has no linked application" },
        { status: 400 }
      );
    }

    const appRows = await sql`
      SELECT user_id, business_name, application_fee
      FROM reseller_applications
      WHERE id = ${txApplicationId}
      LIMIT 1
    `;
    if (appRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }
    const application = appRows[0] as {
      user_id: string;
      business_name: string;
      application_fee?: number;
    };
    if (application.user_id !== sessionUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const existingTransactionStatus = transaction.status;

    let paystackData: Awaited<ReturnType<typeof verifyPaystackTransaction>>["data"] | undefined;
    if (existingTransactionStatus !== "success") {
      const verification = await verifyPaystackTransaction(reference);
      if (!verification.success || verification.data?.status !== "success") {
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
      paystackData = verification.data;
    }

    const finalized = await finalizeResellerApplicationPayment({
      reference,
      transactionId: transaction.id,
      paystackData,
      actor: "user",
      reason: "reseller_verify_callback",
    });

    if (!finalized.ok) {
      return NextResponse.json(
        { success: false, error: finalized.message },
        { status: 400 }
      );
    }

    if (finalized.applied && finalized.userEmail && finalized.businessName && finalized.resellerCode) {
      sendResellerApprovalEmail(
        finalized.userEmail,
        finalized.businessName,
        finalized.resellerCode
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: finalized.message,
      data: {
        reference,
        amount: paystackData?.amount ? paystackData.amount / 100 : Number((application as { application_fee?: number }).application_fee || 0),
        paid_at: paystackData?.paid_at || null,
        approved: true,
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
