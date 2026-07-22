import { StatCard as StatCardType } from '@/lib/actions/dashboard';

interface StatCardProps {
  stat: StatCardType;
}

export function StatCard({ stat }: StatCardProps) {
  const isPositive = stat.percentageChange >= 0;
  const icon = stat.label.includes('Orders') ? '⏱️' : stat.label.includes('Sales') ? '📊' : stat.label.includes('Loyalty') ? '🎁' : '💰';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <span className={`px-3 py-1 rounded text-sm font-medium ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isPositive ? '+' : ''}{stat.percentageChange.toFixed(2)}%
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
      {stat.todayValue !== undefined && (
        <p className="text-gray-500 text-sm">Today: {stat.todayValue}</p>
      )}
    </div>
  );
}
