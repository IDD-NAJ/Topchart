'use client';

import { useEffect, useState } from 'react';
import { getDashboardData, DashboardData } from '@/lib/actions/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { NetworkGauge } from '@/components/dashboard/network-gauge';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { MonthlyChart, WeeklyChart } from '@/components/dashboard/charts';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Your insight, {user?.firstName || 'User'}!
          </h1>
        </div>

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm mb-2">Available Balance</p>
              <h2 className="text-5xl font-bold mb-2">GH₵ {data.wallet.balance.toFixed(2)}</h2>
              <p className="text-indigo-200 text-sm">Recent topup: GH₵ {data.wallet.recentTopup.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-green-300 font-semibold">+ {data.wallet.percentageChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyChart data={data.monthlyChart} />
          <WeeklyChart data={data.weeklyChart} />
        </div>

        {/* Network Sales Gauges */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today Sales by Network</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.networkSales.map((network, idx) => (
              <NetworkGauge
                key={idx}
                network={network}
                percentage={Math.floor(Math.random() * 100)}
              />
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities</h3>
          <div className="space-y-3">
            {data.activities.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.label}</p>
                    <p className="text-sm text-gray-600">{activity.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <TransactionsTable transactions={data.recentTransactions} />
        </div>
      </div>
    </main>
  );
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'login':
      return '🚩';
    case 'device':
      return '📱';
    case 'location':
      return '📍';
    case 'topup':
      return '💵';
    case 'commission':
      return '💼';
    default:
      return '📌';
  }
}
