"use server";

import { sql } from "@/lib/db";
import { getCurrentUser, updateWalletBalance } from "./auth";

export interface Transaction {
  id: string;
  user_id: string;
  type: "deposit" | "airtime" | "data";
  amount: number;
  status: "pending" | "success" | "failed";
  reference: string;
  description: string | null;
  network: string | null;
  phone_number: string | null;
  data_plan: string | null;
  payment_method: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Paystack-specific fields
  paystack_reference: string | null;
  paystack_access_code: string | null;
  payment_channel: string | null;
  currency: string | null;
  fees: number | null;
  paid_at: string | null;
}

export interface TransactionResult {
  success: boolean;
  error?: string;
  transaction?: Transaction;
  newBalance?: number;
}

function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function fundWallet(
  amount: number,
  paymentMethod: string
): Promise<TransactionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const reference = generateReference("DEP");
    const nowIso = new Date().toISOString();

    // Ensure wallet exists
    const userIdText = String(user.id);
    let walletId: string;
    const existingWallet = await sql`
      SELECT id FROM wallets WHERE "userId" = ${userIdText} LIMIT 1
    `;
    if (existingWallet.length > 0) {
      walletId = existingWallet[0].id as string;
    } else {
      walletId = `WALLET_${generateReference("W")}`;
      await sql`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${userIdText},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
    }
    
    // Create transaction record (align with current transactions schema)
    const result = await sql`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      )
      VALUES (
        ${generateReference("TX")},
        'DEPOSIT',
        'SUCCESS',
        ${amount},
        'GHS',
        ${walletId},
        ${userIdText},
        ${reference},
        ${paymentMethod.toUpperCase()},
        ${JSON.stringify({
          description: "Wallet funding via " + paymentMethod,
          payment_method: paymentMethod,
        })}::jsonb,
        ${nowIso},
        ${nowIso}
      )
      RETURNING *
    `;

    // Update wallet balance
    const walletResult = await updateWalletBalance(user.id, amount, "add");
    
    if (!walletResult.success) {
      // Mark transaction as failed
      await sql`
        UPDATE transactions
        SET status = 'FAILED',
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
      return { success: false, error: walletResult.error };
    }

    return {
      success: true,
      transaction: result[0] as Transaction,
      newBalance: walletResult.newBalance,
    };
  } catch (error) {
    console.error("Fund wallet error:", error);
    return { success: false, error: "Failed to fund wallet. Please try again." };
  }
}

export async function purchaseAirtime(
  amount: number,
  phoneNumber: string,
  network: string
): Promise<TransactionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check wallet balance
    if (Number(user.wallet_balance) < amount) {
      return { success: false, error: "Insufficient wallet balance" };
    }

    const reference = generateReference("AIR");
    const nowIso = new Date().toISOString();

    // Ensure wallet exists
    const userIdText = String(user.id);
    let walletId: string;
    const existingWallet = await sql`
      SELECT id FROM wallets WHERE "userId" = ${userIdText} LIMIT 1
    `;
    if (existingWallet.length > 0) {
      walletId = existingWallet[0].id as string;
    } else {
      walletId = `WALLET_${generateReference("W")}`;
      await sql`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${userIdText},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
    }
    
    // Create transaction record (start as PENDING until admin confirms)
    const result = await sql`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      )
      VALUES (
        ${generateReference("TX")},
        'AIRTIME',
        'PENDING',
        ${amount},
        'GHS',
        ${walletId},
        ${userIdText},
        ${reference},
        'WALLET',
        ${JSON.stringify({
          description: `${network} Airtime - ₵${amount.toLocaleString()}`,
          network,
          phoneNumber,
        })}::jsonb,
        ${nowIso},
        ${nowIso}
      )
      RETURNING *
    `;

    // Deduct from wallet immediately; status will be updated to SUCCESS by admin
    const walletResult = await updateWalletBalance(user.id, amount, "subtract");
    
    if (!walletResult.success) {
      await sql`
        UPDATE transactions
        SET status = 'FAILED',
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
      return { success: false, error: walletResult.error };
    }

    return {
      success: true,
      transaction: result[0] as Transaction,
      newBalance: walletResult.newBalance,
    };
  } catch (error) {
    console.error("Purchase airtime error:", error);
    return { success: false, error: "Failed to purchase airtime. Please try again." };
  }
}

export async function purchaseData(
  amount: number,
  phoneNumber: string,
  network: string,
  dataPlan: string
): Promise<TransactionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check wallet balance
    if (Number(user.wallet_balance) < amount) {
      return { success: false, error: "Insufficient wallet balance" };
    }

    const reference = generateReference("DAT");
    const nowIso = new Date().toISOString();

    // Ensure wallet exists
    const userIdText = String(user.id);
    let walletId: string;
    const existingWallet = await sql`
      SELECT id FROM wallets WHERE "userId" = ${userIdText} LIMIT 1
    `;
    if (existingWallet.length > 0) {
      walletId = existingWallet[0].id as string;
    } else {
      walletId = `WALLET_${generateReference("W")}`;
      await sql`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${userIdText},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
    }
    
    // Create transaction record (start as PENDING until admin confirms)
    const result = await sql`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      )
      VALUES (
        ${generateReference("TX")},
        'DATA',
        'PENDING',
        ${amount},
        'GHS',
        ${walletId},
        ${userIdText},
        ${reference},
        'WALLET',
        ${JSON.stringify({
          description: `${network} Data - ${dataPlan}`,
          network,
          phoneNumber,
          dataPlan,
        })}::jsonb,
        ${nowIso},
        ${nowIso}
      )
      RETURNING *
    `;

    // Deduct from wallet
    const walletResult = await updateWalletBalance(user.id, amount, "subtract");
    
    if (!walletResult.success) {
      await sql`
        UPDATE transactions
        SET status = 'FAILED',
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
      return { success: false, error: walletResult.error };
    }

    return {
      success: true,
      transaction: result[0] as Transaction,
      newBalance: walletResult.newBalance,
    };
  } catch (error) {
    console.error("Purchase data error:", error);
    return { success: false, error: "Failed to purchase data. Please try again." };
  }
}

export async function getTransactions(
  type?: "deposit" | "airtime" | "data",
  limit = 50
): Promise<Transaction[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    let result;
    if (type) {
      result = await sql`
        SELECT * FROM transactions 
        WHERE user_id = ${user.id} AND type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      result = await sql`
        SELECT * FROM transactions 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    return result as Transaction[];
  } catch (error) {
    console.error("Get transactions error:", error);
    return [];
  }
}

export async function getTransactionByReference(
  reference: string
): Promise<Transaction | null> {
  try {
    const result = await sql`
      SELECT * FROM transactions 
      WHERE reference = ${reference}
    `;

    if (result.length === 0) {
      return null;
    }

    return result[0] as Transaction;
  } catch (error) {
    console.error("Get transaction error:", error);
    return null;
  }
}

export async function confirmPurchase(reference: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tx = await sql`
      SELECT type, status, amount
      FROM transactions
      WHERE reference = ${reference}
      LIMIT 1
    `;

    if (tx.length === 0) {
      return { success: false, error: "Transaction not found" };
    }

    const row = tx[0] as any;
    if (row.type !== "AIRTIME" && row.type !== "DATA") {
      return { success: false, error: "Not an airtime or data transaction" };
    }

    if (row.status !== "PENDING") {
      return { success: false, error: "Transaction is not pending" };
    }

    await sql`
      UPDATE transactions
      SET status = 'SUCCESS',
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            confirmed_at: new Date().toISOString(),
          })}::jsonb
      WHERE reference = ${reference}
    `;

    return { success: true };
  } catch (error) {
    console.error("Confirm purchase error:", error);
    return { success: false, error: "Failed to confirm purchase" };
  }
}
