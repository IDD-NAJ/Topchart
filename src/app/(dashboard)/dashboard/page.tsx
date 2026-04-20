"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import { copyToClipboard } from "@/lib/clipboard"
import { toast } from "sonner"
import { WalletCard } from "@/components/wallet-card"
import { FundWalletModal } from "@/components/fund-wallet-modal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Phone,
  Wifi,
  Shield,
  PhoneCall,
  ArrowDownRight,
  Clock,
  Loader2,
  TrendingUp,
  PiggyBank,
  Users,
  Copy,
  ShieldCheck,
  Gift,
  Link as LinkIcon,
  Share2,
  ChevronRight,
  ArrowUpRight,
  Zap,
  History,
  Activity,
  CreditCard,
  Target,
  RefreshCw,
  AlertCircle,
  Inbox,
  GraduationCap,
  Store,
  ChevronDown,
  ChevronUp,
  Smartphone,
} from "lucide-react"
import { Suspense } from "react"
import Loading from "./loading"
import { cn } from "@/lib/utils"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const services = [
  {
    href: "/dashboard/data",
    label: "Buy Data",
    description: "Affordable bundles for all networks",
    icon: Wifi,
    color: "text-[#1A85B8] bg-[#E6F0FF]",
    hoverColor: "group-hover:border-[#1A85B8]/30"
  },
  {
    href: "/dashboard/verification",
    label: "Number Verification",
    description: "Get US numbers for SMS verification",
    icon: PhoneCall,
    color: "text-[#FF5630] bg-[#FFE5E8]",
    hoverColor: "group-hover:border-[#FF5630]/30"
  },
  {
    href: "/dashboard/result-checkers",
    label: "Result Checker",
    description: "Check WASSCE, BECE & other exam results",
    icon: GraduationCap,
    color: "text-[#6B7280] bg-[#F3F4F6]",
    hoverColor: "group-hover:border-[#6B7280]/30"
  },
  {
    href: "/dashboard/reseller",
    label: "Reseller Programme",
    description: "Earn commissions on every referral sale",
    icon: Store,
    color: "text-amber-700 bg-amber-50",
    hoverColor: "group-hover:border-amber-300/50"
  },
  {
    href: "/dashboard/esim",
    label: "eSIM",
    description: "Digital SIM cards for global connectivity",
    icon: Smartphone,
    color: "text-emerald-600 bg-emerald-50",
    hoverColor: "group-hover:border-emerald-300/50"
  },
  {
    href: "/dashboard/proxies",
    label: "Proxies",
    description: "Residential, mobile & datacenter proxies",
    icon: Shield,
    color: "text-violet-600 bg-violet-50",
    hoverColor: "group-hover:border-violet-300/50"
  },
  {
    href: "/dashboard/giftcards",
    label: "Gift Cards",
    description: "Buy & send digital gift cards instantly",
    icon: Gift,
    color: "text-pink-600 bg-pink-50",
    hoverColor: "group-hover:border-pink-300/50"
  },
  {
    href: "/dashboard/bills",
    label: "Pay Bills",
    description: "Electricity, TV, water & internet bills",
    icon: CreditCard,
    color: "text-orange-600 bg-orange-50",
    hoverColor: "group-hover:border-orange-300/50"
  },
]

interface Transaction {
  id: string
  reference?: string
  type: "deposit" | "data"
  amount: number
  status: string
  description: string
  created_at: string
  network?: string | null
  phone_number?: string | null
}

interface ReferralStats {
  referralCode: string
  totalEarnings: number
  totalReferred: number
  qualifiedReferrals: number
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showFundModal, setShowFundModal] = useState(false)
  const [pendingReference, setPendingReference] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<{
    totals: {
      totalDeposits: number
      totalSpend: number
      dataSpend: number
      verificationSpend: number
      resultCheckerSpend: number
      successfulCount: number
      totalCount: number
    }
    recentTransactions: Transaction[]
    beneficiaries: Array<{
      phone_number: string
      network: string | null
      created_at: string
    }>
    processingPurchases: Transaction[]
  }>({
    totals: {
      totalDeposits: 0,
      totalSpend: 0,
      dataSpend: 0,
      verificationSpend: 0,
      resultCheckerSpend: 0,
      successfulCount: 0,
      totalCount: 0,
    },
    recentTransactions: [],
    beneficiaries: [],
    processingPurchases: [],
  })

  // Handle payment callback from Paystack
  useEffect(() => {
    const payment = searchParams.get("payment")
    const reference = searchParams.get("reference")

    if (payment === "callback" && reference) {
      setPendingReference(reference)
      setShowFundModal(true)
      // Clean up URL
      router.replace("/dashboard", { scroll: false })
    }
  }, [searchParams, router])

  // Handle modal close and cleanup
  const handleModalClose = (open: boolean) => {
    setShowFundModal(open)
    if (!open) {
      setPendingReference(null)
      // Refresh transactions after modal closes
      loadDashboardData()
      refreshUser()
    }
  }

  const loadDashboardData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setReferralError(null)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort("Database cold start – please retry"), 60000);
      
      const [dashRes, refRes] = await Promise.all([
        fetch("/api/dashboard", { credentials: "include", cache: "no-store", signal: controller.signal }),
        fetch("/api/referral/stats", { credentials: "include", cache: "no-store", signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);
      
      if (dashRes.status === 401) {
        window.location.href = "/login?redirect=/dashboard"
        return
      }

      const json = await dashRes.json()
      if (dashRes.ok && json?.success && json?.data) {
        const result = json.data
        setDashboardData({
          totals: result.totals,
          recentTransactions: (result.recentTransactions || []) as Transaction[],
          beneficiaries: result.beneficiaries || [],
          processingPurchases: (result.processingPurchases || []) as Transaction[],
        })
        setLastUpdated(new Date())
      } else {
        setError(json?.error || `Dashboard API error: ${dashRes.status}`)
      }
      
      if (!refRes.ok) {
        if (refRes.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = "/login?redirect=/dashboard"
          return
        }
        let errorMessage = `Referral API error: ${refRes.status}`;
        try {
          const errJson = await refRes.json();
          if (errJson?.error) errorMessage = errJson.error;
        } catch { /* ignore */ }
        setReferralError(errorMessage);
      } else {
        const refJson = await refRes.json()
        if (refJson?.success && refJson?.data) {
          setReferralStats(refJson.data)
        } else {
          setReferralError(refJson?.error || "Failed to load referral stats")
        }
      }
    } catch (err) {
      console.error("Dashboard load error:", err)
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.")
        } else if (err.message.includes("Failed to fetch")) {
          setError("Network error. Check your connection and try again.")
        } else {
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()

    // Auto-refresh processing purchases every 10 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDashboardData().catch((err) => {
          console.error("Auto-refresh error:", err)
          // Silently fail on auto-refresh to avoid spamming users
        })
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [user, loadDashboardData])


  const recentTransactions = dashboardData.recentTransactions
  const {
    totalDeposits,
    totalSpend,
    dataSpend,
    verificationSpend,
    resultCheckerSpend,
    successfulCount,
    totalCount,
  } = dashboardData.totals

  const spendTotal = dataSpend + verificationSpend + resultCheckerSpend
  const dataPct = spendTotal > 0 ? Math.round((dataSpend / spendTotal) * 100) : 0
  const verificationPct = spendTotal > 0 ? Math.round((verificationSpend / spendTotal) * 100) : 0
  const resultCheckerPct = spendTotal > 0 ? Math.round((resultCheckerSpend / spendTotal) * 100) : 0

  const beneficiaries = dashboardData.beneficiaries
  const processingPurchases = dashboardData.processingPurchases

  const referralCode = referralStats?.referralCode || (user ? user.id.slice(0, 8).toUpperCase() : "XXXXXX")
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/r/${referralCode}` : `/r/${referralCode}`
  const referralText = `Join me on Topchart ! Sign up using my link: ${referralLink}`

  return (
    <Suspense fallback={<Loading />}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-8 pb-16"
      >
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Hello, {user?.firstName}!
            </h1>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <p className="text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-[#0052CC]" />
              Data, verification, result checkers &amp; reseller — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               size="sm" 
               onClick={loadDashboardData} 
               disabled={loading}
               className="h-9"
             >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Error Summary */}
        {(error || referralError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-destructive/50 bg-destructive/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-destructive text-base">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Data Loading Errors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {error && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dashboard: {error}</span>
                    <Button size="sm" variant="outline" onClick={loadDashboardData}>Retry</Button>
                  </div>
                )}
                {referralError && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Referrals: {referralError}</span>
                    <Button size="sm" variant="outline" onClick={loadDashboardData}>Retry</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Financial Overview - Detail Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            <WalletCard />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deposits</span>
                      <TrendingUp className="w-4 h-4 text-[#0052CC]" />
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(totalDeposits)}</p>
                    <p className="text-[10px] text-muted-foreground">Lifetime successful funding</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                whileHover={{ y: -4 }}
              >
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usage</span>
                      <PiggyBank className="w-4 h-4 text-[#1A85B8]" />
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(totalSpend)}</p>
                    <p className="text-[10px] text-muted-foreground">All service consumption</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stability</span>
                      <ShieldCheck className="w-4 h-4 text-[#FF5630]" />
                    </div>
                    <p className="text-xl font-bold">{successfulCount}/{totalCount}</p>
                    <p className="text-[10px] text-muted-foreground">Success rate of transactions</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="flex flex-col justify-between h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {services.map((service, index) => (
                  <motion.div
                    key={service.href}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Link href={service.href} className="group">
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-xl border border-border transition-all hover:bg-muted/50",
                        service.hoverColor
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", service.color)}>
                            <service.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{service.label}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </CardContent>
              <div className="px-6 pb-6 pt-2">
                <div className="p-3 rounded-lg bg-[#0052CC]/5 border border-[#0052CC]/10">
                  <div className="flex items-center gap-2 mb-2">
                     <Zap className="w-3 h-3 text-[#0052CC]" />
                     <span className="text-[10px] font-bold uppercase text-[#0052CC]">Pro Tip</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bulk purchases are processed with priority. Fund your wallet for instant 24/7 access.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Detailed Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Processing & Usage Breakdown */}
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Activity className="w-5 h-5 text-[#0052CC]" />
                <h2 className="text-lg font-bold">System Activity</h2>
              </div>
              
              <Card className="overflow-hidden">
                <CardHeader className="pb-4 border-b">
                   <CardTitle className="text-base flex items-center justify-between">
                     Live Processing
                     {processingPurchases.length > 0 && <Badge variant="secondary" className="animate-pulse">Active</Badge>}
                   </CardTitle>
                   <CardDescription>Purchases currently being synchronized with network providers</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {processingPurchases.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#0052CC]/10 flex items-center justify-center mx-auto">
                        <Clock className="w-6 h-6 text-[#0052CC]" />
                      </div>
                      <p className="text-sm font-medium">No Active Purchases</p>
                      <p className="text-xs text-muted-foreground">All transactions completed. Ready for your next purchase.</p>
                      <div className="flex gap-2 justify-center pt-2">
                        <Link href="/dashboard/data">
                          <Button size="sm" variant="outline" className="h-8">
                            <Wifi className="w-3 h-3 mr-1" />
                            Data
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {processingPurchases.map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                              <Wifi className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{tx.description || "Provider Request"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{tx.id.toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(tx.amount)}</p>
                            <div className="flex items-center gap-1.5 justify-end mt-1">
                               <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />
                               <span className="text-[10px] uppercase font-bold text-amber-600">Syncing</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Target className="w-5 h-5 text-[#0052CC]" />
                <h2 className="text-lg font-bold">Usage Metrics</h2>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resource Allocation</CardTitle>
                  <CardDescription>Distribution of spending across infrastructure categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Data Connectivity</span>
                      <span className="font-bold">{formatCurrency(dataSpend)} ({dataPct}%)</span>
                    </div>
                    <Progress value={dataPct} className="h-1.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Number Verification</span>
                      <span className="font-bold">{formatCurrency(verificationSpend)} ({verificationPct}%)</span>
                    </div>
                    <Progress value={verificationPct} className="h-1.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Result Checkers</span>
                      <span className="font-bold">{formatCurrency(resultCheckerSpend)} ({resultCheckerPct}%)</span>
                    </div>
                    <Progress value={resultCheckerPct} className="h-1.5" />
                  </div>
                  {spendTotal === 0 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">No spend data yet — make your first purchase to see the breakdown.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Activity Log & Beneficiaries */}
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <History className="w-5 h-5 text-[#0052CC]" />
                <h2 className="text-lg font-bold">Activity Log</h2>
              </div>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
                      <p className="text-sm text-muted-foreground animate-pulse">Fetching records...</p>
                    </div>
                  ) : recentTransactions.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Inbox className="w-8 h-8 text-muted-foreground opacity-50" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold">No Transactions Yet</p>
                        <p className="text-sm text-muted-foreground">Your activity will appear here once you make purchases.</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Link href="/dashboard/data">
                          <Button size="sm" variant="outline">
                            <Wifi className="w-4 h-4 mr-2" />
                            Buy Data
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id}>
                          <div 
                            className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors cursor-pointer"
                            onClick={() => setExpandedTransaction(expandedTransaction === tx.id ? null : tx.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                tx.type === "deposit" ? "bg-[#0052CC]/10 text-[#0052CC]" : "bg-[#1A85B8]/10 text-[#1A85B8]"
                              )}>
                                {tx.type === "deposit" ? <ArrowDownRight className="w-5 h-5" /> : <Wifi className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">{tx.description}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">
                                  {new Date(tx.created_at).toLocaleDateString("en-GH", { day: 'numeric', month: 'short' })} · 
                                  {new Date(tx.created_at).toLocaleTimeString("en-GH", { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className={cn("text-sm font-bold", tx.type === "deposit" ? "text-[#0052CC]" : "text-foreground")}>
                                  {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                </p>
                                <Badge variant={tx.status === "success" ? "outline" : "secondary"} className={cn(
                                  "text-[9px] uppercase font-bold h-4 px-1.5",
                                  tx.status === "success" ? "text-[#0052CC] bg-[#E6F0FF]/80 border-[#0052CC]/20" : "text-amber-600 bg-amber-50/50"
                                )}>
                                  {tx.status}
                                </Badge>
                              </div>
                              {expandedTransaction === tx.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {expandedTransaction === tx.id && (
                            <div className="px-4 pb-4 space-y-2 bg-muted/30 border-t border-border">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-background border">
                                  <p className="text-muted-foreground font-bold uppercase">Type</p>
                                  <p className="font-medium">{tx.type}</p>
                                </div>
                                <div className="p-2 rounded bg-background border">
                                  <p className="text-muted-foreground font-bold uppercase">Amount</p>
                                  <p className="font-medium">{formatCurrency(tx.amount)}</p>
                                </div>
                              </div>
                              {tx.phone_number && (
                                <div className="p-2 rounded bg-background border text-xs">
                                  <p className="text-muted-foreground font-bold uppercase">Phone Number</p>
                                  <p className="font-medium">{tx.phone_number}</p>
                                </div>
                              )}
                              {tx.network && (
                                <div className="p-2 rounded bg-background border text-xs">
                                  <p className="text-muted-foreground font-bold uppercase">Network</p>
                                  <p className="font-medium">{tx.network}</p>
                                </div>
                              )}
                              {tx.reference && (
                                <div className="p-2 rounded bg-background border text-xs">
                                  <p className="text-muted-foreground font-bold uppercase">Reference</p>
                                  <p className="font-mono text-xs">{tx.reference}</p>
                                </div>
                              )}
                              <div className="p-2 rounded bg-background border text-xs">
                                <p className="text-muted-foreground font-bold uppercase">Date & Time</p>
                                <p className="font-medium">{new Date(tx.created_at).toLocaleString("en-GH")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Users className="w-5 h-5 text-[#0052CC]" />
                <h2 className="text-lg font-bold">Network Recipients</h2>
              </div>
              <Card>
                <CardContent className="p-4">
                  {beneficiaries.length === 0 ? (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6 text-muted-foreground opacity-50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No Recipients Yet</p>
                        <p className="text-xs text-muted-foreground">Frequent recipients will appear here for quick access.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {beneficiaries.slice(0, 4).map((b) => (
                        <div key={b.phone_number} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0052CC]/10 text-[#0052CC] flex items-center justify-center text-xs font-bold">
                               {b.phone_number.slice(-2)}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{b.phone_number}</p>
                              <p className="text-[9px] text-muted-foreground font-mono">{b.network || "DETECTING..."}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <Button asChild size="icon" variant="ghost" className="h-7 w-7 rounded-full text-[#1A85B8] hover:text-[#1A85B8]/80 hover:bg-[#E6F0FF]">
                              <Link href={`/dashboard/data?phone=${encodeURIComponent(b.phone_number)}`}>
                                <Wifi className="w-3 h-3" />
                              </Link>
                            </Button>
                            <Button asChild size="icon" variant="ghost" className="h-7 w-7 rounded-full text-[#1A85B8] hover:text-[#0052CC] hover:bg-[#E6F0FF]">
                              <Link href={`/dashboard/data?phone=${encodeURIComponent(b.phone_number)}`}>
                                <Wifi className="w-3 h-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>

        {/* Affiliate & Security - Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="bg-[#0052CC]/5 border-[#0052CC]/10 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 rotate-12">
                <Gift className="w-32 h-32 text-[#0052CC]" />
             </div>
             <CardHeader>
               <CardTitle className="text-base flex items-center gap-2">
                 <Gift className="w-4 h-4 text-[#0052CC]" />
                 Growth Incentives
               </CardTitle>
               <CardDescription>Scale your earnings by expanding our infrastructure network.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-[#0052CC]/20">
                 <div className="flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono truncate max-w-[150px]">{referralLink}</span>
                 </div>
                 <div className="flex gap-2">
                   <Button 
                     size="sm" 
                     variant="outline"
                     className="h-7 text-[10px] uppercase font-bold"
                     onClick={async () => {
                       const success = await copyToClipboard(referralLink)
                       if (success) {
                         setCopied(true)
                         toast.success("Referral link copied to clipboard")
                         setTimeout(() => setCopied(false), 1200)
                       } else {
                         toast.error("Failed to copy link")
                       }
                     }}
                   >
                     {copied ? "Copied" : "Copy"}
                   </Button>
                   <Button 
                     size="sm" 
                     className="h-7 text-[10px] uppercase font-bold"
                     onClick={async () => {
                       const shareData = {
                         title: "Join Topchart ",
                         text: "Scale your earnings by expanding our infrastructure network. Use my referral link to get started!",
                         url: referralLink
                       }
                       
                       if (navigator.share && navigator.canShare(shareData)) {
                         try {
                           await navigator.share(shareData)
                           toast.success("Shared successfully")
                         } catch (error) {
                           if ((error as Error).name !== 'AbortError') {
                             toast.error("Failed to share")
                           }
                         }
                       } else {
                         const success = await copyToClipboard(referralLink)
                         if (success) {
                           toast.success("Referral link copied to clipboard")
                         } else {
                           toast.error("Failed to copy link")
                         }
                       }
                     }}
                   >
                     <Share2 className="w-3 h-3" />
                   </Button>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 rounded-lg bg-background border border-border">
                   <p className="text-[10px] uppercase text-muted-foreground font-bold">Commission</p>
                   <p className="text-lg font-bold text-[#0052CC]">{formatCurrency(referralStats?.totalEarnings || 0)}</p>
                 </div>
                 <div className="p-3 rounded-lg bg-background border border-border">
                   <p className="text-[10px] uppercase text-muted-foreground font-bold">Qualified</p>
                   <p className="text-lg font-bold text-[#FF5630]">{referralStats?.qualifiedReferrals || 0}</p>
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="text-base flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-[#FF5630]" />
                 System Security
               </CardTitle>
               <CardDescription>Audit-compliant protocols protect your financial data.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-start gap-3">
                 <CreditCard className="w-4 h-4 mt-0.5 text-muted-foreground" />
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Multi-factor authentication is active. Paystack handles all payment processing via PCI-DSS compliant channels.
                 </p>
               </div>
               <div className="flex gap-2">
                 <Button asChild variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold flex-1">
                    <Link href="/terms">Terms of Service</Link>
                 </Button>
                 <Button asChild variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold flex-1">
                    <Link href="/privacy">Privacy Policy</Link>
                 </Button>
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Fund Wallet Modal */}
        <FundWalletModal
          open={showFundModal}
          onOpenChange={handleModalClose}
          pendingReference={pendingReference}
        />
      </motion.div>
    </Suspense>
  )
}
