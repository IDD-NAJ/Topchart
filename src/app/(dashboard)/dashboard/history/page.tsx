"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  ArrowDownRight, 
  Phone, 
  Wifi, 
  Clock, 
  Receipt, 
  Copy, 
  Check, 
  Loader2, 
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  MoreVertical,
  Download,
  Plus,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react"
import { copyToClipboard } from "@/lib/clipboard"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type TransactionType = "deposit" | "airtime" | "data"
type FilterType = "all" | TransactionType

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  status: string
  description: string
  reference: string
  metadata: Record<string, string> | null
  created_at: string
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false)
  const { toast } = useToast()

  const loadTransactions = async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/transactions?userId=${userId}`, {
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success && result.transactions) {
        setTransactions(result.transactions as Transaction[])
      } else {
        setError(result.error || "Failed to load transactions")
        setTransactions([])
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }
        
        const result = await response.json()
        if (result.success) {
          setUser(result.user)
          loadTransactions(result.user.id)
        } else {
          setUser(null)
          setError(result.error || "Failed to load user")
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load user:', err)
        setError(err instanceof Error ? err.message : "Network error. Please try again.")
        setUser(null)
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter = filter === "all" || tx.type === filter
      const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tx.reference.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [transactions, filter, searchQuery])

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.created_at)
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      let groupKey = ""
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday"
      } else {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      }

      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(tx)
    })

    return groups
  }, [filteredTransactions])

  const stats = useMemo(() => {
    const totalSpent = transactions
      .filter(tx => tx.type !== 'deposit' && tx.status === 'success')
      .reduce((acc, tx) => acc + tx.amount, 0)
    
    const totalDeposited = transactions
      .filter(tx => tx.type === 'deposit' && tx.status === 'success')
      .reduce((acc, tx) => acc + tx.amount, 0)

    const successRate = transactions.length > 0 
      ? (transactions.filter(tx => tx.status === 'success').length / transactions.length) * 100 
      : 0

    return { totalSpent, totalDeposited, successRate }
  }, [transactions])

  const handleCopyReference = async (ref: string) => {
    const success = await copyToClipboard(ref)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied!",
        description: "Transaction reference copied to clipboard.",
      })
    }
  }

  const handleCreateDispute = async () => {
    if (!selectedTx || !disputeReason) return

    setIsSubmittingDispute(true)
    try {
      const response = await fetch("/api/dashboard/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          reason: disputeReason,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Dispute Created",
          description: "We've received your dispute and will investigate.",
        })
        setIsDisputeDialogOpen(false)
        setSelectedTx(null)
        setDisputeReason("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create dispute",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingDispute(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <div className="p-2 rounded-full bg-green-500/10 text-green-500"><ArrowDownRight className="w-4 h-4" /></div>
      case "airtime":
        return <div className="p-2 rounded-full bg-blue-500/10 text-blue-500"><Phone className="w-4 h-4" /></div>
      case "data":
        return <div className="p-2 rounded-full bg-purple-500/10 text-purple-500"><Wifi className="w-4 h-4" /></div>
      default:
        return <div className="p-2 rounded-full bg-muted text-muted-foreground"><Clock className="w-4 h-4" /></div>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0">Success</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">Monitor and manage your spending history</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Funds
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">GH₵{stats.totalSpent.toFixed(2)}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime spending on Topchart</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Funded</p>
                <Wallet className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">GH₵{stats.totalDeposited.toFixed(2)}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total wallet top-ups</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <Check className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Transaction completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => user && loadTransactions(user.id)}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by description or reference..." 
              className="pl-10 bg-card border-primary/5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={filter} onValueChange={(value: string) => setFilter(value as FilterType)} className="w-full md:w-auto">
            <TabsList className="bg-card border border-primary/5 h-10">
              <TabsTrigger value="all" className="px-4">All</TabsTrigger>
              <TabsTrigger value="deposit" className="px-4">Deposits</TabsTrigger>
              <TabsTrigger value="airtime" className="px-4">Airtime</TabsTrigger>
              <TabsTrigger value="data" className="px-4">Data</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Transactions List */}
        <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Fetching your records...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card className="border-dashed bg-transparent">
              <CardContent className="text-center py-20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No transactions found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                  {searchQuery 
                    ? `We couldn't find any results for "${searchQuery}"`
                    : "You haven't made any transactions yet. Your history will appear here once you start using Topchart."}
                </p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    onClick={() => {setSearchQuery(""); setFilter("all")}}
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{date}</h2>
                  <Separator className="flex-1 opacity-50" />
                </div>
                <div className="grid gap-2">
                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="group flex items-center justify-between p-4 bg-card hover:bg-accent/50 rounded-xl border border-primary/5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="font-mono uppercase">{tx.reference.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          tx.type === "deposit" ? "text-green-500" : "text-foreground"
                        )}>
                          {tx.type === "deposit" ? "+" : "-"}GH₵{tx.amount.toFixed(2)}
                        </p>
                        <div className="mt-1">
                          {getStatusBadge(tx.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Transaction Details Dialog */}
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Transaction Receipt
              </DialogTitle>
            </DialogHeader>
            {selectedTx && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-2xl border border-primary/5">
                  <div className="mb-2">{getTransactionIcon(selectedTx.type)}</div>
                  <h2 className={cn(
                    "text-3xl font-bold",
                    selectedTx.type === "deposit" ? "text-green-500" : "text-foreground"
                  )}>
                    {selectedTx.type === "deposit" ? "+" : "-"}GH₵{selectedTx.amount.toFixed(2)}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTx.description}</p>
                  <div className="mt-4">{getStatusBadge(selectedTx.status)}</div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-muted-foreground">Transaction ID</div>
                    <div className="font-mono text-right flex items-center justify-end gap-2">
                      {selectedTx.id.slice(0, 12)}...
                    </div>
                    
                    <div className="text-muted-foreground">Reference</div>
                    <div className="font-mono text-right flex items-center justify-end gap-1">
                      {selectedTx.reference}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyReference(selectedTx.reference)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-muted-foreground">Type</div>
                    <div className="text-right capitalize font-medium">{selectedTx.type}</div>

                    <div className="text-muted-foreground">Date & Time</div>
                    <div className="text-right font-medium">
                      {new Date(selectedTx.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                      {selectedTx.metadata && Object.entries(selectedTx.metadata).map(([key, value]) => (
                        <div key={key} className="contents">
                          <div className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                          <div className="text-right font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </div>
                      ))}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Download Receipt
                    </Button>
                    {selectedTx.status === "success" && (
                      <Button
                        variant="ghost"
                        className="w-full gap-2 text-destructive hover:bg-destructive/5"
                        onClick={() => setIsDisputeDialogOpen(true)}
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Report an issue
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dispute Dialog */}
        <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                Report an Issue
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-xl text-sm border border-primary/5">
                <p className="font-semibold">{selectedTx?.description}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-muted-foreground">Amount: GH₵{selectedTx?.amount.toFixed(2)}</p>
                  <p className="text-xs font-mono opacity-50">{selectedTx?.reference}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">What went wrong?</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g. My wallet was charged but the airtime didn't arrive, or the transaction failed but I was still debited."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="min-h-[120px] bg-card"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                onClick={handleCreateDispute}
                disabled={!disputeReason || isSubmittingDispute}
                className="w-full"
              >
                {isSubmittingDispute ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setIsDisputeDialogOpen(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
