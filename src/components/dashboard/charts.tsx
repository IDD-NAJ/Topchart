'use client';

import { ChartDataPoint } from '@/lib/actions/dashboard';

interface MonthlyChartProps {
  data: ChartDataPoint[];
}

interface WeeklyChartProps {
  data: ChartDataPoint[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-center h-80">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = months.map(month => data.find(d => d.month === month) || { month, value: 0 });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Monthly breakdown</h3>
        <button className="text-gray-400 hover:text-gray-600">⋮</button>
      </div>
      
      <div className="flex items-end justify-between h-64 gap-2">
        {chartData.map((point, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded" style={{ height: `${(point.value / maxValue) * 200}px` }} />
            <span className="text-xs text-gray-600">{point.month}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-600">
        <span>0</span>
        <span>{maxValue.toFixed(0)}</span>
      </div>
    </div>
  );
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-center h-80">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Weekly sales overview</h3>
        <button className="text-gray-400 hover:text-gray-600">≡</button>
      </div>
      
      <div className="flex items-end justify-between h-64 gap-2">
        {days.map((day, idx) => {
          const point = data.find(d => d.day?.includes(day)) || { day, value: 0 };
          return (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full border-4 border-indigo-600 rounded" style={{ height: `${(point.value / maxValue) * 200}px` }} />
              <span className="text-xs text-gray-600">{day}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-600">
        <span>0</span>
        <span>{maxValue.toFixed(0)}</span>
      </div>
    </div>
  );
}
