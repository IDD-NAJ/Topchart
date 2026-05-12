import crypto from "crypto";
import { sql } from "@/lib/db";

async function getReferralSettings() {
  const rows = await sql`
    SELECT referral_reward_amount, min_referrals_required, min_deposit_amount
    FROM referral_settings
    WHERE id = 1
  `;

  if (rows.length === 0) {
    return {
      rewardAmount: 5.00,
      minInvites: 10,
      minDeposit: 20.00,
    };
  }

  return {
    rewardAmount: parseFloat(rows[0].referral_reward_amount),
    minInvites: parseInt(rows[0].min_referrals_required),
    minDeposit: parseFloat(rows[0].min_deposit_amount),
  };
}

async function checkAndCreditReferrer(userId: string, depositAmount: number) {
  try {
    const settings = await getReferralSettings();
    const MIN_DEPOSIT_FOR_REFERRAL = settings.minDeposit;
    const referralReward = settings.rewardAmount;

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

    if (currentTotalDeposits < MIN_DEPOSIT_FOR_REFERRAL && newTotalDeposits >= MIN_DEPOSIT_FOR_REFERRAL) {
      await sql`
        UPDATE referrals
        SET status = 'qualified', qualified_at = NOW()
        WHERE id = ${refId}
      `;

      await sql`
        UPDATE users
        SET qualified_referral_count = COALESCE(qualified_referral_count, 0) + 1
        WHERE id = ${referrerId}
      `;

      const qualified = await sql`
        SELECT id FROM referrals
        WHERE referrer_id = ${referrerId} AND status = 'qualified'
      `;

      if (qualified.length >= settings.minInvites) {
        const totalReward = qualified.length * referralReward;

        await sql`
          UPDATE referrals
          SET status = 'rewarded'
          WHERE referrer_id = ${referrerId} AND status = 'qualified'
        `;

        await sql`
          UPDATE users
          SET wallet_balance = wallet_balance + ${totalReward},
              referral_earnings = COALESCE(referral_earnings, 0) + ${totalReward}
          WHERE id = ${referrerId}
        `;

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
            ${"Referral reward for " + qualified.length + " qualified invites"},
            NOW(),
            NOW()
          )
        `;
      }
    }
  } catch (error) {
    console.error("[Referral] Credit error:", error);
  }
}

export { getReferralSettings, checkAndCreditReferrer };
