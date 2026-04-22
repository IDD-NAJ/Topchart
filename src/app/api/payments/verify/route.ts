import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";

async function getReferralSettings() {
  const rows = await sql`
    SELECT referral_reward_amount, min_referrals_required, min_deposit_amount
    FROM referral_settings
    WHERE id = 1
  `
  
  if (rows.length === 0) {
    return {
      rewardAmount: 5.00,
      minInvites: 10,
      minDeposit: 20.00
    }
  }

  return {
    rewardAmount: parseFloat(rows[0].referral_reward_amount),
    minInvites: parseInt(rows[0].min_referrals_required),
    minDeposit: parseFloat(rows[0].min_deposit_amount),
  }
}

async function checkAndCreditReferrer(userId: string, depositAmount: number) {
  try {
    const settings = await getReferralSettings();
    const MIN_DEPOSIT_FOR_REFERRAL = settings.minDeposit;
    const referralReward = settings.rewardAmount;

    // Get true referrer_id from referrals table for this user
    const pendingReferral = await sql`
      SELECT id, referrer_id FROM referrals 
      WHERE referred_user_id = ${userId} AND status = 'pending'
    `;
    
    if (pendingReferral.length === 0) return;
    
    const referrerId = pendingReferral[0].referrer_id;
    const refId = pendingReferral[0].id;

    const user = await sql`SELECT total_deposits FROM users WHERE id = ${userId}`;
    if (user.length === 0) return;
    
    const currentTotalDeposits = parseFloat(user[0].total_deposits || "0");
    const newTotalDeposits = currentTotalDeposits + depositAmount;
    
    // Check if they crossed the minimum deposit threshold for the FIRST time
    if (currentTotalDeposits < MIN_DEPOSIT_FOR_REFERRAL && newTotalDeposits >= MIN_DEPOSIT_FOR_REFERRAL) {
      // 1. Mark referral as qualified
      await sql`
        UPDATE referrals 
        SET status = 'qualified', qualified_at = NOW()
        WHERE id = ${refId}
      `;

      // 2. Update qualified counts
      await sql`
        UPDATE users 
        SET qualified_referral_count = COALESCE(qualified_referral_count, 0) + 1
        WHERE id = ${referrerId}
      `;

      // 3. Auto-reward logic check
      const qualified = await sql`
        SELECT id FROM referrals 
        WHERE referrer_id = ${referrerId} AND status = 'qualified'
      `;

      if (qualified.length >= settings.minInvites) {
        const totalReward = qualified.length * referralReward;
        
        // Mark all qualified as rewarded
        await sql`
          UPDATE referrals 
          SET status = 'rewarded'
          WHERE referrer_id = ${referrerId} AND status = 'qualified'
        `;

        // Credit wallet instead of holding balance
        await sql`
          UPDATE users 
          SET wallet_balance = wallet_balance + ${totalReward},
              referral_earnings = COALESCE(referral_earnings, 0) + ${totalReward}
          WHERE id = ${referrerId}
        `;

        // Log transaction
        const ref = `REF-AUTO-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
        await sql`
          INSERT INTO transactions (id, type, status, amount, user_id, reference, description, created_at, updated_at)
          VALUES (
            gen_random_uuid()::text,
            'referral_reward',
            'success',
            ${totalReward},
            ${referrerId}::text,
            ${ref},
            ${'Referral reward for ' + qualified.length + ' qualified invites'},
            NOW(),
            NOW()
          )
        `;
      }
    }
  } catch (error) {
    console.error("Referral credit error:", error);
  }
}

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

    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Verify the session
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

    // Check if transaction exists and belongs to user
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

    // Verify ownership
    if (transaction.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const txMetadata = (transaction.metadata || {}) as Record<string, unknown>;
    const txType = String(txMetadata.payment_type || transaction.type || "").toLowerCase();
    const isResellerPayment = txType === "reseller_application";

    if (isResellerPayment) {
      let paystackData: Awaited<ReturnType<typeof verifyPaystackTransaction>>["data"] | undefined;
      if (transaction.status !== "success") {
        const verifyResult = await verifyPaystackTransaction(reference);
        if (!verifyResult.success || verifyResult.data?.status !== "success") {
          return NextResponse.json(
            { success: false, error: verifyResult.error || "Reseller payment is not successful" },
            { status: 400 }
          );
        }
        paystackData = verifyResult.data;
      }

      const finalized = await finalizeResellerApplicationPayment({
        reference,
        transactionId: String(transaction.id),
        applicationId:
          typeof txMetadata.application_id === "string"
            ? txMetadata.application_id
            : undefined,
        paystackData,
        actor: "user",
        reason: "generic_verify_route_reseller_reconcile",
      });
      if (!finalized.ok) {
        return NextResponse.json(
          { success: false, error: finalized.message },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          amount: Number(transaction.amount),
          reference,
          message: finalized.message,
          resellerApproved: true,
        },
      });
    }

    if (transaction.status === "success") {
      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          amount: Number(transaction.amount),
          reference,
          message: "Payment already verified and credited",
        },
      });
    }

    // Verify with Paystack
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
      
      // Update transaction and credit wallet in a single operation
      // Note: We use user_id instead of userId, and wallet_balance directly in users table
      await sql`
        WITH updated_tx AS (
          UPDATE transactions
          SET status = 'success',
              metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                verified_at: new Date().toISOString(),
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
        `;

      // Get updated balance
      const userResult = await sql`
        SELECT wallet_balance FROM users WHERE id = ${userId}
      `;

      // Check if this deposit qualifies the referrer for a reward
      await checkAndCreditReferrer(userId, paidAmount);

      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          amount: paidAmount,
          reference,
          message: "Payment verified and wallet credited",
          newBalance: Number(userResult[0]?.wallet_balance || 0),
        },
      });
    } else if (paystackStatus === "failed" || paystackStatus === "abandoned") {
      // Update transaction status
      await sql`
        UPDATE transactions
        SET status = 'failed',
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              verified_at: new Date().toISOString(),
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
      // Payment is still pending
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
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
