"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart3, TrendingUp, Users, DollarSign, ShoppingCart,
  MapPin, RefreshCw, AlertTriangle, Activity, ArrowUpRight,
  ArrowDownRight, Calendar
} from "lucide-react";

interface DayStats {
  date: string;
  count: number;
  total: number;
}

interface Stats {
  totalResellers: number;
  activeResellers: number;
  totalSales: number;
  totalCommissions: number;
  totalReferrals: number;
  fraudAlerts: number;
  totalTransactions?: number;
  totalRevenue?: number;
  pendingTransactions?: number;
}

interface TopReseller {
  id: string;
  business_name: string;
  user_email: string;
  total_sales: number;
  total_referrals: number;
  status: string;
}

interface RegionData {
  region: string;
  total_sales: number;
  sales_count: number;
}

function MiniBarChart({ data }: { data: DayStats[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No transaction data for the last 30 days
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-40 w-full">
        {data.map((d, i) => {
          const height = Math.max((d.total / maxVal) * 100, 2);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md pointer-events-none">
                <div className="font-medium">GHS {Number(d.total).toFixed(2)}</div>
                <div className="text-muted-foreground">{d.count} txns</div>
                <div className="text-muted-foreground">{new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              </div>
              <div
                className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{data.length > 0 ? new Date(data[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>
        <span>Last 30 days</span>
        <span>{data.length > 0 ? new Date(data[data.length - 1].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  color = "default",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "green" | "red" | "amber";
}) {
  const colorMap = {
    default: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalResellers: 0,
    activeResellers: 0,
    totalSales: 0,
    totalCommissions: 0,
    totalReferrals: 0,
    fraudAlerts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
  });
  const [topResellers, setTopResellers] = useState<TopReseller[]>([]);
  const [salesByRegion, setSalesByRegion] = useState<RegionData[]>([]);
  const [salesByDay, setSalesByDay] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "include", cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setTopResellers(data.topResellers || []);
        setSalesByRegion(data.salesByRegion || []);
        setSalesByDay(data.salesByDay || []);
        setLastRefreshed(new Date());
      } else {
        toast.error(data.error || "Failed to load analytics");
      }
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalRevenue30d = salesByDay.reduce((acc, d) => acc + Number(d.total), 0);
  const totalTxns30d = salesByDay.reduce((acc, d) => acc + d.count, 0);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 bg-muted rounded w-56 animate-pulse" />
            <div className="h-4 bg-muted rounded w-80 mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20 mt-1" />
                <div className="h-3 bg-muted rounded w-28 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Platform-wide performance metrics
            {lastRefreshed && (
              <span className="ml-2 text-xs">
                · Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Resellers"
          value={stats.totalResellers.toLocaleString()}
          sub={`${stats.activeResellers} active`}
          icon={Users}
          color="default"
        />
        <StatCard
          title="Total Sales Revenue"
          value={`GHS ${Number(stats.totalSales).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="All-time reseller sales"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Commissions Paid"
          value={`GHS ${Number(stats.totalCommissions).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="To resellers"
          icon={TrendingUp}
          color="default"
        />
        <StatCard
          title="Total Referrals"
          value={stats.totalReferrals.toLocaleString()}
          sub="All referred users"
          icon={ShoppingCart}
          color="default"
        />
        <StatCard
          title="Revenue (30d)"
          value={`GHS ${totalRevenue30d.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${totalTxns30d.toLocaleString()} transactions`}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Fraud Alerts"
          value={stats.fraudAlerts.toLocaleString()}
          sub="Open alerts"
          icon={AlertTriangle}
          color={stats.fraudAlerts > 0 ? "red" : "default"}
        />
      </div>

      {/* 30-Day Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction Volume — Last 30 Days
              </CardTitle>
              <CardDescription>Daily revenue and transaction count</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                GHS {totalRevenue30d.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">{totalTxns30d} transactions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MiniBarChart data={salesByDay} />
        </CardContent>
      </Card>

      {/* Top Resellers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Performing Resellers
          </CardTitle>
          <CardDescription>Highest sales and commission earners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topResellers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No reseller data available
              </p>
            ) : (
              topResellers.map((reseller, index) => (
                <div
                  key={reseller.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-600"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{reseller.business_name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{reseller.user_email}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-bold">
                        GHS {Number(reseller.total_sales || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">{reseller.total_referrals} referrals</p>
                    </div>
                    <Badge variant={reseller.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {reseller.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Sales by Region
          </CardTitle>
          <CardDescription>Geographic distribution of reseller sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {salesByRegion.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No geographic data available
              </p>
            ) : (
              salesByRegion.map((region: RegionData) => {
                const maxSales = Math.max(...salesByRegion.map((r) => Number(r.total_sales)));
                const pct = maxSales > 0 ? (Number(region.total_sales) / maxSales) * 100 : 0;
                return (
                  <div key={region.region} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{region.region || "Unknown"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">
                          GHS {Number(region.total_sales || 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">{region.sales_count} sales</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
