"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, MapPin, Calendar, Loader2 } from "lucide-react";

interface DailyStat {
  date: string;
  sales_count: number;
  sales_amount: number;
  commission_earned: number;
  new_referrals: number;
}

interface GeoStat {
  region: string;
  city: string;
  sales_count: number;
  sales_amount: number;
}

interface CategoryStat {
  category: string;
  count: number;
  total: number;
}

export default function ResellerAnalyticsPage() {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalCommission: 0,
    totalReferrals: 0,
    avgDailySales: 0,
    totalProfit: 0,
    transactionCount: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [trends, setTrends] = useState({
    salesGrowth: 0,
    commissionGrowth: 0
  });
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData(period);
  }, [period]);

  const loadAnalyticsData = async (selectedPeriod: string = "30d") => {
    try {
      const res = await fetch(`/api/reseller/analytics?period=${selectedPeriod}`, {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setDailyStats(data.dailyStats);
        setGeoStats(data.geographicStats);
        setCategoryStats(data.salesByCategory);
        setTrends(data.trends);
        setCommissionHistory(data.commissionHistory || []);
      }
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Simple bar chart component
  const MiniBarChart = ({ data, valueKey }: { data: any[], valueKey: string }) => {
    const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0));
    return (
      <div className="flex items-end gap-1 h-24">
        {data.slice(-14).map((d, i) => {
          const value = parseFloat(d[valueKey]) || 0;
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 bg-slate-300 hover:bg-slate-400 transition-colors rounded-t"
              style={{ height: `${height}%` }}
              title={`${d.date || d.category}: ${value}`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Advanced Analytics</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Track your sales, commissions, and performance metrics</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                className={period === p ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">GHS {Number(summary.totalSales || 0).toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {trends.salesGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">+{trends.salesGrowth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-700">{trends.salesGrowth}%</span>
                </>
              )}
              <span className="text-slate-500">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Commission Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">GHS {summary.totalCommission.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {trends.commissionGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">+{trends.commissionGrowth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-700">{trends.commissionGrowth}%</span>
                </>
              )}
              <span className="text-slate-500">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">New Referrals</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalReferrals}</div>
            <p className="text-xs text-slate-500">Total referred users</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Avg Daily Sales</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">GHS {summary.avgDailySales.toFixed(2)}</div>
            <p className="text-xs text-slate-500">Per day average</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card className="border-slate-200 mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <div className="p-2 bg-slate-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-slate-600" />
            </div>
            Sales Trend (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart data={dailyStats} valueKey="sales_amount" />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Sales by Category */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-slate-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-slate-600" />
              </div>
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">{cat.category}</Badge>
                    <span className="text-sm text-slate-600">{cat.count} sales</span>
                  </div>
                  <span className="font-semibold text-slate-900">GHS {parseFloat(cat.total as any).toFixed(2)}</span>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center text-slate-500 py-4">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-slate-100 rounded-lg">
                <MapPin className="h-5 w-5 text-slate-600" />
              </div>
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoStats.slice(0, 5).map((geo) => (
                <div key={`${geo.region}-${geo.city}`} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">{geo.city || geo.region}</p>
                      <p className="text-xs text-slate-600">{geo.sales_count} sales</p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900">GHS {parseFloat(geo.sales_amount as any).toFixed(2)}</span>
                </div>
              ))}
              {geoStats.length === 0 && (
                <p className="text-center text-slate-500 py-4">No geographic data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Stats Table */}
      <Card className="border-slate-200 mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle className="text-slate-900">Daily Performance</CardTitle>
          <CardDescription className="text-slate-500">Detailed breakdown of your daily sales and commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Sales</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Amount</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Commission</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.slice(-10).reverse().map((day) => (
                  <tr key={day.date} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-sm text-slate-900">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm text-slate-600">{day.sales_count}</td>
                    <td className="p-3 text-sm text-slate-600">GHS {parseFloat(day.sales_amount as any).toFixed(2)}</td>
                    <td className="p-3 text-sm text-slate-600">GHS {parseFloat(day.commission_earned as any).toFixed(2)}</td>
                    <td className="p-3 text-sm text-slate-600">{day.new_referrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Commission History */}
      {commissionHistory.length > 0 && (
        <Card className="border-slate-200 mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-slate-900">Commission History</CardTitle>
            <CardDescription className="text-slate-500">Recent commissions earned from referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Referred User</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Transaction</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Amount</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionHistory.map((commission) => (
                    <tr key={commission.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-900">{new Date(commission.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-sm text-slate-600">{commission.first_name} {commission.last_name}</td>
                      <td className="p-3 text-sm text-slate-600">GHS {parseFloat(commission.transaction_amount || 0).toFixed(2)}</td>
                      <td className="p-3 text-sm font-medium text-slate-900">GHS {parseFloat(commission.commission_amount || 0).toFixed(2)}</td>
                      <td className="p-3 text-sm">
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'} className={commission.status === 'paid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}>
                          {commission.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
