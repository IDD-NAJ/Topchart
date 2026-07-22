"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, exportToCsv, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Download, RefreshCw, Eye } from "lucide-react"

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
  limit: number
  offset: number
}

const PAGE_SIZE = 25

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toUpperCase()
  if (s === "SUCCESS" || s === "COMPLETED") return "default"
  if (s === "PENDING" || s === "PROCESSING") return "secondary"
  if (s === "FAILED" || s === "CANCELLED") return "destructive"
  return "outline"
}

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<AdminTransaction | null>(null)

  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (status !== "all") params.set("status", status)
  if (type !== "all") params.set("type", type)
  params.set("limit", String(PAGE_SIZE))
  params.set("offset", String((page - 1) * PAGE_SIZE))

  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    `/api/admin/transactions?${params.toString()}`,
    adminFetcher
  )

  const transactions = data?.transactions || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  const handleExport = () => {
    if (!transactions.length) {
      toast.info("No transactions to export")
      return
    }
    exportToCsv(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      transactions.map((t) => ({
        id: t.id,
        reference: t.reference,
        user: t.user_email || t.user_id,
        type: t.type,
        amount: t.amount,
        currency: t.currency || "GHS",
        status: t.status,
        description: t.description || "",
        created_at: t.created_at,
      }))
    )
    toast.success(`Exported ${transactions.length} transactions`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${total.toLocaleString()} transactions` : "Loading transactions..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, source or email..."
              className="pl-9"
              aria-label="Search transactions"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32" aria-label="Filter by type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">Failed to load transactions: {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !error && transactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && transactions.length > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="max-w-40 truncate font-mono text-xs">{tx.reference || tx.id}</TableCell>
                    <TableCell>
                      <p className="max-w-48 truncate text-sm">{tx.user_email || "—"}</p>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{tx.type}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(Number(tx.amount), tx.currency || "GHS")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(tx.status)}>{tx.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(tx.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(tx)} aria-label="View transaction details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {transactions.map((tx) => (
              <Card key={tx.id} className="cursor-pointer" onClick={() => setDetail(tx)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{tx.user_email || tx.reference || "—"}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{tx.reference}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {tx.type} · {formatDateTime(tx.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold">{formatCurrency(Number(tx.amount), tx.currency || "GHS")}</span>
                      <Badge variant={statusVariant(tx.status)} className="text-xs">
                        {tx.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">{detail?.reference || detail?.id}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-3 text-sm">
              {[
                ["User", detail.user_email || detail.user_id || "—"],
                ["Name", `${detail.user_first_name || ""} ${detail.user_last_name || ""}`.trim() || "—"],
                ["Type", detail.type],
                ["Amount", formatCurrency(Number(detail.amount), detail.currency || "GHS")],
                ["Status", detail.status.toUpperCase()],
                ["Description", detail.description || "—"],
                ["Date", formatDateTime(detail.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-border pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium capitalize text-foreground">{value}</span>
                </div>
              ))}
              {detail.metadata && (
                <div>
                  <p className="mb-1 text-muted-foreground">Metadata</p>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {JSON.stringify(detail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
