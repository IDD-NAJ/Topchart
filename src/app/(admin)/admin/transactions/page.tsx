"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, exportToCsv, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Search, Download, RefreshCw, Eye, ArrowLeftRight, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react"

interface AdminTransaction {
  id: string
  user_id: string
  type: string
  amount: number
  status: string
  reference: string
  description: string | null
  currency: string | null
  metadata: any
  created_at: string
  user_email: string | null
  user_first_name: string | null
  user_last_name: string | null
}

interface TransactionsResponse {
  success: boolean
  transactions: AdminTransaction[]
  total: number
}

const PAGE_SIZE = 25

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  const v = s?.toUpperCase()
  if (v === "SUCCESS" || v === "COMPLETED") return "default"
  if (v === "PENDING"  || v === "PROCESSING") return "secondary"
  if (v === "FAILED"   || v === "CANCELLED")  return "destructive"
  return "outline"
}

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("")
  const [query, setQuery]   = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType]     = useState("all")
  const [page, setPage]     = useState(1)
  const [detail, setDetail] = useState<AdminTransaction | null>(null)
  const [actionLoading, setActionLoading] = useState<null | "verify" | "cancel">(null)

  const params = new URLSearchParams()
  if (query)          params.set("q", query)
  if (status !== "all") params.set("status", status)
  if (type   !== "all") params.set("type", type)
  params.set("limit",  String(PAGE_SIZE))
  params.set("offset", String((page - 1) * PAGE_SIZE))

  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    `/api/admin/transactions?${params}`,
    adminFetcher
  )

  const txns  = data?.transactions ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function runAction(action: "verify" | "cancel") {
    if (!detail) return
    setActionLoading(action)
    try {
      const res = await fetch(`/api/admin/transactions/${detail.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message || (action === "verify" ? "Transaction verified" : "Transaction cancelled"))
        setDetail(null)
        mutate()
      } else {
        toast.error(result.error || "Action failed")
      }
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setActionLoading(null)
    }
  }

  const successCount = txns.filter((t) => t.status?.toUpperCase() === "SUCCESS" || t.status?.toUpperCase() === "COMPLETED").length
  const pendingCount = txns.filter((t) => t.status?.toUpperCase() === "PENDING").length
  const revenue      = txns
    .filter((t) => t.status?.toUpperCase() === "SUCCESS" || t.status?.toUpperCase() === "COMPLETED")
    .reduce((s, t) => s + Number(t.amount ?? 0), 0)

  return (
    <AdminPageShell
      title="Transactions"
      description="All platform transactions across users"
      icon={ArrowLeftRight}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => {
              if (!txns.length) { toast.info("No transactions to export"); return }
              exportToCsv(`transactions-${new Date().toISOString().slice(0, 10)}.csv`,
                txns.map((t) => ({ id: t.id, reference: t.reference, user: t.user_email || t.user_id, type: t.type, amount: t.amount, status: t.status, created: t.created_at })))
              toast.success(`Exported ${txns.length} transactions`)
            }}
          >
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total"     value={isLoading ? <Skeleton className="h-8 w-16" /> : total.toLocaleString()}          icon={ArrowLeftRight} />
        <StatCard label="Successful" value={isLoading ? <Skeleton className="h-8 w-16" /> : successCount.toLocaleString()} icon={CheckCircle2}   accent />
        <StatCard label="Pending"   value={isLoading ? <Skeleton className="h-8 w-16" /> : pendingCount.toLocaleString()}   icon={Clock} />
        <StatCard label="Revenue"   value={isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(revenue)}         icon={TrendingUp}     accent />
      </div>

      {/* Table */}
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Reference, email..."
                  className="pl-8 h-9 w-56"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="h-9">Search</Button>
            </form>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["success","pending","failed","cancelled","processing"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-32"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["data","airtime","wallet","bill","verification","referral"].map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            Page {page}/{totalPages} — {total.toLocaleString()} total
          </p>
        </AdminTableHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive py-10">
                    {(error as any).message || "Failed to load transactions"}
                  </TableCell>
                </TableRow>
              ) : txns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState icon={ArrowLeftRight} title="No transactions found" description="Try adjusting your filters" />
                  </TableCell>
                </TableRow>
              ) : (
                txns.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">{t.reference || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {t.user_email ? (
                        <div>
                          <p className="font-medium text-foreground">{t.user_first_name} {t.user_last_name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{t.user_email}</p>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">{t.user_id?.slice(0, 8)}…</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{t.type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{formatCurrency(Number(t.amount ?? 0))}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)} className="text-xs capitalize">{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                      {t.description || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(t.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail(t)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </AdminTableShell>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">{detail?.reference || detail?.id}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ["ID",          detail.id],
                  ["Type",        detail.type],
                  ["Amount",      formatCurrency(Number(detail.amount))],
                  ["Status",      detail.status],
                  ["Currency",    detail.currency ?? "GHS"],
                  ["User",        detail.user_email ?? detail.user_id],
                  ["Description", detail.description ?? "—"],
                  ["Date",        formatDateTime(detail.created_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
                    <p className="font-medium break-all">{value}</p>
                  </div>
                ))}
              </div>
              {detail.metadata && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Metadata</p>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-40">{JSON.stringify(detail.metadata, null, 2)}</pre>
                </div>
              )}

              {(() => {
                const s = detail.status?.toUpperCase()
                const isSettled = s === "SUCCESS" || s === "COMPLETED"
                const canCancel = s === "PENDING" || s === "PROCESSING"
                if (isSettled) return null
                return (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      size="sm"
                      onClick={() => runAction("verify")}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "verify" ? (
                        <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      )}
                      Verify with Paystack
                    </Button>
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => runAction("cancel")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === "cancel" ? (
                          <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1.5" />
                        )}
                        Cancel Transaction
                      </Button>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
