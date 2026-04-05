import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import {
  initializePaystackTransaction,
  generatePaystackReference,
} from "@/lib/paystack";
import { withCSRFProtection } from "@/lib/csrf-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Verify session and get user
    const sessions = await sql`
      SELECT s.user_id, u.email, u.first_name, u.last_name, u.phone
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired - Please log in again" },
        { status: 401 }
      );
    }

    const user = sessions[0];
    const userId = user.user_id;

    const body = await request.json();
    const { amount, application_id, metadata } = body;

    // Validate amount
    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `RSL-${generatePaystackReference()}`;

    // Convert to pesewas (Paystack uses smallest currency unit)
    const amountInPesewas = Math.round(amount * 100);

    // Get the callback URL
    const baseUrl = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "";
    const callbackUrl = baseUrl 
      ? `${baseUrl}/dashboard/reseller/payment/callback?reference=${reference}&application_id=${application_id}` 
      : undefined;

    // Create payment transaction record
    const txId = uuidv4();
    await sql`
      INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        status,
        reference,
        payment_method,
        currency,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${txId},
        ${userId},
        'reseller_application',
        ${amount},
        'pending',
        ${reference},
        'PAYSTACK',
        'GHS',
        ${JSON.stringify({
          application_id,
          payment_type: "reseller_application",
          initiated_at: new Date().toISOString(),
          ...metadata
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;

    // Initialize Paystack transaction
    const result = await initializePaystackTransaction(
      user.email,
      amountInPesewas,
      reference,
      {
        user_id: userId,
        user_name: `${user.first_name} ${user.last_name}`,
        transaction_type: "reseller_application",
        application_id: application_id,
      },
      callbackUrl
    );

    if (!result.success) {
      // Update transaction status to failed
      await sql`
        UPDATE transactions
        SET status = 'failed',
            updated_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              error: result.error || "Paystack initialization failed",
            })}::jsonb
        WHERE reference = ${reference}
      `;

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Update transaction with Paystack details
    await sql`
      UPDATE transactions
      SET paystack_access_code = ${result.data?.access_code || null},
          paystack_authorization_url = ${result.data?.authorization_url || null},
          updated_at = NOW()
      WHERE reference = ${reference}
    `;

    // Update application with payment reference
    await sql`
      UPDATE reseller_applications
      SET payment_reference = ${reference},
          payment_status = 'pending',
          transaction_id = ${txId},
          updated_at = NOW()
      WHERE id = ${application_id}
    `;

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: result.data?.authorization_url,
        access_code: result.data?.access_code,
        reference: reference,
        application_id: application_id,
      },
    });
  } catch (error) {
    console.error("Reseller payment initialization error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
});
