"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

// HubNet Dashboard Data Types
export interface WalletCard {
  balance: number;
  percentageChange: number;
  recentTopup: number;
}

export interface StatCard {
  label: string;
  value: number | string;
  unit?: string;
  percentageChange: number;
  todayValue?: number | string;
}

export interface NetworkSales {
  network: string;
  sales: number;
  percentageChange: number;
  icon?: string;
}

export interface ChartDataPoint {
  month?: string;
  week?: string;
  day?: string;
  value: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  package: string;
  network: string;
  networkName?: string;
  period?: string;
  status: string;
  createdAt: string;
}

export interface Activity {
  type: string;
  label: string;
  value: string;
  icon: string;
}

export interface DashboardData {
  wallet: WalletCard;
  stats: StatCard[];
  monthlyChart: ChartDataPoint[];
  weeklyChart: ChartDataPoint[];
  networkSales: NetworkSales[];
  recentTransactions: Transaction[];
  activities: Activity[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getCurrentUser();
  if (!user) {
    return getEmptyDashboard();
  }

  try {
    // Query real database against correct schema
    const [userRow, statsRow, monthlyData, weeklyData, networkData, transactionsData, topupData] = await Promise.all([
      // Get user wallet balance
      sql`SELECT wallet_balance FROM users WHERE id = ${user.id}`,
      
      // Get transaction stats (including month-over-month comparisons)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE type = 'purchase' AND status = 'completed') as total_orders,
          COUNT(*) FILTER (WHERE type = 'purchase' AND status = 'completed' AND DATE(created_at) = CURRENT_DATE) as today_orders,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'purchase'), 0) as total_sales,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'purchase' AND DATE(created_at) = CURRENT_DATE), 0) as today_sales,
          COUNT(*) FILTER (WHERE type = 'purchase' AND status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())) as this_month_orders,
          COUNT(*) FILTER (WHERE type = 'purchase' AND status = 'completed' AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', NOW())) as last_month_orders,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'purchase' AND created_at >= DATE_TRUNC('month', NOW())), 0) as this_month_sales,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'purchase' AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', NOW())), 0) as last_month_sales,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'deposit' AND created_at >= DATE_TRUNC('month', NOW())), 0) as this_month_topups,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'deposit' AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', NOW())), 0) as last_month_topups
        FROM transactions
        WHERE user_id = ${user.id}
      `,
      
      // Monthly breakdown (last 12 months)
      sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          COALESCE(SUM(amount), 0) as value
        FROM transactions
        WHERE user_id = ${user.id} AND status = 'completed' AND type = 'purchase' AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `,
      
      // Weekly breakdown (last 7 days)
      sql`
        SELECT 
          TO_CHAR(created_at, 'Dy') as day,
          DATE(created_at) as date_key,
          COALESCE(SUM(amount), 0) as value
        FROM transactions
        WHERE user_id = ${user.id} AND status = 'completed' AND type = 'purchase' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `,
      
      // Network sales today (with yesterday comparison for percentage change)
      sql`
        SELECT 
          network,
          COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as sales,
          COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE - 1), 0) as yesterday_sales,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as transaction_count
        FROM transactions
        WHERE user_id = ${user.id} AND created_at >= CURRENT_DATE - 1 AND status = 'completed' AND type = 'purchase'
        GROUP BY network
        HAVING COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) > 0
        ORDER BY sales DESC
      `,
      
      // Recent transactions (last 10)
      sql`
        SELECT 
          id,
          reference,
          amount,
          data_plan as package,
          network,
          status,
          created_at
        FROM transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 10
      `,

      // Most recent completed wallet top-up
      sql`
        SELECT amount, created_at
        FROM transactions
        WHERE user_id = ${user.id} AND type = 'deposit' AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
      `
    ]);

    // Loyalty and commission are queried separately so a missing table never breaks the dashboard
    let loyaltyTotal = 0;
    try {
      const loyaltyRows = await sql`
        SELECT COALESCE(referral_earnings, 0) as total
        FROM users
        WHERE id = ${user.id}
      `;
      loyaltyTotal = parseFloat((loyaltyRows[0] as any)?.total || '0');
    } catch {
      // referral_earnings column not available
    }

    let commissionTotal = 0;
    try {
      const commissionRows = await sql`
        SELECT COALESCE(SUM(rc.commission_amount), 0) as total
        FROM reseller_commissions rc
        JOIN reseller_profiles rp ON rc.reseller_id = rp.id
        WHERE rp.user_id = ${user.id} AND rc.status = 'paid'
      `;
      commissionTotal = parseFloat((commissionRows[0] as any)?.total || '0');
    } catch {
      // reseller tables not available
    }

    let lastLoginAt: string | null = null;
    try {
      const sessionRows = await sql`
        SELECT created_at
        FROM sessions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      lastLoginAt = (sessionRows[0] as any)?.created_at ?? null;
    } catch {
      // sessions table not available
    }

    const balance = parseFloat(userRow[0]?.wallet_balance || '0');
    const stats = statsRow[0] || {};

    // Month-over-month percentage change helper
    const pctChange = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(2));
    };

    const thisMonthOrders = parseInt(stats.this_month_orders || 0);
    const lastMonthOrders = parseInt(stats.last_month_orders || 0);
    const thisMonthSales = parseFloat(stats.this_month_sales || 0);
    const lastMonthSales = parseFloat(stats.last_month_sales || 0);
    const thisMonthTopups = parseFloat(stats.this_month_topups || 0);
    const lastMonthTopups = parseFloat(stats.last_month_topups || 0);

    const statCards: StatCard[] = [
      {
        label: 'Total Orders',
        value: parseInt(stats.total_orders || 0),
        percentageChange: pctChange(thisMonthOrders, lastMonthOrders),
        todayValue: parseInt(stats.today_orders || 0),
      },
      {
        label: 'Total Sales',
        value: `GH₵ ${parseFloat(stats.total_sales || 0).toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: pctChange(thisMonthSales, lastMonthSales),
        todayValue: `GH₵ ${parseFloat(stats.today_sales || 0).toFixed(2)}`,
      },
      {
        label: 'Loyalty Incentive',
        value: `GH₵ ${loyaltyTotal.toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: 0,
      },
      {
        label: 'Commission Income',
        value: `GH₵ ${commissionTotal.toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: 0,
      },
    ];

    const monthlyChart = monthlyData.map(row => ({
      month: row.month,
      value: parseFloat(row.value || 0),
    }));

    const weeklyChart = weeklyData.map(row => ({
      day: row.day,
      value: parseFloat(row.value || 0),
    }));

    const networkSales = networkData.map(row => ({
      network: row.network || 'Unknown',
      sales: parseFloat(row.sales || 0),
      percentageChange: pctChange(parseFloat(row.sales || 0), parseFloat(row.yesterday_sales || 0)),
    }));

    const recentTransactions: Transaction[] = transactionsData.map(row => ({
      id: row.id,
      orderId: row.reference || row.id,
      amount: parseFloat(row.amount || 0),
      package: row.package || 'Unknown',
      network: row.network || 'Unknown',
      status: row.status,
      createdAt: row.created_at,
    }));

    const recentTopup = parseFloat((topupData[0] as any)?.amount || '0');

    const activities: Activity[] = [
      {
        type: 'login',
        label: 'Last Login',
        value: lastLoginAt
          ? new Date(lastLoginAt).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
          : '—',
        icon: 'flag',
      },
      { type: 'topup', label: 'Wallet Balance', value: `GH₵ ${balance.toFixed(2)}`, icon: 'dollar-sign' },
      {
        type: 'commission',
        label: 'Commission Income',
        value: `GH₵ ${commissionTotal.toFixed(2)}`,
        icon: 'briefcase',
      },
      {
        type: 'orders',
        label: 'Recent Activity',
        value: `${recentTransactions.length} transactions`,
        icon: 'smartphone',
      },
    ];

    return {
      wallet: {
        balance,
        percentageChange: pctChange(thisMonthTopups, lastMonthTopups),
        recentTopup,
      },
      stats: statCards,
      monthlyChart,
      weeklyChart,
      networkSales,
      recentTransactions,
      activities,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return getEmptyDashboard();
  }
}

function getEmptyDashboard(): DashboardData {
  return {
    wallet: {
      balance: 0,
      percentageChange: 0,
      recentTopup: 0,
    },
    stats: [
      { label: 'Total Orders', value: 0, percentageChange: 0, todayValue: 0 },
      { label: 'Total Sales', value: 'GH₵ 0.00', unit: 'GH₵', percentageChange: 0, todayValue: 'GH₵ 0.00' },
      { label: 'Loyalty Incentive', value: 'GH₵ 0.00', unit: 'GH₵', percentageChange: 0 },
      { label: 'Commission Income', value: 'GH₵ 0.00', unit: 'GH₵', percentageChange: 0 },
    ],
    monthlyChart: [],
    weeklyChart: [],
    networkSales: [],
    recentTransactions: [],
    activities: [],
  };
}

// Foreign Numbers section data
export interface ForeignNumberData {
  id: string;
  number: string;
  service_name: string;
  service_category?: string;
  service_icon?: string;
  status: string;
  expires_at?: string;
  completed_at?: string;
  created_at: string;
  sms_count: number;
  type?: string;
}

export interface ForeignNumbersSummary {
  numbers: ForeignNumberData[];
  activeCount: number;
  totalCount: number;
}

export async function getForeignNumbersSummary(): Promise<ForeignNumbersSummary> {
  const user = await getCurrentUser();
  if (!user) {
    return { numbers: [], activeCount: 0, totalCount: 0 };
  }

  try {
    // Get recent foreign numbers (last 10)
    const numbers = await sql`
      SELECT 
        vn.id,
        vn.number,
        vs.name as service_name,
        vs.category as service_category,
        vs.picture_url as service_icon,
        vn.status,
        vn.expires_at,
        vn.completed_at,
        vn.created_at,
        vn.type,
        COALESCE(COUNT(vsms.id), 0) as sms_count
      FROM verification_numbers vn
      LEFT JOIN verification_services vs ON vn.service_id = vs.id
      LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
      WHERE vn.user_id = ${user.id}
      GROUP BY vn.id, vs.id, vs.name, vs.category, vs.picture_url
      ORDER BY 
        CASE 
          WHEN vn.status = 'active' THEN 0
          WHEN vn.status = 'pending' THEN 1
          WHEN vn.status = 'completed' THEN 2
          ELSE 3
        END,
        vn.created_at DESC
      LIMIT 10
    `;

    const totalCountResult = await sql`
      SELECT COUNT(*) as count
      FROM verification_numbers
      WHERE user_id = ${user.id}
    `;

    const activeCountResult = await sql`
      SELECT COUNT(*) as count
      FROM verification_numbers
      WHERE user_id = ${user.id} AND status = 'active'
    `;

    return {
      numbers: numbers as any[],
      activeCount: parseInt((activeCountResult[0] as any)?.count || 0),
      totalCount: parseInt((totalCountResult[0] as any)?.count || 0),
    };
  } catch (error) {
    console.error('Error fetching foreign numbers summary:', error);
    return { numbers: [], activeCount: 0, totalCount: 0 };
  }
}
