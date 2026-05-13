"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  ShieldAlert,
  Loader2,
  Target,
  ShieldCheck,
  Plus,
  ChevronRight,
  Receipt,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Dispute, DisputeStatus } from "@/lib/actions/disputes"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const TX_TYPE_LABELS: Record<string, string> = {
  deposit: "Wallet Deposit",
  airtime: "Airtime Purchase",
  data: "Data Bundle",
  referral: "Referral Bonus",
  bonus: "Bonus Credit",
  withdrawal: "Withdrawal",
  refund: "Refund",
  result_checker: "Result Checker",
  esim: "eSIM Purchase",
  proxy: "Proxy Purchase",
  giftcard: "Gift Card",
  bill: "Bill Payment",
}

const STATUS_FILTERS = ["All", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_CONFIG: Record<DisputeStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  OPEN:        { label: "Open",        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",   icon: <AlertCircle className="w-5 h-5 text-blue-500" /> },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400", icon: <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> },
  RESOLVED:    { label: "Resolved",    badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400", icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
  CLOSED:      { label: "Closed",      badgeClass: "bg-muted text-muted-foreground border-border",    icon: <ShieldCheck className="w-5 h-5 text-muted-foreground" /> },
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  reference: string
  created_at: string
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<(Dispute & { transactionType: string; transactionAmount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")

  // Create dispute modal
  const [createOpen, setCreateOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txSearch, setTxSearch] = useState("")
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/disputes")
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) setDisputes(data.disputes)
    } catch (error) {
      console.error("Failed to fetch disputes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    setTxLoading(true)
    try {
      const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      const meData = await meRes.json()
      if (!meData.success) return
      const res = await fetch(`/api/transactions?userId=${meData.user.id}`, { credentials: "include", cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        setTransactions((data.transactions as Transaction[]).filter(t => t.status === "success"))
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => { fetchDisputes() }, [])

  const openCreateModal = () => {
    setCreateOpen(true)
    setSelectedTx(null)
    setReason("")
    setTxSearch("")
    fetchTransactions()
  }

  const handleSubmitDispute = async () => {
    if (!selectedTx || !reason.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: selectedTx.id, reason }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Dispute Submitted", description: "We'll investigate and get back to you within 24–48 hours." })
        setCreateOpen(false)
        fetchDisputes()
      } else {
        toast({ title: "Error", description: data.error || "Failed to submit dispute", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === "OPEN").length,
    inProgress: disputes.filter(d => d.status === "IN_PROGRESS").length,
    resolved: disputes.filter(d => d.status === "RESOLVED" || d.status === "CLOSED").length,
  }

  const filtered = useMemo(() => disputes.filter(d => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || d.id.toLowerCase().includes(q) || (d.reason ?? "").toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || d.status === statusFilter
    return matchSearch && matchStatus
  }), [disputes, searchTerm, statusFilter])

  const filteredTx = useMemo(() => {
    const q = txSearch.toLowerCase()
    if (!q) return transactions.slice(0, 20)
    return transactions.filter(t =>
      t.description?.toLowerCase().includes(q) ||
      t.reference?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [transactions, txSearch])

  const disputedTxIds = new Set(disputes.map(d => d.transactionId))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Disputes</h1>
          <p className="text-muted-foreground text-sm">Report and track issues with your transactions.</p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Raise a Dispute
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: <ShieldAlert className="w-4 h-4" />, color: "text-foreground" },
          { label: "Open", value: stats.open, icon: <AlertCircle className="w-4 h-4" />, color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, icon: <Clock className="w-4 h-4" />, color: "text-amber-600" },
          { label: "Resolved", value: stats.resolved, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={cn("mb-1", s.color)}>{s.icon}</div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Status Filter */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by dispute ID or reason…"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {s === "All" ? "All" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your disputes…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="font-semibold text-base mb-1">
                {searchTerm || statusFilter !== "All" ? "No matching disputes" : "No disputes yet"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-[280px] mx-auto mb-4">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Everything looks good! If a transaction went wrong, you can raise a dispute here."}
              </p>
              {!searchTerm && statusFilter === "All" && (
                <Button className="gap-2" onClick={openCreateModal}>
                  <Plus className="w-4 h-4" /> Raise First Dispute
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border -mx-1">
              {filtered.map(dispute => {
                const cfg = STATUS_CONFIG[dispute.status]
                const typeLabel = TX_TYPE_LABELS[dispute.transactionType] ?? dispute.transactionType
                return (
                  <div key={dispute.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-2 gap-3 hover:bg-muted/30 rounded-lg transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm">{typeLabel}</span>
                          <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", cfg.badgeClass)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-mono">Dispute ID: {dispute.id}</span>
                          <span>·</span>
                          <span>GH₵{Number(dispute.transactionAmount).toFixed(2)}</span>
                          <span>·</span>
                          <span>{new Date(dispute.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {dispute.reason && (
                          <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">"{dispute.reason}"</p>
                        )}
                      </div>
                    </div>
                    {dispute.resolution && (
                      <div className="sm:max-w-[260px] p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-xs text-green-700 dark:text-green-400 shrink-0">
                        <span className="font-semibold mr-1">Resolution:</span>
                        {dispute.resolution}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">How disputes work</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Most disputes are resolved within 24–48 business hours. We work directly with network providers to confirm and fix any failed transactions.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Need urgent help?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For time-sensitive issues, open an{" "}
                <Link href="/dashboard/tickets" className="text-primary font-medium hover:underline">
                  Urgent Support Ticket
                </Link>{" "}
                and our team will prioritise your case.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Dispute Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Raise a Dispute
            </DialogTitle>
            <DialogDescription>
              Select the transaction you want to dispute and describe what went wrong.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Transaction picker */}
            <div className="space-y-2">
              <Label>Select Transaction</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search transactions…"
                  className="pl-9 h-9 text-sm"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                />
              </div>
              <div className="border rounded-lg max-h-[220px] overflow-y-auto divide-y divide-border">
                {txLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading transactions…
                  </div>
                ) : filteredTx.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No transactions found.</div>
                ) : filteredTx.map(tx => {
                  const alreadyDisputed = disputedTxIds.has(tx.id)
                  const isSelected = selectedTx?.id === tx.id
                  return (
                    <button
                      key={tx.id}
                      disabled={alreadyDisputed}
                      onClick={() => setSelectedTx(isSelected ? null : tx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50",
                        alreadyDisputed ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{tx.description || TX_TYPE_LABELS[tx.type] || tx.type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          GH₵{Number(tx.amount).toFixed(2)} · {new Date(tx.created_at).toLocaleDateString()}
                          {alreadyDisputed && " · Already disputed"}
                        </p>
                      </div>
                      {isSelected && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {selectedTx && (
                <div className="p-3 bg-muted/50 rounded-lg text-xs border">
                  <p className="font-semibold">{selectedTx.description || TX_TYPE_LABELS[selectedTx.type] || selectedTx.type}</p>
                  <p className="text-muted-foreground mt-0.5">GH₵{Number(selectedTx.amount).toFixed(2)} · {selectedTx.reference}</p>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">What went wrong?</Label>
              <Textarea
                id="reason"
                placeholder="e.g. My wallet was charged but the airtime didn't arrive, or the transaction failed but I was still debited."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="min-h-[100px] resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleSubmitDispute}
              disabled={!selectedTx || !reason.trim() || submitting}
              className="w-full sm:w-auto gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
