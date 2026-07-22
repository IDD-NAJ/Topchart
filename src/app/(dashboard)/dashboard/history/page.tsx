"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import type { jsPDF as JsPDFType } from "jspdf"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowDownRight,
  Phone,
  Wifi,
  Clock,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
  Search,
  Download,
  Plus,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Wallet,
  Receipt,
  ChevronRight,
} from "lucide-react"
import { FundWalletModal } from "@/components/fund-wallet-modal"
import { PageHeader } from "@/components/dashboard/page-header"
import { copyToClipboard } from "@/lib/clipboard"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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

const fetcher = async (url: string) => {
  const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
  if (!meRes.ok) throw new Error("Not authenticated")
  const meData = await meRes.json()
  if (!meData?.success || !meData?.user?.id) throw new Error("No user")
  const res = await fetch(`/api/transactions?userId=${meData.user.id}`, { credentials: "include", cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const result = await res.json()
  if (!result.success) throw new Error(result.error || "Failed to load")
  return { transactions: result.transactions as Transaction[], user: meData.user }
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "airtime", label: "Airtime" },
  { value: "data", label: "Data" },
  { value: "referral", label: "Referrals" },
  { value: "withdrawal", label: "Withdrawals" },
]

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
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const { toast } = useToast()

  const { data, isLoading, isValidating, mutate, error } = useSWR(
    "/api/history-page",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      onError: () => {
        toast({ title: "Connection issue", description: "Could not refresh transaction history.", variant: "destructive" })
      },
    }
  )

  const transactions = data?.transactions ?? []

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter = filter === "all" || tx.type === filter
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [transactions, filter, searchQuery])

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.created_at)
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      let groupKey = ""
      if (date.toDateString() === today.toDateString()) groupKey = "Today"
      else if (date.toDateString() === yesterday.toDateString()) groupKey = "Yesterday"
      else groupKey = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(tx)
    })
    return groups
  }, [filteredTransactions])

  const stats = useMemo(() => {
    const totalSpent = transactions.filter((tx) => tx.type !== "deposit" && tx.status === "success").reduce((a, tx) => a + tx.amount, 0)
    const totalDeposited = transactions.filter((tx) => tx.type === "deposit" && tx.status === "success").reduce((a, tx) => a + tx.amount, 0)
    const successRate = transactions.length > 0 ? (transactions.filter((tx) => tx.status === "success").length / transactions.length) * 100 : 0
    return { totalSpent, totalDeposited, successRate }
  }, [transactions])

  const handleCopyReference = async (ref: string) => {
    const success = await copyToClipboard(ref)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Copied!", description: "Reference copied to clipboard." })
    }
  }

  const handleCreateDispute = async () => {
    if (!selectedTx || !disputeReason) return
    setIsSubmittingDispute(true)
    try {
      const res = await fetch("/api/dashboard/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: selectedTx.id, reason: disputeReason }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Dispute Created", description: "We'll investigate and get back to you." })
        setIsDisputeDialogOpen(false)
        setSelectedTx(null)
        setDisputeReason("")
      } else {
        toast({ title: "Error", description: result.error || "Failed to create dispute", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsSubmittingDispute(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: "No transactions to export", description: "Apply a different filter and try again." })
      return
    }
    const headers = ["ID", "Type", "Amount (GHS)", "Status", "Description", "Reference", "Network", "Phone", "Date"]
    const csvRows = filteredTransactions.map((tx) =>
      [tx.id, tx.type, tx.amount.toFixed(2), tx.status, `"${(tx.description || "").replace(/"/g, "'")}"`, tx.reference, tx.network ?? "", tx.phone_number ?? "", new Date(tx.created_at).toLocaleString("en-GH")].join(",")
    )
    const csv = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `topchart-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Exported", description: `${filteredTransactions.length} transactions saved as CSV.` })
  }

  const handleDownloadReceipt = async (tx: Transaction) => {
    const { jsPDF } = await import("jspdf")
    const doc: JsPDFType = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = 0
    const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
    const accent = "#F97316"
    const dark = "#0f172a"
    const muted = "#64748b"
    const border = "#e2e8f0"

    doc.setFillColor(...hex(dark))
    doc.rect(0, 0, pageW, 32, "F")
    doc.setFillColor(...hex(accent))
    doc.rect(0, 32, pageW, 3, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("TOPCHART", margin, 14)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Transaction Receipt", margin, 22)
    doc.text(`Generated: ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, pageW - margin, 22, { align: "right" })

    y = 52
    const isCredit = tx.type === "deposit"
    doc.setTextColor(...hex(isCredit ? "#16a34a" : dark))
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text(`${isCredit ? "+" : "-"}GH₵${tx.amount.toFixed(2)}`, pageW / 2, y, { align: "center" })

    y += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...hex(muted))
    doc.text(tx.description, pageW / 2, y, { align: "center" })

    y += 7
    const sc: Record<string, [number, number, number]> = { success: hex("#16a34a"), pending: hex("#d97706"), failed: hex("#dc2626") }
    doc.setTextColor(...(sc[tx.status.toLowerCase()] ?? hex(muted)))
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(tx.status.toUpperCase(), pageW / 2, y, { align: "center" })

    y += 8
    doc.setDrawColor(...hex(border))
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)

    y += 8
    const rows: [string, string][] = [
      ["Transaction ID", tx.id],
      ["Reference", tx.reference],
      ["Type", tx.type.charAt(0).toUpperCase() + tx.type.slice(1)],
      ["Date & Time", new Date(tx.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })],
    ]
    if (tx.network) rows.push(["Network", tx.network])
    if (tx.phone_number) rows.push(["Phone Number", tx.phone_number])
    if (tx.data_plan) rows.push(["Data Plan", tx.data_plan])
    if (tx.fees != null) rows.push(["Surcharge", `GH₵${tx.fees.toFixed(2)}`], ["Base Amount", `GH₵${(tx.amount - tx.fees).toFixed(2)}`], ["Total Charged", `GH₵${tx.amount.toFixed(2)}`])
    if (tx.payment_method) rows.push(["Payment Method", tx.payment_method])
    if (tx.payment_channel) rows.push(["Payment Channel", tx.payment_channel])
    if (tx.currency) rows.push(["Currency", tx.currency])

    rows.forEach(([label, value], i) => {
      const rowY = y + i * 9
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, rowY - 5, contentW, 9, "F") }
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...hex(muted))
      doc.text(label, margin + 3, rowY)
      doc.setTextColor(...hex(dark))
      doc.setFont("helvetica", "bold")
      doc.text(value.length > 42 ? value.slice(0, 42) + "..." : value, pageW - margin - 3, rowY, { align: "right" })
    })

    y += rows.length * 9 + 10
    doc.setFillColor(...hex(accent))
    doc.setDrawColor(...hex(accent))
    doc.roundedRect(margin, y, contentW, 18, 3, 3, "FD")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("Thank you for using Topchart!", pageW / 2, y + 7, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text("For support, contact support@topchart.app", pageW / 2, y + 13, { align: "center" })

    doc.save(`topchart-receipt-${tx.reference}.pdf`)
    toast({ title: "Receipt Downloaded", description: `Saved as topchart-receipt-${tx.reference}.pdf` })
  }

  const getTransactionIcon = (type: string) => {
    const base = "flex h-9 w-9 items-center justify-center rounded-full shrink-0"
    switch (type) {
      case "deposit": return <div className={cn(base, "bg-success/10 text-success")}><ArrowDownRight className="h-4 w-4" /></div>
      case "airtime": return <div className={cn(base, "bg-primary/10 text-primary")}><Phone className="h-4 w-4" /></div>
      case "data": return <div className={cn(base, "bg-primary/10 text-primary")}><Wifi className="h-4 w-4" /></div>
      case "referral": return <div className={cn(base, "bg-success/10 text-success")}><TrendingUp className="h-4 w-4" /></div>
      default: return <div className={cn(base, "bg-muted text-muted-foreground")}><Clock className="h-4 w-4" /></div>
    }
  }

  const getStatusChip = (status: string) => {
    switch (status.toLowerCase()) {
      case "success": return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-success/10 text-success">Success</span>
      case "pending": return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-warning/10 text-warning">Pending</span>
      case "failed": return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-destructive/10 text-destructive">Failed</span>
      default: return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">{status}</span>
    }
  }

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Transactions"
        description="Monitor and export your full transaction history"
        backHref="/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2.5 py-2 hover:bg-muted disabled:opacity-40"
              aria-label="Refresh transactions"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2 h-9" onClick={() => setShowFundModal(true)}>
              <Plus className="h-4 w-4" />
              Add Funds
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { label: "Total Spent", value: `GH₵${stats.totalSpent.toFixed(2)}`, icon: TrendingUp, iconClass: "text-primary", note: "Lifetime purchases" },
          { label: "Total Funded", value: `GH₵${stats.totalDeposited.toFixed(2)}`, icon: Wallet, iconClass: "text-success", note: "Total wallet top-ups" },
          { label: "Success Rate", value: `${stats.successRate.toFixed(1)}%`, icon: Check, iconClass: "text-success", note: "Transaction completion" },
        ].map(({ label, value, icon: Icon, iconClass, note }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <Icon className={cn("h-4 w-4", iconClass)} />
            </div>
            {isLoading ? (
              <div className="h-7 w-28 skeleton" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-xl border border-border p-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by description or reference..."
              className="pl-10 h-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error.message || "Failed to load transactions."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isValidating} className="shrink-0">
            <RefreshCw className={cn("h-4 w-4 mr-2", isValidating && "animate-spin")} />
            Retry
          </Button>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-9 w-9 rounded-full skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 skeleton" />
                  <div className="h-2.5 w-24 skeleton" />
                </div>
                <div className="h-4 w-20 skeleton" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No transactions found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "You haven't made any transactions yet."}
            </p>
            {(searchQuery || filter !== "all") && (
              <Button variant="link" size="sm" onClick={() => { setSearchQuery(""); setFilter("all") }} className="mt-3 text-primary">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <motion.div key={date} variants={item} className="space-y-2">
                <div className="flex items-center gap-3 px-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{date}</span>
                  <Separator className="flex-1 opacity-40" />
                  <span className="text-xs text-muted-foreground">{txs.length} transaction{txs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {txs.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="group w-full flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors text-left"
                    >
                      {getTransactionIcon(tx.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" · "}
                          <span className="font-mono">{tx.reference.slice(0, 8)}...</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className={cn("text-sm font-semibold", tx.type === "deposit" ? "text-success" : "text-foreground")}>
                            {tx.type === "deposit" ? "+" : "-"}GH₵{tx.amount.toFixed(2)}
                          </p>
                          <div className="mt-1">{getStatusChip(tx.status)}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <AnimatePresence>
        {selectedTx && (
          <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Transaction Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Amount block */}
                <div className="flex flex-col items-center justify-center py-6 rounded-xl bg-muted/40 border border-border">
                  <div className="mb-3">{getTransactionIcon(selectedTx.type)}</div>
                  <p className={cn("text-3xl font-bold", selectedTx.type === "deposit" ? "text-success" : "text-foreground")}>
                    {selectedTx.type === "deposit" ? "+" : "-"}GH₵{selectedTx.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTx.description}</p>
                  <div className="mt-3">{getStatusChip(selectedTx.status)}</div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  {[
                    ["Reference", selectedTx.reference],
                    ["Type", selectedTx.type.charAt(0).toUpperCase() + selectedTx.type.slice(1)],
                    ["Date", new Date(selectedTx.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })],
                    ...(selectedTx.network ? [["Network", selectedTx.network.toUpperCase()]] : []),
                    ...(selectedTx.phone_number ? [["Phone", selectedTx.phone_number]] : []),
                    ...(selectedTx.data_plan ? [["Plan", selectedTx.data_plan]] : []),
                    ...(selectedTx.fees != null ? [["Surcharge", `GH₵${selectedTx.fees.toFixed(2)}`]] : []),
                    ...(selectedTx.payment_method ? [["Method", selectedTx.payment_method]] : []),
                    ...(selectedTx.payment_channel ? [["Channel", selectedTx.payment_channel]] : []),
                  ].map(([label, value]) => (
                    <>
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <span className="text-right text-xs font-medium break-all">{value}</span>
                    </>
                  ))}
                </div>

                {/* Copy reference */}
                <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Transaction ID</p>
                    <p className="text-xs font-mono truncate">{selectedTx.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopyReference(selectedTx.id)}
                    aria-label="Copy transaction ID"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full gap-2" onClick={() => selectedTx && handleDownloadReceipt(selectedTx)}>
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </Button>
                  {selectedTx.status === "success" && (
                    <Button
                      variant="ghost"
                      className="w-full gap-2 text-destructive hover:bg-destructive/5"
                      onClick={() => setIsDisputeDialogOpen(true)}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Report an Issue
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Dispute Dialog */}
      <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Report an Issue
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted/40 border border-border p-4 text-sm">
              <p className="font-semibold text-foreground">{selectedTx?.description}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-muted-foreground text-xs">GH₵{selectedTx?.amount.toFixed(2)}</p>
                <p className="text-xs font-mono text-muted-foreground">{selectedTx?.reference}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-medium">What went wrong?</Label>
              <Textarea
                id="reason"
                placeholder="e.g. My wallet was charged but the airtime didn't arrive..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="min-h-[100px] bg-background resize-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleCreateDispute}
              disabled={!disputeReason || isSubmittingDispute}
              className="w-full"
            >
              {isSubmittingDispute ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
              ) : "Submit Report"}
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
          if (!v) mutate()
        }}
      />
    </div>
  )
}
