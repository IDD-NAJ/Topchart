'use client';

import { NetworkSales } from '@/lib/actions/dashboard';

interface NetworkGaugeProps {
  network: NetworkSales;
  percentage: number;
}

export function NetworkGauge({ network, percentage }: NetworkGaugeProps) {
  const isPositive = network.percentageChange >= 0;
  const gaugeColor = network.network.includes('AT') ? 'from-blue-400 to-blue-600' 
    : network.network.includes('MTN') ? 'from-yellow-400 to-yellow-600'
    : network.network.includes('Telecel') ? 'from-red-400 to-red-600'
    : 'from-blue-400 to-indigo-600';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600 text-sm mb-1">Today {network.network} Sales</p>
          <p className="text-gray-500 text-xs">GH₵ 0 sales made</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-medium ${isPositive ? 'bg-orange-50 text-orange-600' : 'bg-orange-50 text-orange-600'}`}>
          {isPositive ? '+' : ''}{network.percentageChange}% more
        </span>
      </div>

      {/* Circular Gauge */}
      <div className="flex flex-col items-center justify-center py-8">
        <svg width="120" height="120" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={gaugeColor === 'from-blue-400 to-blue-600' ? '#2563eb' 
              : gaugeColor === 'from-yellow-400 to-yellow-600' ? '#eab308'
              : gaugeColor === 'from-red-400 to-red-600' ? '#dc2626'
              : '#3b82f6'}
            strokeWidth="8"
            strokeDasharray={`${(percentage / 100) * 314} 314`}
            strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx="60" cy="60" r="8" fill={
            gaugeColor === 'from-blue-400 to-blue-600' ? '#2563eb' 
              : gaugeColor === 'from-yellow-400 to-yellow-600' ? '#eab308'
              : gaugeColor === 'from-red-400 to-red-600' ? '#dc2626'
              : '#3b82f6'
          } />
        </svg>
        
        {/* Percentage text */}
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold text-gray-900">0%</span>
          <span className="text-xs text-gray-500">of target</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 text-balance">from last week</p>
    </div>
  );
}
