"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import type { jsPDF as JsPDFType } from "jspdf"
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
import { FundWalletModal } from "@/components/fund-wallet-modal"
import { copyToClipboard } from "@/lib/clipboard"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type TransactionType = "deposit" | "airtime" | "data" | "referral" | "bonus" | "withdrawal" | "refund"
type FilterType = "all" | TransactionType

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  status: string
  description: string
  reference: string
  network: string | null
  phone_number: string | null
  data_plan: string | null
  payment_method: string | null
  paystack_reference: string | null
  paystack_access_code: string | null
  payment_channel: string | null
  currency: string | null
  fees: number | null
  paid_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export default function HistoryPage() {
  const searchParams = useSearchParams()
  const validFilters: FilterType[] = ["all", "deposit", "airtime", "data", "referral", "bonus", "withdrawal", "refund"]
  const initialType = searchParams?.get("type") ?? "all"
  const [filter, setFilter] = useState<FilterType>(
    validFilters.includes(initialType as FilterType) ? (initialType as FilterType) : "all"
  )
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
  const [showFundModal, setShowFundModal] = useState(false)
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

  const handleExportCSV = () => {
    const rows = filteredTransactions
    if (rows.length === 0) {
      toast({ title: "No transactions to export", description: "Apply a different filter and try again." })
      return
    }
    const headers = ["ID", "Type", "Amount (GHS)", "Status", "Description", "Reference", "Network", "Phone", "Date"]
    const csvRows = rows.map(tx => [
      tx.id,
      tx.type,
      tx.amount.toFixed(2),
      tx.status,
      `"${(tx.description || "").replace(/"/g, "'")}"`,
      tx.reference,
      tx.network ?? "",
      tx.phone_number ?? "",
      new Date(tx.created_at).toLocaleString("en-GH"),
    ].join(","))
    const csv = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `topchart-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Exported", description: `${rows.length} transactions saved as CSV.` })
  }

  const handleDownloadReceipt = async (tx: Transaction) => {
    const { jsPDF } = await import("jspdf")
    const doc: JsPDFType = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = 0

    const hex = (h: string) => {
      const r = parseInt(h.slice(1, 3), 16)
      const g = parseInt(h.slice(3, 5), 16)
      const b = parseInt(h.slice(5, 7), 16)
      return [r, g, b] as [number, number, number]
    }

    const primary = "#1a56db"
    const success = "#16a34a"
    const muted = "#6b7280"
    const border = "#e5e7eb"

    doc.setFillColor(...hex(primary))
    doc.rect(0, 0, pageW, 30, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("TOPCHART", margin, 14)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Transaction Receipt", margin, 21)
    doc.text(`Generated: ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageW - margin, 21, { align: "right" })

    y = 48
    const amtColor = tx.type === "deposit" ? hex(success) : hex("#111827")
    doc.setTextColor(...amtColor)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    const amtStr = `${tx.type === "deposit" ? "+" : "-"}GH₵${tx.amount.toFixed(2)}`
    doc.text(amtStr, pageW / 2, y, { align: "center" })

    y += 7
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...hex(muted))
    doc.text(tx.description, pageW / 2, y, { align: "center" })

    y += 6
    const statusColors: Record<string, [number, number, number]> = {
      success: hex("#16a34a"),
      pending: hex("#d97706"),
      failed: hex("#dc2626"),
    }
    const sc = statusColors[tx.status.toLowerCase()] ?? hex(muted)
    doc.setTextColor(...sc)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(tx.status.toUpperCase(), pageW / 2, y, { align: "center" })

    y += 10
    doc.setDrawColor(...hex(border))
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)

    y += 8
    const rows: [string, string][] = [
      ["Transaction ID", tx.id],
      ["Reference", tx.reference],
      ["Type", tx.type.charAt(0).toUpperCase() + tx.type.slice(1)],
      ["Date & Time", new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ]

    if (tx.network) rows.push(["Network", tx.network])
    if (tx.phone_number) rows.push(["Phone Number", tx.phone_number])
    if (tx.data_plan) rows.push(["Data Plan", tx.data_plan])
    if (tx.fees != null) rows.push(["Surcharge", `GH₵${tx.fees.toFixed(2)}`])
    if (tx.fees != null) rows.push(["Base Amount", `GH₵${(tx.amount - tx.fees).toFixed(2)}`])
    if (tx.fees != null) rows.push(["Charge Amount", `GH₵${tx.amount.toFixed(2)}`])
    if (tx.paid_at) rows.push(["Initiated At", tx.paid_at])
    if (tx.payment_method) rows.push(["Payment Method", tx.payment_method])
    if (tx.payment_channel) rows.push(["Payment Channel", tx.payment_channel])
    if (tx.paystack_access_code) rows.push(["Paystack Access Code", tx.paystack_access_code])
    if (tx.currency) rows.push(["Currency", tx.currency])

    rows.forEach(([label, value], i) => {
      const rowY = y + i * 9
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, rowY - 5, contentW, 9, "F")
      }
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...hex(muted))
      doc.text(label, margin + 3, rowY)
      doc.setTextColor(17, 24, 39)
      doc.setFont("helvetica", "bold")
      const displayVal = value.length > 42 ? value.slice(0, 42) + "..." : value
      doc.text(displayVal, pageW - margin - 3, rowY, { align: "right" })
    })

    y += rows.length * 9 + 6
    doc.setDrawColor(...hex(border))
    doc.line(margin, y, pageW - margin, y)

    y += 14
    doc.setFillColor(...hex("#f0f9ff"))
    doc.roundedRect(margin, y, contentW, 18, 3, 3, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...hex(primary))
    doc.text("Thank you for using Topchart!", pageW / 2, y + 7, { align: "center" })
    doc.setTextColor(...hex(muted))
    doc.text("For support, visit topchart.app or contact support@topchart.app", pageW / 2, y + 13, { align: "center" })

    doc.save(`topchart-receipt-${tx.reference}.pdf`)

    toast({
      title: "Receipt Downloaded",
      description: `PDF saved as topchart-receipt-${tx.reference}.pdf`,
    })
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setShowFundModal(true)}>
              <Plus className="w-4 h-4" />
              Add Funds
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-[#0052CC]/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <TrendingUp className="w-4 h-4 text-[#0052CC]" />
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold">GH₵{stats.totalSpent.toFixed(2)}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime spending on Topchart</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-[#0052CC]/5">
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
          <Card className="bg-card/50 backdrop-blur-sm border-[#0052CC]/5">
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
              className="pl-10 bg-card border-[#0052CC]/5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={filter} onValueChange={(value: string) => setFilter(value as FilterType)} className="w-full md:w-auto">
            <TabsList className="bg-card border border-[#0052CC]/5 h-10">
              <TabsTrigger value="all" className="px-4">All</TabsTrigger>
              <TabsTrigger value="deposit" className="px-4">Deposits</TabsTrigger>
              <TabsTrigger value="airtime" className="px-4">Airtime</TabsTrigger>
              <TabsTrigger value="data" className="px-4">Data</TabsTrigger>
              <TabsTrigger value="referral" className="px-4">Referrals</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Transactions List */}
        <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
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
                      className="group flex items-center justify-between p-4 bg-card hover:bg-accent/50 rounded-xl border border-[#0052CC]/5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-semibold text-sm group-hover:text-[#0052CC] transition-colors">{tx.description}</p>
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
                <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-2xl border border-[#0052CC]/5">
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
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Transaction ID</div>
                    <div className="font-mono text-right text-xs truncate flex items-center justify-end gap-1">
                      {selectedTx.id.slice(0, 12)}...
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => handleCopyReference(selectedTx.id)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-muted-foreground">Reference</div>
                    <div className="font-mono text-right text-xs flex items-center justify-end gap-1">
                      <span className="truncate">{selectedTx.reference}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => handleCopyReference(selectedTx.reference)}>
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
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

                    {selectedTx.network && (
                      <>
                        <div className="text-muted-foreground">Network</div>
                        <div className="text-right font-medium uppercase">{selectedTx.network}</div>
                      </>
                    )}

                    {selectedTx.phone_number && (
                      <>
                        <div className="text-muted-foreground">Phone Number</div>
                        <div className="text-right font-medium">{selectedTx.phone_number}</div>
                      </>
                    )}

                    {selectedTx.data_plan && (
                      <>
                        <div className="text-muted-foreground">Data Plan</div>
                        <div className="text-right font-medium">{selectedTx.data_plan}</div>
                      </>
                    )}

                    {selectedTx.fees != null && (
                      <>
                        <div className="text-muted-foreground">Surcharge</div>
                        <div className="text-right font-medium">GH₵{selectedTx.fees.toFixed(2)}</div>

                        <div className="text-muted-foreground">Base Amount</div>
                        <div className="text-right font-medium">GH₵{(selectedTx.amount - selectedTx.fees).toFixed(2)}</div>

                        <div className="text-muted-foreground">Charge Amount</div>
                        <div className="text-right font-medium">GH₵{selectedTx.amount.toFixed(2)}</div>
                      </>
                    )}

                    {selectedTx.paid_at && (
                      <>
                        <div className="text-muted-foreground">Initiated At</div>
                        <div className="text-right font-medium text-xs">{selectedTx.paid_at}</div>
                      </>
                    )}

                    {selectedTx.payment_method && (
                      <>
                        <div className="text-muted-foreground">Payment Method</div>
                        <div className="text-right font-medium capitalize">{selectedTx.payment_method}</div>
                      </>
                    )}

                    {selectedTx.payment_channel && (
                      <>
                        <div className="text-muted-foreground">Payment Channel</div>
                        <div className="text-right font-medium capitalize">{selectedTx.payment_channel}</div>
                      </>
                    )}

                    {selectedTx.paystack_access_code && (
                      <>
                        <div className="text-muted-foreground">Paystack Access Code</div>
                        <div className="text-right font-mono text-xs">{selectedTx.paystack_access_code}</div>
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full gap-2" onClick={() => selectedTx && handleDownloadReceipt(selectedTx)}>
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
              <div className="p-4 bg-muted/50 rounded-xl text-sm border border-[#0052CC]/5">
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

        <FundWalletModal
          open={showFundModal}
          onOpenChange={(v) => {
            setShowFundModal(v)
            if (!v && user?.id) loadTransactions(user.id)
          }}
        />
      </div>
    </div>
  )
}
