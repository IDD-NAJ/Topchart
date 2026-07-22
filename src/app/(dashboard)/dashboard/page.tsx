"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useForeignNumbers } from "@/hooks/use-foreign-numbers";
import { StatCard } from "@/components/dashboard/stat-card";
import { VerificationCard } from "@/components/dashboard/verification-card";
import { NetworkGauge } from "@/components/dashboard/network-gauge";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { ForeignNumbersSection } from "@/components/dashboard/foreign-numbers-section";
import { MonthlyChart, WeeklyChart } from "@/components/dashboard/charts";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { FundWalletModal } from "@/components/fund-wallet-modal";
import { useState } from "react";
import {
  Wifi,
  Receipt,
  CreditCard,
  History,
  Plus,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/networks";

const LOW_BALANCE_THRESHOLD = 5;

function BalanceSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
      <div className="h-3 w-28 bg-muted rounded mb-5" />
      <div className="h-9 w-48 bg-muted rounded mb-3" />
      <div className="h-3 w-36 bg-muted rounded" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="h-9 w-9 bg-muted rounded-lg" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
          <div className="h-3 w-20 bg-muted rounded mb-2" />
          <div className="h-6 w-28 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isValidating, mutate } = useDashboardData();
  const { data: foreignData, isLoading: foreignLoading } = useForeignNumbers();
  const [showFundModal, setShowFundModal] = useState(false);

  const isLowBalance = data && data.wallet.balance < LOW_BALANCE_THRESHOLD;

  const quickActions = [
    { href: "/dashboard/data", label: "Buy Data", icon: Wifi, description: "MTN · Telecel · AT" },
    { href: "/dashboard/buy-number", label: "Buy Number", icon: Phone, description: "Virtual numbers" },
    { href: "/dashboard/bills", label: "Pay Bills", icon: Receipt, description: "Electricity & more" },
    { href: "/dashboard/wallet", label: "My Wallet", icon: CreditCard, description: `GH₵ ${(data?.wallet?.balance ?? 0).toFixed(2)}` },
    { href: "/dashboard/history", label: "History", icon: History, description: "All transactions" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {greeting()}, {user?.firstName ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-GH", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-muted disabled:opacity-40"
          title="Refresh data"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </motion.div>

      {/* Low-balance alert */}
      {isLowBalance && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Low balance —{" "}
              <span className="text-warning font-bold">GH₵ {data.wallet.balance.toFixed(2)}</span> remaining. Top up to keep purchasing.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowFundModal(true)}
            className="shrink-0 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Fund
          </Button>
        </motion.div>
      )}

      {/* Balance hero card */}
      {isLoading && !data ? (
        <BalanceSkeleton />
      ) : (
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
              <p className="text-4xl font-bold tracking-tight text-foreground">
                {formatCurrency(data?.wallet?.balance ?? 0)}
              </p>
              {(data?.wallet?.recentTopup ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last top-up:{" "}
                  <span className="font-medium text-success">
                    +{formatCurrency(data?.wallet?.recentTopup ?? 0)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(data?.wallet?.percentageChange ?? 0) !== 0 && (
                <div
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold",
                    (data?.wallet?.percentageChange ?? 0) >= 0
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {(data?.wallet?.percentageChange ?? 0) >= 0 ? "+" : ""}
                  {(data?.wallet?.percentageChange ?? 0).toFixed(1)}% this month
                </div>
              )}
              <Button
                onClick={() => setShowFundModal(true)}
                className="gap-2 h-10"
              >
                <Plus className="h-4 w-4" />
                Fund Wallet
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      >
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary text-muted-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* Stats grid with verification number */}
      {isLoading && !data ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} index={idx} />
          ))}
          <VerificationCard 
            verificationNumber={user?.id ?? "—"} 
            index={data?.stats?.length ?? 4}
          />
        </div>
      )}

      {/* Charts */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <MonthlyChart data={data.monthlyChart} />
          <WeeklyChart data={data.weeklyChart} />
        </motion.div>
      )}

      {/* Network sales */}
      {data && data.networkSales.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Today&apos;s Network Sales</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {data.networkSales.map((network, idx) => (
              <NetworkGauge key={idx} network={network} index={idx} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Foreign Numbers Section */}
      <ForeignNumbersSection
        numbers={foreignData?.numbers ?? []}
        isLoading={foreignLoading}
        activeCount={foreignData?.activeCount ?? 0}
        totalCount={foreignData?.totalCount ?? 0}
      />

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {isLoading && !data ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading transactions...</p>
          </div>
        ) : (
          <TransactionsTable transactions={data?.recentTransactions ?? []} />
        )}
      </motion.div>

      <FundWalletModal
        open={showFundModal}
        onOpenChange={(open) => {
          setShowFundModal(open);
          if (!open) mutate();
        }}
      />
    </div>
  );
}
