import { sql, sqlUnsafe } from "@/lib/db";

type PaystackLikeData = {
  id?: number;
  status?: string;
  amount?: number;
  paid_at?: string | null;
  channel?: string;
  currency?: string;
  gateway_response?: string;
  ip_address?: string;
  customer?: { email?: string | null };
  authorization?: {
    card_type?: string;
    last4?: string;
    bank?: string;
  };
};

type FinalizeInput = {
  reference?: string;
  transactionId?: string;
  applicationId?: string;
  paystackData?: PaystackLikeData;
  actor?: "system" | "admin" | "user";
  reason?: string;
};

type FinalizeResult = {
  ok: boolean;
  applied: boolean;
  alreadyApplied: boolean;
  message: string;
  transactionId?: string;
  applicationId?: string;
  userId?: string;
  businessName?: string;
  resellerCode?: string;
  userEmail?: string;
};

function almostEqualMoney(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

function getErrorMessage(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
    ? (error as { message: string }).message
    : "";
}

async function ensureUsersRoleConstraintSupportsReseller(): Promise<void> {
  await sqlUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_users_role'
          AND conrelid = 'public.users'::regclass
      ) THEN
        ALTER TABLE public.users DROP CONSTRAINT chk_users_role;
      END IF;

      ALTER TABLE public.users
      ADD CONSTRAINT chk_users_role CHECK (UPPER(role) IN ('USER', 'ADMIN', 'RESELLER'));
    END
    $$;
  `);
}

async function upsertResellerProfile(application: {
  user_id: string;
  business_name: string;
  business_address?: string;
  business_phone?: string;
}): Promise<void> {
  await sql`
    INSERT INTO reseller_profiles (
      user_id, business_name, business_address, business_phone,
      reseller_code, commission_rate, discount_rate, status, wallet_balance
    )
    SELECT
      ${application.user_id},
      ${application.business_name},
      ${application.business_address || null},
      ${application.business_phone || null},
      'RSL' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8),
      5.0,
      2.0,
      'active',
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM reseller_profiles WHERE user_id = ${application.user_id}
    )
  `;
}

export async function finalizeResellerApplicationPayment(input: FinalizeInput): Promise<FinalizeResult> {
  const txRows = input.transactionId
    ? await sql`
        SELECT *
        FROM transactions
        WHERE id = ${input.transactionId}
        LIMIT 1
      `
    : await sql`
        SELECT *
        FROM transactions
        WHERE reference = ${input.reference || ""}
        LIMIT 1
      `;

  if (!Array.isArray(txRows) || txRows.length === 0) {
    return { ok: false, applied: false, alreadyApplied: false, message: "Transaction not found" };
  }

  const transaction = txRows[0] as {
    id: string;
    user_id: string;
    type?: string;
    amount?: number | string;
    status?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  };

  const metadata = (transaction.metadata || {}) as Record<string, unknown>;
  const metadataApplicationId =
    typeof metadata.application_id === "string" ? metadata.application_id : undefined;
  const callerApplicationId = input.applicationId;
  if (metadataApplicationId && callerApplicationId && metadataApplicationId !== callerApplicationId) {
    return {
      ok: false,
      applied: false,
      alreadyApplied: false,
      message: "Transaction application reference mismatch",
    };
  }
  const applicationId = metadataApplicationId || callerApplicationId;

  if (!applicationId) {
    return { ok: false, applied: false, alreadyApplied: false, message: "Application reference missing on transaction" };
  }

  const paymentType = String(metadata.payment_type || transaction.type || "").toLowerCase();
  if (paymentType !== "reseller_application") {
    return { ok: false, applied: false, alreadyApplied: false, message: "Transaction is not a reseller application payment" };
  }

  const appRows = await sql`
    SELECT id, user_id, business_name, business_address, business_phone, business_email, application_fee, payment_status, application_status
    FROM reseller_applications
    WHERE id = ${applicationId}
    LIMIT 1
  `;

  if (!Array.isArray(appRows) || appRows.length === 0) {
    return { ok: false, applied: false, alreadyApplied: false, message: "Application not found" };
  }

  const application = appRows[0] as {
    id: string;
    user_id: string;
    business_name: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    application_fee?: number | string;
    payment_status?: string;
    application_status?: string;
  };

  if (application.user_id !== transaction.user_id) {
    return { ok: false, applied: false, alreadyApplied: false, message: "Application owner does not match transaction user" };
  }

  const expectedAmount = Number(application.application_fee ?? transaction.amount ?? 0);
  const txAmount = Number(transaction.amount ?? 0);
  if (!almostEqualMoney(txAmount, expectedAmount)) {
    return { ok: false, applied: false, alreadyApplied: false, message: "Transaction amount does not match application fee" };
  }

  if (input.paystackData) {
    const paystackAmount = Number(input.paystackData.amount || 0) / 100;
    const paystackCurrency = (input.paystackData.currency || "GHS").toUpperCase();
    if (!almostEqualMoney(paystackAmount, expectedAmount)) {
      return { ok: false, applied: false, alreadyApplied: false, message: "Paystack amount does not match application fee" };
    }
    if (paystackCurrency !== "GHS") {
      return { ok: false, applied: false, alreadyApplied: false, message: "Invalid Paystack currency for reseller payment" };
    }
  }

  const wasAlreadyApplied =
    String(transaction.status || "").toLowerCase() === "success" &&
    String(application.payment_status || "").toLowerCase() === "paid" &&
    String(application.application_status || "").toLowerCase() === "approved";

  await sql`
    UPDATE transactions
    SET status = 'success',
        payment_channel = COALESCE(${input.paystackData?.channel || null}, payment_channel),
        card_type = COALESCE(${input.paystackData?.authorization?.card_type || null}, card_type),
        card_last4 = COALESCE(${input.paystackData?.authorization?.last4 || null}, card_last4),
        bank_name = COALESCE(${input.paystackData?.authorization?.bank || null}, bank_name),
        paid_at = COALESCE(${input.paystackData?.paid_at ? new Date(input.paystackData.paid_at).toISOString() : null}, paid_at, NOW()),
        ip_address = COALESCE(${input.paystackData?.ip_address || null}, ip_address),
        metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
          payment_type: "reseller_application",
          application_id: applicationId,
          finalized_at: new Date().toISOString(),
          finalized_by: input.actor || "system",
          finalize_reason: input.reason || null,
          paystack_id: input.paystackData?.id ?? null,
          paystack_status: input.paystackData?.status ?? "success",
          gateway_response: input.paystackData?.gateway_response ?? null,
        })}::jsonb,
        updated_at = NOW()
    WHERE id = ${transaction.id}
  `;

  await sql`
    UPDATE reseller_applications
    SET payment_status = 'paid',
        application_status = 'approved',
        paid_at = COALESCE(paid_at, NOW()),
        updated_at = NOW()
    WHERE id = ${applicationId}
  `;

  await upsertResellerProfile(application);

  try {
    await sql`
      UPDATE users
      SET role = 'RESELLER',
          updated_at = NOW()
      WHERE id = ${application.user_id}
    `;
  } catch (userUpdateError: unknown) {
    const errorMessage = getErrorMessage(userUpdateError);
    const isMissingUpdatedAt =
      errorMessage.includes('column "updated_at" of relation "users" does not exist');
    const isRoleConstraintError = errorMessage.includes('chk_users_role');

    if (isRoleConstraintError) {
      try {
        await ensureUsersRoleConstraintSupportsReseller();
      } catch (constraintRepairError) {
        console.warn("Unable to alter users role constraint for RESELLER:", constraintRepairError);
      }
    } else if (!isMissingUpdatedAt) {
      throw userUpdateError;
    }

    try {
      await sql`
        UPDATE users
        SET role = 'RESELLER',
            updated_at = NOW()
        WHERE id = ${application.user_id}
      `;
    } catch (retryError: unknown) {
      const retryMessage = getErrorMessage(retryError);
      const retryMissingUpdatedAt =
        retryMessage.includes('column "updated_at" of relation "users" does not exist');

      const retryRoleConstraint = retryMessage.includes('chk_users_role');
      if (retryRoleConstraint) {
        console.warn("Proceeding without users.role=RESELLER due to chk_users_role constraint");
      } else if (!retryMissingUpdatedAt) {
        throw retryError;
      } else {
        try {
          await sql`
            UPDATE users
            SET role = 'RESELLER'
            WHERE id = ${application.user_id}
          `;
        } catch (noUpdatedAtRetryError: unknown) {
          const noUpdatedAtRetryMessage = getErrorMessage(noUpdatedAtRetryError);
          if (noUpdatedAtRetryMessage.includes("chk_users_role")) {
            console.warn("Proceeding without users.role=RESELLER due to chk_users_role constraint");
          } else {
            throw noUpdatedAtRetryError;
          }
        }
      }
    }
  }

  const profileRows = await sql`
    SELECT reseller_code
    FROM reseller_profiles
    WHERE user_id = ${application.user_id}
    LIMIT 1
  `;
  const userRows = await sql`
    SELECT email
    FROM users
    WHERE id = ${application.user_id}
    LIMIT 1
  `;

  return {
    ok: true,
    applied: !wasAlreadyApplied,
    alreadyApplied: wasAlreadyApplied,
    message: wasAlreadyApplied ? "Payment already finalized" : "Payment finalized successfully",
    transactionId: transaction.id,
    applicationId,
    userId: application.user_id,
    businessName: application.business_name,
    resellerCode: (profileRows[0] as { reseller_code?: string } | undefined)?.reseller_code,
    userEmail: (userRows[0] as { email?: string } | undefined)?.email,
  };
}
