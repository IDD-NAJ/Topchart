"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { FundWalletModal } from "@/components/fund-wallet-modal"
import { PageHeader } from "@/components/dashboard/page-header"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Clock,
  CreditCard,
  Plus,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { formatCurrency } from "@/lib/networks"
import { cn } from "@/lib/utils"

interface WalletData {
  balance: number
  totalDeposited: number
  totalSpent: number
  pendingBalance: number
  recentTransactions: Array<{
    id: string
    type: "deposit" | "withdrawal" | "airtime" | "data"
    amount: number
    status: string
    description: string
    created_at: string
  }>
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((r) => r.json())
    .then((r) => {
      if (!r.success) throw new Error(r.error || "Failed to load wallet")
      return r.data as WalletData
    })

export default function WalletPage() {
  const [showFundModal, setShowFundModal] = useState(false)
  const { toast } = useToast()

  const { data: walletData, isLoading, isValidating, mutate, error } = useSWR<WalletData>(
    "/api/wallet",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      dedupingInterval: 8_000,
      onError: () => {
        toast({ title: "Connection issue", description: "Could not refresh wallet data.", variant: "destructive" })
      },
    }
  )

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success shrink-0"><ArrowDownRight className="h-4 w-4" /></div>
      case "withdrawal":
        return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><ArrowUpRight className="h-4 w-4" /></div>
      case "airtime":
        return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0"><CreditCard className="h-4 w-4" /></div>
      case "data":
        return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0"><Wallet className="h-4 w-4" /></div>
      default:
        return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0"><Clock className="h-4 w-4" /></div>
    }
  }

  const statCards = [
    {
      label: "Total Deposited",
      value: walletData?.totalDeposited ?? 0,
      icon: ArrowDownRight,
      iconClass: "text-success",
      note: "Lifetime deposits",
    },
    {
      label: "Total Spent",
      value: walletData?.totalSpent ?? 0,
      icon: ArrowUpRight,
      iconClass: "text-destructive",
      note: "Lifetime spending",
    },
    {
      label: "Net Position",
      value: (walletData?.totalDeposited ?? 0) - (walletData?.totalSpent ?? 0),
      icon: TrendingUp,
      iconClass: "text-primary",
      note: "Current balance",
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="My Wallet"
        description="Manage your balance and view transaction history"
        backHref="/dashboard"
        actions={
          <Button size="sm" className="gap-2 h-9" onClick={() => setShowFundModal(true)}>
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
        }
      />

      {/* Balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="h-0.5 w-full bg-primary" />
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Available Balance
            </p>
            {isLoading ? (
              <div className="h-10 w-44 skeleton mb-2" />
            ) : (
              <p className="text-4xl font-bold tracking-tight text-foreground">
                {formatCurrency(walletData?.balance ?? 0)}
              </p>
            )}
            {walletData && (walletData.pendingBalance ?? 0) > 0 && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Pending: {formatCurrency(walletData.pendingBalance)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure
            </div>
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1.5 hover:bg-muted disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statCards.map(({ label, value, icon: Icon, iconClass, note }, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <Icon className={cn("h-4 w-4", iconClass)} />
            </div>
            {isLoading ? (
              <div className="h-7 w-32 skeleton" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatCurrency(value)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
          </div>
        ))}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your latest wallet activity</p>
          </div>
          <Link href="/dashboard/history" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-muted rounded" />
                    <div className="h-2.5 w-20 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : !walletData?.recentTransactions?.length ? (
            <div className="text-center py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No transactions yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
                Add funds to your wallet to start purchasing data bundles and services.
              </p>
              <Button size="sm" onClick={() => setShowFundModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Funds
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {walletData.recentTransactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-lg p-3 hover:bg-muted/40 transition-colors"
                >
                  {getTransactionIcon(tx.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-GH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        tx.type === "deposit" ? "text-success" : "text-foreground"
                      )}
                    >
                      {tx.type === "deposit" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-medium",
                        tx.status.toLowerCase() === "success" ? "text-success"
                          : tx.status.toLowerCase() === "pending" ? "text-warning"
                            : "text-destructive"
                      )}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <FundWalletModal
        open={showFundModal}
        onOpenChange={(open) => {
          setShowFundModal(open)
          if (!open) mutate()
        }}
      />
    </div>
  )
}
