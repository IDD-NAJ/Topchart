import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import {
  initializePaystackTransaction,
  generatePaystackReference,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    // Get the session token from cookies
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
      SELECT s.user_id, u.email, u.first_name, u.last_name
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
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { amount } = body;

    // Validate amount
    if (!amount || typeof amount !== "number" || amount < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid amount - minimum is GH₵10" },
        { status: 400 }
      );
    }

    if (amount > 10000) {
      return NextResponse.json(
        { success: false, error: "Maximum amount is GH₵10,000" },
        { status: 400 }
      );
    }

    // Calculate surcharge (4% of amount)
    const surcharge = Number((amount * 0.04).toFixed(2));
    const chargeAmount = amount + surcharge;

    // Generate unique reference
    const reference = generatePaystackReference();

    // Convert to pesewas (Paystack uses smallest currency unit)
    const amountInPesewas = Math.round(chargeAmount * 100);

    // Get the callback URL
    const baseUrl = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "";
    const callbackUrl = baseUrl ? `${baseUrl}/dashboard?payment=callback&reference=${reference}` : undefined;

    // Create pending transaction in database
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
        fees,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${txId},
        ${userId},
        'deposit',
        ${amount},
        'pending',
        ${reference},
        'PAYSTACK',
        'GHS',
        ${surcharge},
        ${JSON.stringify({
          payment_method: "paystack",
          initiated_at: new Date().toISOString(),
          base_amount: amount,
          surcharge,
          charge_amount: chargeAmount,
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
        transaction_type: "wallet_funding",
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
          updated_at = NOW(),
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            paystack_access_code: result.data?.access_code,
          })}::jsonb
      WHERE reference = ${reference}
    `;

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: result.data?.authorization_url,
        access_code: result.data?.access_code,
        reference: result.data?.reference,
      },
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
