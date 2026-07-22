"use client"

import React, { useState } from "react"
import useSWR from "swr"
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CreditCard, RefreshCw, Search, Download, Eye, TrendingUp, DollarSign } from "lucide-react"

interface BillPayment {
  id: string
  user_id?: string
  user_email?: string
  service_type?: string
  bill_type?: string
  recipient?: string
  account_number?: string
  amount?: number
  status?: string
  reference?: string
  provider?: string
  created_at: string
}

interface BillsResponse {
  success: boolean
  bills?: BillPayment[]
  payments?: BillPayment[]
  data?: BillPayment[]
  total?: number
}

function statusVariant(s?: string): "default" | "secondary" | "destructive" | "outline" {
  const v = s?.toLowerCase()
  if (v === "completed" || v === "success" || v === "paid") return "default"
  if (v === "pending" || v === "processing") return "secondary"
  if (v === "failed" || v === "reversed") return "destructive"
  return "outline"
}

export default function AdminBillingPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [viewItem, setViewItem] = useState<BillPayment | null>(null)

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)
  if (typeFilter !== "all") params.set("bill_type", typeFilter)

  const { data, error, isLoading, mutate } = useSWR<BillsResponse>(
    `/api/admin/bills?${params}`,
    adminFetcher
  )

  const bills = data?.bills || data?.payments || data?.data || []
  const filtered = bills.filter(
    (b) =>
      !search ||
      b.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      b.account_number?.includes(search) ||
      b.reference?.includes(search) ||
      b.recipient?.toLowerCase().includes(search.toLowerCase())
  )

  const billTypes = Array.from(new Set(bills.map((b) => b.bill_type || b.service_type).filter(Boolean)))
  const successCount = bills.filter((b) => ["completed", "success", "paid"].includes(b.status?.toLowerCase() || "")).length
  const totalRevenue = bills.filter((b) => ["completed", "success", "paid"].includes(b.status?.toLowerCase() || "")).reduce((s, b) => s + Number(b.amount ?? 0), 0)

  return (
    <AdminPageShell
      title="Billing & Payments"
      description="Track all bill payments: airtime, utilities, and other services."
      icon={CreditCard}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv("billing.csv", filtered.map((b) => ({ ...b })))}>
            <Download className="w-4 h-4 mr-1.5" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Bills" value={data?.total ?? bills.length} icon={CreditCard} />
        <StatCard label="Successful" value={successCount} icon={CreditCard} accent />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <StatCard label="Failed" value={bills.filter((b) => b.status?.toLowerCase() === "failed").length} icon={TrendingUp} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Email, account, reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Bill Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {billTypes.map((t) => <SelectItem key={t as string} value={t as string} className="capitalize">{t as string}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} bill{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={CreditCard} title="Failed to load bills" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No billing records found" description="Bill payments will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account / Recipient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm">{b.user_email || b.user_id?.slice(0, 12) + "..."}</TableCell>
                    <TableCell>
                      {(b.bill_type || b.service_type) && (
                        <Badge variant="outline" className="text-[10px] capitalize">{b.bill_type || b.service_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{b.account_number || "—"}</p>
                        {b.recipient && <p className="text-xs text-muted-foreground">{b.recipient}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.provider || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(b.status)} className="text-[10px] capitalize">{b.status || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {b.amount != null ? formatCurrency(Number(b.amount)) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(b.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(b)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bill Payment Details</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 text-sm">
              {[
                ["User", viewItem.user_email],
                ["Type", viewItem.bill_type || viewItem.service_type],
                ["Account Number", viewItem.account_number],
                ["Recipient", viewItem.recipient],
                ["Provider", viewItem.provider],
                ["Amount", viewItem.amount != null ? formatCurrency(Number(viewItem.amount)) : null],
                ["Status", viewItem.status],
                ["Reference", viewItem.reference],
                ["Date", formatDateTime(viewItem.created_at)],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label as string} className="flex justify-between border-b border-border/50 pb-1.5 last:border-0">
                  <span className="font-medium text-muted-foreground">{label}</span>
                  <span className="font-mono text-right max-w-[55%] break-all">{val}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
