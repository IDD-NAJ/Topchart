"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, MapPin, Calendar } from "lucide-react";

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
              className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006994]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">Track your sales, commissions, and performance metrics</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {summary.totalSales.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {trends.salesGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+{trends.salesGrowth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">{trends.salesGrowth}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {summary.totalCommission.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {trends.commissionGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+{trends.commissionGrowth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">{trends.commissionGrowth}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Total referred users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {summary.avgDailySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per day average</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sales Trend (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart data={dailyStats} valueKey="sales_amount" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{cat.category}</Badge>
                    <span className="text-sm text-muted-foreground">{cat.count} sales</span>
                  </div>
                  <span className="font-semibold">GHS {parseFloat(cat.total as any).toFixed(2)}</span>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoStats.slice(0, 5).map((geo) => (
                <div key={`${geo.region}-${geo.city}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{geo.city || geo.region}</p>
                      <p className="text-xs text-muted-foreground">{geo.sales_count} sales</p>
                    </div>
                  </div>
                  <span className="font-semibold">GHS {parseFloat(geo.sales_amount as any).toFixed(2)}</span>
                </div>
              ))}
              {geoStats.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No geographic data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Stats Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>Detailed breakdown of your daily sales and commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Sales</th>
                  <th className="text-left p-3 text-sm font-medium">Amount</th>
                  <th className="text-left p-3 text-sm font-medium">Commission</th>
                  <th className="text-left p-3 text-sm font-medium">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.slice(-10).reverse().map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">{day.sales_count}</td>
                    <td className="p-3 text-sm">GHS {parseFloat(day.sales_amount as any).toFixed(2)}</td>
                    <td className="p-3 text-sm">GHS {parseFloat(day.commission_earned as any).toFixed(2)}</td>
                    <td className="p-3 text-sm">{day.new_referrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Commission History */}
      {commissionHistory.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>Recent commissions earned from referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">Referred User</th>
                    <th className="text-left p-3 text-sm font-medium">Transaction</th>
                    <th className="text-left p-3 text-sm font-medium">Amount</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionHistory.map((commission) => (
                    <tr key={commission.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{new Date(commission.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-sm">{commission.first_name} {commission.last_name}</td>
                      <td className="p-3 text-sm">GHS {parseFloat(commission.transaction_amount || 0).toFixed(2)}</td>
                      <td className="p-3 text-sm font-medium">GHS {parseFloat(commission.commission_amount || 0).toFixed(2)}</td>
                      <td className="p-3 text-sm">
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
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
