import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function tableExists(table: string) {
  try {
    const rows = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${table}
      ) AS exists
    `;
    return Boolean((rows as any[])[0]?.exists);
  } catch (error) {
    console.error(`Admin stats tableExists ${table} error:`, error);
    return false;
  }
}

async function safeNumberQuery(label: string, query: () => Promise<any[]>, fallback = 0) {
  try {
    const rows = await query();
    const value = Array.isArray(rows) && rows.length > 0 ? rows[0]?.value : 0;
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : fallback;
  } catch (error) {
    console.error(`Admin stats ${label} error:`, error);
    return fallback;
  }
}

async function safeRowsQuery<T = Record<string, any>>(label: string, query: () => Promise<T[]>, fallback: T[] = []) {
  try {
    const rows = await query();
    return Array.isArray(rows) ? rows : fallback;
  } catch (error) {
    console.error(`Admin stats ${label} error:`, error);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const [
      usersExists,
      transactionsExists,
      authSessionsExists,
      sessionsExists,
      ticketsExists,
      kycProfilesExists,
      referralsExists,
      airtimePurchasesExists,
      dataBundlePurchasesExists,
      walletsExists,
      disputesExists,
      networksExists,
      esimOrdersExists,
      proxyOrdersExists,
      giftcardOrdersExists,
      billPaymentsExists,
      marketingAssetsExists,
    ] = await Promise.all([
      tableExists("users"),
      tableExists("transactions"),
      tableExists("auth_sessions"),
      tableExists("sessions"),
      tableExists("tickets"),
      tableExists("kyc_profiles"),
      tableExists("referrals"),
      tableExists("airtime_purchases"),
      tableExists("data_bundle_purchases"),
      tableExists("wallets"),
      tableExists("disputes"),
      tableExists("networks"),
      tableExists("esim_orders"),
      tableExists("proxy_orders"),
      tableExists("giftcard_orders"),
      tableExists("bill_payments"),
      tableExists("marketing_assets"),
    ]);

    const totalUsersPromise = usersExists
      ? safeNumberQuery("total_users", () => sql`SELECT COUNT(*)::int AS value FROM users`)
      : Promise.resolve(0);

    const totalTransactionsPromise = transactionsExists
      ? safeNumberQuery("total_transactions", () => sql`SELECT COUNT(*)::int AS value FROM transactions`)
      : Promise.resolve(0);

    const recentSignupRowsPromise = usersExists
      ? safeRowsQuery("recent_signups", () => sql`
          SELECT COALESCE(to_jsonb(u)->>'created_at', to_jsonb(u)->>'createdAt') AS created_at
          FROM users u
        `)
      : Promise.resolve([]);

    const revenueRowsPromise = transactionsExists
      ? safeRowsQuery("total_revenue", () => sql`
          SELECT
            COALESCE(to_jsonb(t)->>'status', '') AS status,
            COALESCE(to_jsonb(t)->>'type', '') AS type,
            COALESCE(
              to_jsonb(t)->>'amount',
              to_jsonb(t)->>'amount_paid',
              to_jsonb(t)->>'amountPaid',
              ''
            ) AS amount
          FROM transactions t
        `)
      : Promise.resolve([]);

    const activeSessionRowsPromise = authSessionsExists
      ? safeRowsQuery("active_users", () => sql`
          SELECT
            COALESCE(to_jsonb(s)->>'user_id', to_jsonb(s)->>'userId') AS user_id,
            COALESCE(to_jsonb(s)->>'expires_at', to_jsonb(s)->>'expiresAt') AS expires_at
          FROM auth_sessions s
        `)
      : sessionsExists
        ? safeRowsQuery("active_users_sessions", () => sql`
            SELECT
              COALESCE(to_jsonb(s)->>'user_id', to_jsonb(s)->>'userId') AS user_id,
              COALESCE(to_jsonb(s)->>'expires_at', to_jsonb(s)->>'expiresAt') AS expires_at
            FROM auth_sessions s
          `)
        : Promise.resolve([]);

    const openTicketsPromise = ticketsExists
      ? safeNumberQuery("open_tickets", () => sql`SELECT COUNT(*)::int AS value FROM tickets WHERE status::text IN ('OPEN', 'IN_PROGRESS')`)
      : Promise.resolve(0);

    const pendingKycPromise = kycProfilesExists
      ? safeNumberQuery("pending_kyc", () => sql`SELECT COUNT(*)::int AS value FROM kyc_profiles WHERE status::text = 'PENDING'`)
      : Promise.resolve(0);

    const totalReferralsPromise = referralsExists
      ? safeNumberQuery("total_referrals", () => sql`SELECT COUNT(*)::int AS value FROM referrals`)
      : Promise.resolve(0);

    const totalAirtimePurchasesPromise = airtimePurchasesExists
      ? safeNumberQuery("airtime_purchases", () => sql`SELECT COUNT(*)::int AS value FROM airtime_purchases`)
      : Promise.resolve(0);

    const totalDataPurchasesPromise = dataBundlePurchasesExists
      ? safeNumberQuery("data_purchases", () => sql`SELECT COUNT(*)::int AS value FROM data_bundle_purchases`)
      : Promise.resolve(0);

    const totalWalletBalancePromise = walletsExists
      ? safeNumberQuery("wallet_balance", () => sql`SELECT COALESCE(SUM("availableBalance"), 0)::numeric AS value FROM wallets`)
      : Promise.resolve(0);

    const openDisputesPromise = disputesExists
      ? safeNumberQuery("open_disputes", () => sql`SELECT COUNT(*)::int AS value FROM disputes WHERE status::text IN ('OPEN', 'IN_PROGRESS')`)
      : Promise.resolve(0);

    const recentTransactionsPromise = transactionsExists && usersExists
      ? safeRowsQuery("recent_transactions", () => sql`
          SELECT t.*, u.email, u.first_name, u.last_name
          FROM transactions t
          LEFT JOIN users u ON u.id::text = t.user_id::text
          ORDER BY t.created_at DESC
          LIMIT 10
        `)
      : transactionsExists
        ? safeRowsQuery("recent_transactions_no_join", () => sql`
            SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10
          `)
        : Promise.resolve([]);

    const recentTicketsPromise = ticketsExists && usersExists
      ? safeRowsQuery("recent_tickets", () => sql`
          SELECT t.*, u.email, u.first_name, u.last_name
          FROM tickets t
          LEFT JOIN users u ON u.id::text = t."userId"
          ORDER BY t."createdAt" DESC
          LIMIT 5
        `)
      : ticketsExists
        ? safeRowsQuery("recent_tickets_no_join", () => sql`
            SELECT * FROM tickets ORDER BY "createdAt" DESC LIMIT 5
          `)
        : Promise.resolve([]);

    const transactionsByTypePromise = transactionsExists
      ? safeRowsQuery("transactions_by_type", () => sql`
          SELECT type, COUNT(*)::int as count, SUM(amount)::numeric as total
          FROM transactions
          WHERE status::text = 'SUCCESS'
          GROUP BY type
        `)
      : Promise.resolve([]);

    const transactionsByDayPromise = transactionsExists
      ? safeRowsQuery("transactions_by_day", () => sql`
          SELECT DATE(created_at) as date, COUNT(*)::int as count, SUM(amount)::numeric as total
          FROM transactions
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `)
      : Promise.resolve([]);

    const networkCountPromise = networksExists
      ? safeNumberQuery("network_count", () => sql`SELECT COUNT(*)::int AS value FROM networks`)
      : Promise.resolve(0);

    const esimOrderCountPromise = esimOrdersExists
      ? safeNumberQuery("esim_order_count", () => sql`SELECT COUNT(*)::int AS value FROM esim_orders`)
      : Promise.resolve(0);

    const proxyOrderCountPromise = proxyOrdersExists
      ? safeNumberQuery("proxy_order_count", () => sql`SELECT COUNT(*)::int AS value FROM proxy_orders`)
      : Promise.resolve(0);

    const giftcardOrderCountPromise = giftcardOrdersExists
      ? safeNumberQuery("giftcard_order_count", () => sql`SELECT COUNT(*)::int AS value FROM giftcard_orders`)
      : Promise.resolve(0);

    const billPaymentCountPromise = billPaymentsExists
      ? safeNumberQuery("bill_payment_count", () => sql`SELECT COUNT(*)::int AS value FROM bill_payments`)
      : Promise.resolve(0);

    const marketingAssetCountPromise = marketingAssetsExists
      ? safeNumberQuery("marketing_asset_count", () => sql`SELECT COUNT(*)::int AS value FROM marketing_assets`)
      : Promise.resolve(0);

    const [
      totalUsers,
      totalTransactions,
      recentSignupRows,
      revenueRows,
      activeSessionRows,
      openTickets,
      pendingKyc,
      totalReferrals,
      totalAirtimePurchases,
      totalDataPurchases,
      totalWalletBalance,
      openDisputes,
      recentTransactions,
      recentTickets,
      transactionsByType,
      transactionsByDay,
      networkCount,
      esimOrderCount,
      proxyOrderCount,
      giftcardOrderCount,
      billPaymentCount,
      marketingAssetCount,
    ] = await Promise.all([
      totalUsersPromise,
      totalTransactionsPromise,
      recentSignupRowsPromise,
      revenueRowsPromise,
      activeSessionRowsPromise,
      openTicketsPromise,
      pendingKycPromise,
      totalReferralsPromise,
      totalAirtimePurchasesPromise,
      totalDataPurchasesPromise,
      totalWalletBalancePromise,
      openDisputesPromise,
      recentTransactionsPromise,
      recentTicketsPromise,
      transactionsByTypePromise,
      transactionsByDayPromise,
      networkCountPromise,
      esimOrderCountPromise,
      proxyOrderCountPromise,
      giftcardOrderCountPromise,
      billPaymentCountPromise,
      marketingAssetCountPromise,
    ]);

    const now = Date.now();
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;

    const recentSignups = Array.isArray(recentSignupRows)
      ? recentSignupRows.reduce((count, row: any) => {
          const raw = row?.created_at;
          if (!raw) return count;
          const ts = Date.parse(String(raw));
          if (!Number.isNaN(ts) && ts > cutoff) return count + 1;
          return count;
        }, 0)
      : 0;

    const totalRevenue = Array.isArray(revenueRows)
      ? revenueRows.reduce((sum, row: any) => {
          const status = String(row?.status ?? "").toUpperCase();
          const type = String(row?.type ?? "").toLowerCase();
          if (status !== "SUCCESS" || type !== "deposit") return sum;
          const amount = Number(row?.amount);
          if (!Number.isFinite(amount)) return sum;
          return sum + amount;
        }, 0)
      : 0;

    const activeUsers = (() => {
      if (!Array.isArray(activeSessionRows)) return 0;
      const active = new Set<string>();
      activeSessionRows.forEach((row: any) => {
        const expiresRaw = row?.expires_at;
        if (!expiresRaw) return;
        const ts = Date.parse(String(expiresRaw));
        if (Number.isNaN(ts) || ts <= now) return;
        const userId = row?.user_id;
        if (userId) active.add(String(userId));
      });
      return active.size;
    })();

    const stats = {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue,
      recentSignups,
      openTickets,
      pendingKyc,
      totalReferrals,
      totalAirtimePurchases,
      totalDataPurchases,
      totalWalletBalance: Number(totalWalletBalance) || 0,
      openDisputes,
      recentTransactions,
      recentTickets,
      transactionsByType,
      transactionsByDay,
      networkCount,
      esimOrderCount,
      proxyOrderCount,
      giftcardOrderCount,
      billPaymentCount,
      marketingAssetCount,
    };

    return NextResponse.json(
      { success: true, stats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          recentSignups: 0,
          openTickets: 0,
          pendingKyc: 0,
          totalReferrals: 0,
          totalAirtimePurchases: 0,
          totalDataPurchases: 0,
          totalWalletBalance: 0,
          openDisputes: 0,
          recentTransactions: [],
          recentTickets: [],
          transactionsByType: [],
          transactionsByDay: [],
          networkCount: 0,
          esimOrderCount: 0,
          proxyOrderCount: 0,
          giftcardOrderCount: 0,
          billPaymentCount: 0,
          marketingAssetCount: 0,
        },
      },
      { status: 200 }
    );
  }
}
