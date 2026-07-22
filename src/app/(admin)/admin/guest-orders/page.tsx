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
import { Receipt, RefreshCw, Search, Download, Eye, TrendingUp } from "lucide-react"

interface GuestOrder {
  id: string
  session_id?: string
  guest_email?: string
  guest_phone?: string
  product_type?: string
  phone_number?: string
  network?: string
  amount?: number
  status?: string
  payment_method?: string
  transaction_reference?: string
  created_at: string
}

interface GuestOrdersResponse {
  success: boolean
  orders: GuestOrder[]
  total?: number
}

function statusVariant(s?: string): "default" | "secondary" | "destructive" | "outline" {
  const v = s?.toLowerCase()
  if (v === "completed" || v === "delivered") return "default"
  if (v === "pending" || v === "processing") return "secondary"
  if (v === "failed" || v === "refunded") return "destructive"
  return "outline"
}

export default function AdminGuestOrdersPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewOrder, setViewOrder] = useState<GuestOrder | null>(null)

  const params = new URLSearchParams()
  if (typeFilter !== "all") params.set("product_type", typeFilter)
  if (statusFilter !== "all") params.set("status", statusFilter)

  const { data, error, isLoading, mutate } = useSWR<GuestOrdersResponse>(
    `/api/admin/guest-orders?${params}`,
    adminFetcher
  )

  const orders = data?.orders || []
  const filtered = orders.filter(
    (o) =>
      !search ||
      o.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.guest_phone?.includes(search) ||
      o.phone_number?.includes(search) ||
      o.transaction_reference?.includes(search)
  )

  const productTypes = Array.from(new Set(orders.map((o) => o.product_type).filter(Boolean)))
  const completedCount = orders.filter((o) => o.status?.toLowerCase() === "completed").length
  const totalRevenue = orders.filter((o) => o.status?.toLowerCase() === "completed").reduce((sum, o) => sum + Number(o.amount ?? 0), 0)

  return (
    <AdminPageShell
      title="Guest Orders"
      description="Orders placed by users without accounts."
      icon={Receipt}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv("guest-orders.csv", filtered.map((o) => ({ ...o })))}>
            <Download className="w-4 h-4 mr-1.5" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Orders" value={data?.total ?? orders.length} icon={Receipt} />
        <StatCard label="Completed" value={completedCount} icon={Receipt} accent />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Email, phone, reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Product" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {productTypes.map((t) => <SelectItem key={t as string} value={t as string} className="capitalize">{t as string}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Receipt} title="Failed to load guest orders" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No guest orders found" description="Guest orders will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{o.guest_email || "—"}</p>
                        {o.guest_phone && <p className="font-mono text-xs text-muted-foreground">{o.guest_phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {o.product_type && <Badge variant="outline" className="text-[10px] capitalize">{o.product_type}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{o.phone_number || "—"}</p>
                        {o.network && <p className="text-xs text-muted-foreground">{o.network}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(o.status)} className="text-[10px] uppercase">{o.status || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {o.amount != null ? formatCurrency(Number(o.amount)) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(o.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOrder(o)}>
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

      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Guest Order Details</DialogTitle></DialogHeader>
          {viewOrder && (
            <div className="space-y-2 text-sm">
              {[
                ["Guest Email", viewOrder.guest_email],
                ["Guest Phone", viewOrder.guest_phone],
                ["Product Type", viewOrder.product_type],
                ["Recipient Phone", viewOrder.phone_number],
                ["Network", viewOrder.network],
                ["Amount", viewOrder.amount != null ? formatCurrency(Number(viewOrder.amount)) : null],
                ["Status", viewOrder.status],
                ["Payment Method", viewOrder.payment_method],
                ["Transaction Ref", viewOrder.transaction_reference],
                ["Date", formatDateTime(viewOrder.created_at)],
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
