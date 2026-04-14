"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FundWalletModal } from "@/components/fund-wallet-modal"
import { WalletCard } from "@/components/wallet-card"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Clock,
  CreditCard,
  Plus,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react"
import { formatCurrency } from "@/lib/networks"

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

export default function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [showFundModal, setShowFundModal] = useState(false)
  const { toast } = useToast()

  const loadWalletData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/wallet')
      const result = await response.json()
      if (result.success && result.data) {
        setWalletData(result.data)
      } else {
        setWalletData({
          balance: 0,
          totalDeposited: 0,
          totalSpent: 0,
          pendingBalance: 0,
          recentTransactions: []
        })
      }
    } catch (error) {
      console.error('Failed to load wallet:', error)
      setWalletData({
        balance: 0,
        totalDeposited: 0,
        totalSpent: 0,
        pendingBalance: 0,
        recentTransactions: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <div className="p-2 rounded-full bg-green-500/10 text-green-500"><ArrowDownRight className="w-4 h-4" /></div>
      case "withdrawal":
        return <div className="p-2 rounded-full bg-red-500/10 text-red-500"><ArrowUpRight className="w-4 h-4" /></div>
      case "airtime":
        return <div className="p-2 rounded-full bg-blue-500/10 text-blue-500"><CreditCard className="w-4 h-4" /></div>
      case "data":
        return <div className="p-2 rounded-full bg-purple-500/10 text-purple-500"><Wallet className="w-4 h-4" /></div>
      default:
        return <div className="p-2 rounded-full bg-muted text-muted-foreground"><Clock className="w-4 h-4" /></div>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
            <p className="text-muted-foreground">Manage your wallet balance and transactions</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowFundModal(true)}>
            <Plus className="w-4 h-4" />
            Add Funds
          </Button>
        </div>

        {/* Main Balance Card */}
        <Card className="mb-8 border-[#0052CC]/10 bg-gradient-to-br from-[#0052CC]/5 to-background">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Available Balance</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {loading ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                  ) : (
                    formatCurrency(walletData?.balance || 0)
                  )}
                </h2>
                {walletData && (walletData.pendingBalance ?? 0) > 0 && (
                  <p className="text-sm text-yellow-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Pending: {formatCurrency(walletData?.pendingBalance ?? 0)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Secure</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-[#0052CC]/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Deposited</p>
                <ArrowDownRight className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">
                  {loading ? "-" : formatCurrency(walletData?.totalDeposited || 0)}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime deposits</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-[#0052CC]/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">
                  {loading ? "-" : formatCurrency(walletData?.totalSpent || 0)}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime spending</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-[#0052CC]/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Net Position</p>
                <TrendingUp className="w-4 h-4 text-[#0052CC]" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">
                  {loading ? "-" : formatCurrency((walletData?.totalDeposited || 0) - (walletData?.totalSpent || 0))}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-[#0052CC]/5">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                <p className="text-muted-foreground animate-pulse">Loading transactions...</p>
              </div>
            ) : walletData?.recentTransactions?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#0052CC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-[#0052CC]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start using your wallet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Add funds to your wallet to purchase airtime and data bundles instantly.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => setShowFundModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Funds
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/buy">Buy Airtime/Data</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {walletData?.recentTransactions?.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-semibold text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-foreground'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className={`text-xs ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fund Wallet Modal */}
      <FundWalletModal 
        open={showFundModal} 
        onOpenChange={(open) => {
          setShowFundModal(open)
          if (!open) loadWalletData()
        }} 
      />
    </div>
  )
}
