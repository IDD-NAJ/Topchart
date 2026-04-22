import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("Paystack event:", event.event);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const paidAmount = data.amount / 100;
      const userId = data.metadata?.user_id;

      const existingTx = await sql`
        SELECT id, status, type, metadata
        FROM transactions
        WHERE reference = ${reference}
        LIMIT 1
      `;

      if (existingTx.length > 0) {
        const transaction = existingTx[0] as {
          id: string;
          status: string;
          type?: string;
          metadata?: Record<string, unknown>;
        };
        const paymentType = String(
          transaction.metadata?.payment_type || transaction.type || ""
        ).toLowerCase();

        if (paymentType === "reseller_application") {
          await finalizeResellerApplicationPayment({
            reference,
            transactionId: transaction.id,
            paystackData: data,
            actor: "system",
            reason: "paystack_webhook_charge_success",
          });
          return NextResponse.json({ received: true }, { status: 200 });
        }

        if (transaction.status !== "success") {
          await sql`
            WITH updated_tx AS (
              UPDATE transactions
              SET status = 'success',
                  metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                    webhook_at: new Date().toISOString(),
                    paystack_id: data.id,
                    paid_at: data.paid_at,
                    channel: data.channel,
                    gateway_response: data.gateway_response,
                    customer_email: data.customer.email,
                  })}::jsonb,
                  payment_channel = ${data.channel},
                  card_type = ${data.authorization?.card_type},
                  card_last4 = ${data.authorization?.last4},
                  bank_name = ${data.authorization?.bank},
                  paid_at = ${data.paid_at ? new Date(data.paid_at).toISOString() : null},
                  ip_address = ${data.ip_address},
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

          if (userId) {
            await checkAndCreditReferrer(userId, paidAmount);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
