"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export type DashboardTransactionType = "deposit" | "airtime" | "data";
export type DashboardTransactionStatus = "pending" | "success" | "failed";

export interface DashboardTransactionRow {
  id: string;
  type: DashboardTransactionType;
  amount: number;
  status: DashboardTransactionStatus;
  description: string | null;
  network: string | null;
  phone_number: string | null;
  created_at: string;
}

export interface DashboardBeneficiaryRow {
  phone_number: string;
  network: string | null;
  created_at: string;
}

export interface DashboardData {
  totals: {
    totalDeposits: number;
    totalSpend: number;
    airtimeSpend: number;
    dataSpend: number;
    successfulCount: number;
    totalCount: number;
  };
  recentTransactions: DashboardTransactionRow[];
  beneficiaries: DashboardBeneficiaryRow[];
  processingPurchases: DashboardTransactionRow[];
}

export async function getDashboardData(options?: {
  recentLimit?: number;
  beneficiaryLimit?: number;
}): Promise<DashboardData> {
  const recentLimit = options?.recentLimit ?? 5;
  const beneficiaryLimit = options?.beneficiaryLimit ?? 4;

  const user = await getCurrentUser();
  if (!user) {
    return {
      totals: {
        totalDeposits: 0,
        totalSpend: 0,
        airtimeSpend: 0,
        dataSpend: 0,
        successfulCount: 0,
        totalCount: 0,
      },
      recentTransactions: [],
      beneficiaries: [],
      processingPurchases: [],
    };
  }

  // Optimize: Run all queries in parallel to reduce database round-trip latency
  const [
    totalsResult,
    recentRaw,
    processingRaw,
    beneficiariesResult
  ] = await Promise.all([
    // 1. Totals Summary
    sql`
      SELECT
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type = 'deposit'
        ), 0) AS "totalDeposits",
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type IN ('airtime', 'data')
        ), 0) AS "totalSpend",
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type = 'airtime'
        ), 0) AS "airtimeSpend",
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type = 'data'
        ), 0) AS "dataSpend",
        COALESCE(COUNT(*) FILTER (WHERE status = 'success'), 0) AS "successfulCount",
        COALESCE(COUNT(*), 0) AS "totalCount"
      FROM transactions
      WHERE user_id = ${user.id}
    `,

    // 2. Recent Transactions
    sql`
      SELECT
        id,
        type,
        amount,
        status,
        metadata,
        created_at
      FROM transactions
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT ${recentLimit}
    `,

    // 3. Processing/Pending Purchases
    sql`
      SELECT
        id,
        type,
        amount,
        status,
        metadata,
        created_at
      FROM transactions
      WHERE user_id = ${user.id}
        AND type IN ('airtime', 'data', 'AIRTIME', 'DATA')
        AND status IN ('pending', 'PENDING', 'processing', 'PROCESSING')
      ORDER BY created_at DESC
      LIMIT 10
    `,

    // 4. Frequent Beneficiaries
    sql`
      SELECT DISTINCT ON (
        COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        )
      )
        COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        ) AS phone_number,
        COALESCE(
          metadata->>'network',
          metadata->>'network_name',
          metadata->>'provider'
        ) AS network,
        created_at AS created_at
      FROM transactions
      WHERE user_id = ${user.id}
        AND status IN ('success', 'SUCCESS')
        AND type IN ('airtime', 'data', 'AIRTIME', 'DATA')
        AND COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        ) IS NOT NULL
      ORDER BY
        COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        ),
        created_at DESC
      LIMIT ${beneficiaryLimit}
    `
  ]);

  const totalsRow = (totalsResult?.[0] ?? {}) as any;

  // Helper to map raw DB rows to DashboardTransactionRow
  const mapTransaction = (row: any): DashboardTransactionRow => ({
    id: row.id,
    type: String(row.type || "").toLowerCase() as DashboardTransactionType,
    amount: Number(row.amount ?? 0),
    status: String(row.status || "").toLowerCase() as DashboardTransactionStatus,
    description: row.metadata?.description || row.metadata?.memo || null,
    network: row.metadata?.network || row.metadata?.network_name || row.metadata?.provider || null,
    phone_number: row.metadata?.phoneNumber || row.metadata?.phone_number || null,
    created_at: row.created_at,
  });

  const recentTransactions = recentRaw.map(mapTransaction);
  const processingPurchases = processingRaw.map(mapTransaction);
  
  const beneficiaries = (beneficiariesResult as any[]).map(row => ({
    phone_number: row.phone_number,
    network: row.network,
    created_at: row.created_at
  })) as DashboardBeneficiaryRow[];

  return {
    totals: {
      totalDeposits: Number(totalsRow.totalDeposits ?? 0),
      totalSpend: Number(totalsRow.totalSpend ?? 0),
      airtimeSpend: Number(totalsRow.airtimeSpend ?? 0),
      dataSpend: Number(totalsRow.dataSpend ?? 0),
      successfulCount: Number(totalsRow.successfulCount ?? 0),
      totalCount: Number(totalsRow.totalCount ?? 0),
    },
    recentTransactions,
    beneficiaries,
    processingPurchases,
  };
}
