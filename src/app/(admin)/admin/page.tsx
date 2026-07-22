"use client"

import React from "react"
import Link from "next/link"
import useSWR from "swr"
import { adminFetcher, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  ArrowLeftRight,
  AlertCircle,
  TrendingUp,
  Settings,
  Wallet,
  UserPlus,
  Ticket,
  RefreshCw,
  ArrowRight,
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalRevenue: number
  recentSignups: number
  openTickets: number
  totalReferrals: number
  totalDataPurchases: number
  totalWalletBalance: number
  openDisputes: number
  recentTransactions: any[]
  recentTickets: any[]
  transactionsByType: { type: string; count: number; total: number }[]
  transactionsByDay: { date: string; count: number; total: number }[]
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toUpperCase()
  if (s === "SUCCESS" || s === "COMPLETED") return "default"
  if (s === "PENDING" || s === "PROCESSING") return "secondary"
  if (s === "FAILED" || s === "CANCELLED") return "destructive"
  return "outline"
}

export default function AdminDashboardPage() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; stats: AdminStats }>(
    "/api/admin/stats",
    adminFetcher,
    { refreshInterval: 60_000 }
  )

  const stats = data?.stats

  const statCards = [
    {
      label: "Total Users",
      value: stats ? stats.totalUsers.toLocaleString() : null,
      sub: stats ? `${stats.recentSignups} new this week` : null,
      icon: Users,
    },
    {
      label: "Active Users",
      value: stats ? stats.activeUsers.toLocaleString() : null,
      sub: "Active sessions",
      icon: UserPlus,
    },
    {
      label: "Transactions",
      value: stats ? stats.totalTransactions.toLocaleString() : null,
      sub: stats ? `${stats.totalDataPurchases} data purchases` : null,
      icon: ArrowLeftRight,
    },
    {
      label: "Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : null,
      sub: stats ? `Wallets: ${formatCurrency(stats.totalWalletBalance)}` : null,
      icon: Wallet,
    },
  ]

  const quickLinks = [
    {
      href: "/admin/users",
      icon: Users,
      title: "User Management",
      description: "Manage users, roles, verification and wallet balances",
      badge: stats ? `${stats.totalUsers} users` : undefined,
    },
    {
      href: "/admin/transactions",
      icon: ArrowLeftRight,
      title: "Transactions",
      description: "Review, filter and export all platform transactions",
      badge: stats ? `${stats.totalTransactions} total` : undefined,
    },
    {
      href: "/admin/disputes",
      icon: AlertCircle,
      title: "Disputes",
      description: "Resolve open disputes and payment issues",
      badge: stats && stats.openDisputes > 0 ? `${stats.openDisputes} open` : undefined,
      badgeDestructive: stats ? stats.openDisputes > 0 : false,
    },
    {
      href: "/admin/analytics",
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Revenue trends, reseller performance and growth",
    },
    {
      href: "/admin/settings",
      icon: Settings,
      title: "System Settings",
      description: "Service status, maintenance mode and audit logs",
    },
    {
      href: "/admin/disputes",
      icon: Ticket,
      title: "Support Tickets",
      description: "Open support tickets awaiting response",
      badge: stats && stats.openTickets > 0 ? `${stats.openTickets} open` : undefined,
      badgeDestructive: stats ? stats.openTickets > 0 : false,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview and quick actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">Failed to load stats: {error.message}</p>
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
                  <>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="mt-2 h-4 w-32" />
                  </>
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

      {/* Quick links */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">Admin Sections</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link, i) => {
          const Icon = link.icon
          return (
            <Link key={`${link.href}-${i}`} href={link.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {link.badge && (
                      <Badge variant={link.badgeDestructive ? "destructive" : "secondary"}>{link.badge}</Badge>
                    )}
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {link.title}
                    <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="text-sm">{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/transactions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isLoading && (!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet</p>
            )}
            {stats?.recentTransactions?.slice(0, 6).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {tx.email || tx.reference || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {String(tx.type || "").toUpperCase()} · {formatDateTime(tx.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(tx.amount))}</span>
                  <Badge variant={statusVariant(String(tx.status || ""))} className="text-xs">
                    {String(tx.status || "").toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transactions by Type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {!isLoading && (!stats?.transactionsByType || stats.transactionsByType.length === 0) && (
              <p className="py-4 text-center text-sm text-muted-foreground">No successful transactions yet</p>
            )}
            {stats?.transactionsByType?.map((row) => (
              <div key={row.type} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">{row.type || "other"}</p>
                  <p className="text-xs text-muted-foreground">{row.count} transactions</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(row.total))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
