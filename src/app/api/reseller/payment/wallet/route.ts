import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, walletPaymentSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - Pay reseller application fee using wallet
async function POSTHandler(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get current user
    const sessions = await sql`
      SELECT u.id, u.email FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }
    
    const user = sessions[0];
    
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(walletPaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          errors: formatZodError(validation.errors!),
        },
        { status: 400 }
      );
    }
    
    const { application_id, amount } = validation.data!;
    
    // Get application details
    const applications = await sql`
      SELECT * FROM reseller_applications
      WHERE id = ${application_id} AND user_id = ${user.id}
      LIMIT 1
    `;
    
    if (!Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }
    
    const application = applications[0] as {
      payment_status: string;
      application_fee?: number;
    };
    
    if (application.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Application already paid" },
        { status: 400 }
      );
    }

    const applicationFee = Number(application.application_fee ?? 100);
    if (Math.abs(Number(amount) - applicationFee) > 0.01) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount for this application" },
        { status: 400 }
      );
    }
    
    // Check wallet balance
    const walletRows = await sql`
      SELECT wallet_balance FROM users WHERE id = ${user.id}
    `;
    
    const walletBalance = Number(walletRows[0]?.wallet_balance || 0);
    
    if (walletBalance < applicationFee) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }
    
    const transactionId = randomUUID();
    let paymentRows;
    try {
      paymentRows = await sql`
        WITH wallet_update AS (
          UPDATE users
          SET wallet_balance = wallet_balance - ${applicationFee},
              updated_at = NOW()
          WHERE id = ${user.id}
            AND wallet_balance >= ${applicationFee}
          RETURNING id
        ),
        tx_insert AS (
          INSERT INTO transactions (
            id, user_id, type, amount, status, reference, source,
            currency, metadata, created_at, updated_at
          )
          SELECT
            ${transactionId},
            ${user.id},
            'reseller_application',
            ${applicationFee},
            'success',
            'WALLET-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8),
            'Wallet Payment for Reseller Application',
            'GHS',
            ${JSON.stringify({ application_id, payment_type: "reseller_application", method: "wallet" })}::jsonb,
            NOW(),
            NOW()
          WHERE EXISTS (SELECT 1 FROM wallet_update)
        )
        SELECT EXISTS (SELECT 1 FROM wallet_update) AS debited
      `;
    } catch (walletUpdateError: unknown) {
      const errorMessage =
        typeof walletUpdateError === "object" &&
        walletUpdateError !== null &&
        "message" in walletUpdateError &&
        typeof (walletUpdateError as { message?: unknown }).message === "string"
          ? (walletUpdateError as { message: string }).message
          : "";
      const isMissingUpdatedAt =
        errorMessage.includes('column "updated_at" of relation "users" does not exist');

      if (!isMissingUpdatedAt) {
        throw walletUpdateError;
      }

      paymentRows = await sql`
        WITH wallet_update AS (
          UPDATE users
          SET wallet_balance = wallet_balance - ${applicationFee}
          WHERE id = ${user.id}
            AND wallet_balance >= ${applicationFee}
          RETURNING id
        ),
        tx_insert AS (
          INSERT INTO transactions (
            id, user_id, type, amount, status, reference, source,
            currency, metadata, created_at, updated_at
          )
          SELECT
            ${transactionId},
            ${user.id},
            'reseller_application',
            ${applicationFee},
            'success',
            'WALLET-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8),
            'Wallet Payment for Reseller Application',
            'GHS',
            ${JSON.stringify({ application_id, payment_type: "reseller_application", method: "wallet" })}::jsonb,
            NOW(),
            NOW()
          WHERE EXISTS (SELECT 1 FROM wallet_update)
        )
        SELECT EXISTS (SELECT 1 FROM wallet_update) AS debited
      `;
    }

    const debited = Boolean((paymentRows[0] as { debited?: boolean } | undefined)?.debited);
    if (!debited) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const finalized = await finalizeResellerApplicationPayment({
      transactionId,
      applicationId: String(application_id),
      actor: "user",
      reason: "wallet_reseller_application_payment",
    });
    if (!finalized.ok) {
      return NextResponse.json(
        { success: false, error: finalized.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: finalized.message,
      data: {
        application_id,
        amount: applicationFee,
        status: "approved"
      }
    });
    
  } catch (error: any) {
    console.error("Wallet payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment failed" },
      { status: 500 }
    );
  }
}

// Export POST with rate limiting
export const POST = withRateLimit({ type: "payment" })(POSTHandler);
