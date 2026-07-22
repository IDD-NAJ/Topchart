"use client"

import React from "react"
import useSWR from "swr"
import { adminFetcher, formatCurrency, formatDate } from "@/lib/admin-fetcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { RefreshCw, TrendingUp, Users, Wallet, AlertTriangle } from "lucide-react"

interface AnalyticsResponse {
  success: boolean
  stats: {
    totalResellers: number
    activeResellers: number
    totalSales: number
    totalCommissions: number
    totalReferrals: number
    fraudAlerts: number
    totalTransactions: number
    totalRevenue: number
    pendingTransactions: number
  }
  topResellers: {
    id: string
    business_name: string
    reseller_code: string
    total_sales: number
    total_commission_earned: number
    status: string
    user_email: string
    total_referrals: number
  }[]
  salesByDay: { date: string; count: number; total: number }[]
  salesByRegion: { region: string; total_sales: number; sales_count: number }[]
}

const chartConfig = {
  total: { label: "Revenue (GHS)", color: "var(--chart-1)" },
  count: { label: "Transactions", color: "var(--chart-2)" },
  total_sales: { label: "Sales (GHS)", color: "var(--chart-1)" },
}

export default function AdminAnalyticsPage() {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsResponse>("/api/admin/analytics", adminFetcher)

  const stats = data?.stats
  const salesByDay = (data?.salesByDay || []).map((d) => ({
    ...d,
    total: Number(d.total),
    count: Number(d.count),
    label: formatDate(String(d.date)),
  }))
  const salesByRegion = (data?.salesByRegion || []).map((d) => ({
    ...d,
    total_sales: Number(d.total_sales),
  }))

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : null,
      sub: stats ? `${stats.totalTransactions.toLocaleString()} transactions` : null,
      icon: Wallet,
    },
    {
      label: "Pending Transactions",
      value: stats ? stats.pendingTransactions.toLocaleString() : null,
      sub: "Awaiting completion",
      icon: TrendingUp,
    },
    {
      label: "Resellers",
      value: stats ? stats.totalResellers.toLocaleString() : null,
      sub: stats ? `${stats.activeResellers} active` : null,
      icon: Users,
    },
    {
      label: "Fraud Alerts",
      value: stats ? stats.fraudAlerts.toLocaleString() : null,
      sub: "Open alerts",
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue trends and performance over the last 30 days</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">Failed to load analytics: {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {card.value === null ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    {card.sub && <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : salesByDay.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No transaction data yet</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={salesByDay} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={11} width={56} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="total"
                    type="monotone"
                    fill="var(--color-total)"
                    fillOpacity={0.2}
                    stroke="var(--color-total)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Volume (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : salesByDay.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No transaction data yet</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={salesByDay} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={11} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top resellers + regions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Resellers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isLoading && (!data?.topResellers || data.topResellers.length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">No reseller data yet</p>
            )}
            {data?.topResellers?.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.business_name || r.user_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.reseller_code} · {r.total_referrals} referrals
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold">{formatCurrency(Number(r.total_sales))}</span>
                  <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-xs">
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Region</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : salesByRegion.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No regional sales data yet</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={salesByRegion} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="region"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_sales" fill="var(--color-total_sales)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
