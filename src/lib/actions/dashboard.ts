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
    const [walletData, stats, monthlyData, weeklyData, networkSalesData, transactionsData, activitiesData] = await Promise.all([
      // Wallet balance
      sql`
        SELECT COALESCE(SUM(amount), 0) as balance FROM user_wallets WHERE user_id = ${user.id}
      `,
      // Stats: total orders, sales, loyalty incentive, commission
      sql`
        SELECT
          (SELECT COUNT(*) FROM orders WHERE user_id = ${user.id}) as total_orders,
          (SELECT COUNT(*) FROM orders WHERE user_id = ${user.id} AND DATE(created_at) = CURRENT_DATE) as today_orders,
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ${user.id} AND status = 'completed') as total_sales,
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ${user.id} AND DATE(created_at) = CURRENT_DATE AND status = 'completed') as today_sales,
          (SELECT COALESCE(SUM(amount), 0) FROM user_loyalty WHERE user_id = ${user.id}) as loyalty_incentive,
          (SELECT COALESCE(SUM(amount), 0) FROM reseller_commissions WHERE user_id = ${user.id}) as total_commissions
      `,
      // Monthly breakdown (last 12 months)
      sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          COALESCE(SUM(amount), 0) as value
        FROM transactions
        WHERE user_id = ${user.id} AND status = 'completed' AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `,
      // Weekly breakdown (last 7 days)
      sql`
        SELECT 
          TO_CHAR(created_at, 'Day') as day,
          COALESCE(SUM(amount), 0) as value
        FROM transactions
        WHERE user_id = ${user.id} AND status = 'completed' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `,
      // Network sales (today)
      sql`
        SELECT 
          n.name as network,
          COALESCE(SUM(t.amount), 0) as sales,
          COUNT(*) as transaction_count
        FROM transactions t
        JOIN networks n ON t.network_id = n.id
        WHERE t.user_id = ${user.id} AND DATE(t.created_at) = CURRENT_DATE AND t.status = 'completed'
        GROUP BY n.id, n.name
        ORDER BY sales DESC
      `,
      // Recent transactions (last 10)
      sql`
        SELECT 
          o.id,
          o.reference_id,
          o.amount,
          db.name as package,
          n.name as network,
          o.status,
          o.created_at
        FROM orders o
        LEFT JOIN data_bundles db ON o.bundle_id = db.id
        LEFT JOIN networks n ON o.network_id = n.id
        WHERE o.user_id = ${user.id}
        ORDER BY o.created_at DESC
        LIMIT 10
      `,
      // Activities
      sql`
        SELECT 
          'login' as type,
          'Last Login' as label,
          COALESCE(TO_CHAR(last_login, 'YYYY-MM-DD HH24:MI'), 'Never') as value
        FROM users
        WHERE id = ${user.id}
      `
    ]);

    const balance = walletData[0]?.balance || 0;
    const statsRow = stats[0] || {};
    
    // Calculate percentage changes (mock for now - can be updated to calculate actual change from previous period)
    const statCards: StatCard[] = [
      {
        label: 'Total Orders',
        value: statsRow.total_orders || 0,
        percentageChange: -6.32,
        todayValue: statsRow.today_orders || 0,
      },
      {
        label: 'Total Sales',
        value: `GH₵ ${(statsRow.total_sales || 0).toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: 30.47,
        todayValue: `GH₵ ${(statsRow.today_sales || 0).toFixed(2)}`,
      },
      {
        label: 'Loyalty Incentive',
        value: `GH₵ ${(statsRow.loyalty_incentive || 0).toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: -8.55,
      },
      {
        label: 'Commission Income',
        value: `GH₵ ${(statsRow.total_commissions || 0).toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: 12.5,
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

    const networkSales = networkSalesData.map(row => ({
      network: row.network,
      sales: parseFloat(row.sales || 0),
      percentageChange: calculatePercentageChange(), // Helper function
    }));

    const recentTransactions = transactionsData.map(row => ({
      id: row.id,
      orderId: row.reference_id,
      amount: row.amount,
      package: row.package || 'Unknown',
      network: row.network || 'Unknown',
      status: row.status,
      createdAt: row.created_at,
    }));

    const activities: Activity[] = [
      { type: 'login', label: 'Last Login', value: 'Web', icon: 'flag' },
      { type: 'device', label: 'Device', value: 'Unknown', icon: 'smartphone' },
      { type: 'location', label: 'Location', value: 'Unknown', icon: 'map-pin' },
      { type: 'topup', label: 'Recent Topup', value: `GH₵ ${balance.toFixed(2)}`, icon: 'dollar-sign' },
      { type: 'commission', label: 'Recent Commission', value: `GH₵ ${(statsRow.total_commissions || 0).toFixed(2)}`, icon: 'briefcase' },
    ];

    return {
      wallet: {
        balance,
        percentageChange: 23.65,
        recentTopup: balance,
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

function calculatePercentageChange(): number {
  // Mock calculation - can be updated with actual logic
  return Math.random() > 0.5 ? 28 : -15;
}
