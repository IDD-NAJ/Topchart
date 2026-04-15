import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";

async function getReferralSettings() {
  const rows = await sql`
    SELECT key, value FROM app_settings
    WHERE key IN ('referral_reward_amount', 'referral_min_invites')
  `
  
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  
  return {
    rewardAmount: parseFloat(settings["referral_reward_amount"] || "5.00"),
    minInvites: parseInt(settings["referral_min_invites"] || "10"),
  }
}

const MIN_DEPOSIT_FOR_REFERRAL = 10;

async function checkAndCreditReferrer(userId: string, depositAmount: number) {
  try {
    const settings = await getReferralSettings();
    const referralReward = settings.rewardAmount;

    const user = await sql`
      SELECT id, referred_by, total_deposits FROM users WHERE id = ${userId}
    `;
    
    if (user.length === 0 || !user[0].referred_by) return;
    
    const referrerId = user[0].referred_by;
    const currentTotalDeposits = parseFloat(user[0].total_deposits || "0");
    const newTotalDeposits = currentTotalDeposits + depositAmount;
    
    if (currentTotalDeposits < MIN_DEPOSIT_FOR_REFERRAL && newTotalDeposits >= MIN_DEPOSIT_FOR_REFERRAL) {
      await sql`
        UPDATE users 
        SET referral_reward_balance = COALESCE(referral_reward_balance, 0) + ${referralReward},
            referral_earnings = COALESCE(referral_earnings, 0) + ${referralReward},
            qualified_referral_count = COALESCE(qualified_referral_count, 0) + 1
        WHERE id = ${referrerId}
      `;
      
      try {
        await sql`
          INSERT INTO referral_visits (referrer_id, referred_user_id, credited, amount_credited, deposit_qualified)
          VALUES (${referrerId}, ${userId}, true, ${referralReward}, true)
        `;
      } catch (err) {
        console.error("Referral visit log error:", err);
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
