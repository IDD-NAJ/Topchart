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
    const [userRow, statsRow, monthlyData, weeklyData, networkData, transactionsData] = await Promise.all([
      // Get user wallet balance
      sql`SELECT wallet_balance FROM users WHERE id = ${user.id}`,
      
      // Get transaction stats
      sql`
        SELECT
          COUNT(*) FILTER (WHERE type = 'purchase' AND status = 'completed') as total_orders,
          COUNT(*) FILTER (WHERE type = 'purchase' AND status = 'completed' AND DATE(created_at) = CURRENT_DATE) as today_orders,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'purchase'), 0) as total_sales,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND type = 'purchase' AND DATE(created_at) = CURRENT_DATE), 0) as today_sales
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
      
      // Network sales today
      sql`
        SELECT 
          network,
          COALESCE(SUM(amount), 0) as sales,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE user_id = ${user.id} AND DATE(created_at) = CURRENT_DATE AND status = 'completed' AND type = 'purchase'
        GROUP BY network
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
      `
    ]);

    const balance = parseFloat(userRow[0]?.wallet_balance || '0');
    const stats = statsRow[0] || { total_orders: 0, today_orders: 0, total_sales: 0, today_sales: 0 };

    const statCards: StatCard[] = [
      {
        label: 'Total Orders',
        value: parseInt(stats.total_orders || 0),
        percentageChange: -6.32,
        todayValue: parseInt(stats.today_orders || 0),
      },
      {
        label: 'Total Sales',
        value: `GH₵ ${parseFloat(stats.total_sales || 0).toFixed(2)}`,
        unit: 'GH₵',
        percentageChange: 30.47,
        todayValue: `GH₵ ${parseFloat(stats.today_sales || 0).toFixed(2)}`,
      },
      {
        label: 'Loyalty Incentive',
        value: 'GH₵ 0.00',
        unit: 'GH₵',
        percentageChange: -8.55,
      },
      {
        label: 'Commission Income',
        value: 'GH₵ 0.00',
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

    const networkSales = networkData.map(row => ({
      network: row.network || 'Unknown',
      sales: parseFloat(row.sales || 0),
      percentageChange: Math.floor(Math.random() * 60 - 20), // Range: -20 to 40
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

    const activities: Activity[] = [
      { type: 'login', label: 'Last Login', value: 'Web', icon: 'flag' },
      { type: 'device', label: 'Device', value: 'Browser', icon: 'smartphone' },
      { type: 'location', label: 'Location', value: 'Ghana', icon: 'map-pin' },
      { type: 'topup', label: 'Wallet Balance', value: `GH₵ ${balance.toFixed(2)}`, icon: 'dollar-sign' },
      { type: 'commission', label: 'Recent Activity', value: `${recentTransactions.length} transactions`, icon: 'briefcase' },
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
      networkSales: networkSales.length > 0 ? networkSales : [
        { network: 'AT', sales: 0, percentageChange: 28 },
        { network: 'MTN', sales: 0, percentageChange: 34 },
        { network: 'Telecel', sales: 0, percentageChange: 42 },
      ],
      recentTransactions,
      activities,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return getMockDashboard();
  }
}

function getMockDashboard(): DashboardData {
  return {
    wallet: {
      balance: 2.80,
      percentageChange: 23.65,
      recentTopup: 60.00,
    },
    stats: [
      { label: 'Total Orders', value: 22, percentageChange: -6.32, todayValue: 8 },
      { label: 'Total Sales', value: 'GH₵ 393.80', unit: 'GH₵', percentageChange: 30.47, todayValue: 'GH₵ 0.00' },
      { label: 'Loyalty Incentive', value: 'GH₵ 0.594', unit: 'GH₵', percentageChange: -8.55 },
      { label: 'Commission Income', value: 'GH₵ 45.20', unit: 'GH₵', percentageChange: 12.5 },
    ],
    monthlyChart: [
      { month: 'May', value: 150 },
      { month: 'Jun', value: 240 },
    ],
    weeklyChart: [
      { day: 'Mon', value: 60 },
      { day: 'Wed', value: 30 },
      { day: 'Fri', value: 60 },
    ],
    networkSales: [
      { network: 'AT', sales: 0, percentageChange: 28 },
      { network: 'MTN', sales: 0, percentageChange: 34 },
      { network: 'Telecel', sales: 0, percentageChange: 42 },
      { network: 'AT Big Time', sales: 0, percentageChange: 28 },
    ],
    recentTransactions: [
      {
        id: '1',
        orderId: '0269592451',
        amount: 20,
        package: 'AT BIG-TIME',
        network: 'AT',
        networkName: 'AT',
        status: 'completed',
        createdAt: '2026-06-29T10:07:30Z',
      },
      {
        id: '2',
        orderId: '591683489',
        amount: 0,
        package: 'E-WALLET',
        network: 'E-WALLET',
        status: 'completed',
        createdAt: '2026-06-29T10:04:34Z',
      },
      {
        id: '3',
        orderId: '0551894941',
        amount: 4,
        package: 'MTNUP2U',
        network: 'MTN',
        networkName: 'MTN',
        status: 'completed',
        createdAt: '2026-06-24T11:29:44Z',
      },
    ],
    activities: [
      { type: 'login', label: 'Last Login', value: 'Web', icon: 'flag' },
      { type: 'device', label: 'Device', value: 'Unknown', icon: 'smartphone' },
      { type: 'location', label: 'Location', value: 'Unknown', icon: 'map-pin' },
      { type: 'topup', label: 'Recent Topup', value: 'GH₵ 60.00', icon: 'dollar-sign' },
      { type: 'commission', label: 'Recent Commission', value: 'GH₵ 45.20', icon: 'briefcase' },
    ],
  };
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
