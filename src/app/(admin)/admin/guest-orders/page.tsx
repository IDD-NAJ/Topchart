"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, exportToCsv, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Receipt, Search, Download, RefreshCw, Eye, Pencil, TrendingUp,
  CheckCircle2, Clock, Users,
} from "lucide-react"

interface GuestOrder {
  id: string
  tracking_number: string
  paystack_reference?: string | null
  customer_email: string
  customer_name?: string | null
  customer_phone?: string | null
  product_type: string
  product_details?: Record<string, unknown> | null
  amount_ghs: number
  payment_status: string
  fulfillment_status: string
  datamart_order_reference?: string | null
  datamart_order_status?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

interface GuestOrdersResponse {
  success: boolean
  orders: GuestOrder[]
  total: number
  stats?: {
    total: number
    completed: number
    pending: number
    revenue: number
  }
}

const PAYMENT_STATUSES     = ["pending", "success", "failed", "abandoned"]
const FULFILLMENT_STATUSES = ["pending", "processing", "completed", "failed"]
const PRODUCT_TYPES        = ["data_bundle", "bill_payment", "foreign_number"]

function paymentVariant(s?: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "success")   return "default"
  if (s === "pending")   return "secondary"
  if (s === "failed" || s === "abandoned") return "destructive"
  return "outline"
}

function fulfillVariant(s?: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed")  return "default"
  if (s === "processing") return "secondary"
  if (s === "failed")     return "destructive"
  return "outline"
}

export default function AdminGuestOrdersPage() {
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter]     = useState("all")
  const [fulfillFilter, setFulfillFilter]     = useState("all")
  const [typeFilter, setTypeFilter]           = useState("all")
  const [page, setPage]                       = useState(1)
  const [viewOrder, setViewOrder]             = useState<GuestOrder | null>(null)
  const [editOrder, setEditOrder]             = useState<GuestOrder | null>(null)
  const [editForm, setEditForm]               = useState({
    payment_status: "", fulfillment_status: "", notes: "", datamart_order_status: "",
  })
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (paymentFilter !== "all") params.set("payment_status", paymentFilter)
  if (fulfillFilter !== "all") params.set("fulfillment_status", fulfillFilter)
  if (typeFilter    !== "all") params.set("product_type", typeFilter)
  if (search)                  params.set("search", search)
  params.set("page",  String(page))
  params.set("limit", "50")

  const { data, error, isLoading, mutate } = useSWR<GuestOrdersResponse>(
    `/api/admin/guest-orders?${params}`,
    adminFetcher,
    { refreshInterval: 30_000 }
  )

  const orders = data?.orders ?? []

  // Local client filter for immediate feedback
  const filtered = orders.filter((o) =>
    !search ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone?.includes(search) ||
    o.tracking_number?.includes(search.toUpperCase()) ||
    o.paystack_reference?.includes(search)
  )

  const completed = orders.filter((o) => o.fulfillment_status === "completed").length
  const pending   = orders.filter((o) => o.payment_status === "pending").length
  const revenue   = orders.filter((o) => o.payment_status === "success").reduce((s, o) => s + Number(o.amount_ghs ?? 0), 0)

  function openEdit(o: GuestOrder) {
    setEditForm({
      payment_status:      o.payment_status,
      fulfillment_status:  o.fulfillment_status,
      notes:               o.notes ?? "",
      datamart_order_status: o.datamart_order_status ?? "",
    })
    setEditOrder(o)
  }

  async function handleSave() {
    if (!editOrder) return
    setSaving(true)
    try {
      await adminMutate(`/api/admin/guest-orders/${editOrder.id}`, "PATCH", {
        payment_status:        editForm.payment_status     || undefined,
        fulfillment_status:    editForm.fulfillment_status || undefined,
        notes:                 editForm.notes              || undefined,
        datamart_order_status: editForm.datamart_order_status || undefined,
      })
      toast.success("Guest order updated")
      setEditOrder(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleRefund(o: GuestOrder) {
    if (!confirm(`Refund ${formatCurrency(Number(o.amount_ghs))} for ${o.customer_email}?`)) return
    try {
      await adminMutate(`/api/admin/guest-orders/${o.id}`, "PATCH", { action: "refund" })
      toast.success("Refund initiated")
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Refund failed")
    }
  }

  return (
    <AdminPageShell
      title="Guest Orders"
      description="Orders placed without a registered account"
      icon={Receipt}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => exportToCsv("guest-orders.csv", filtered.map((o) => ({
              tracking: o.tracking_number, email: o.customer_email, phone: o.customer_phone,
              product: o.product_type, amount: o.amount_ghs, payment: o.payment_status,
              fulfillment: o.fulfillment_status, created: o.created_at,
            })))}
          >
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Orders" value={data ? (data.total ?? orders.length).toLocaleString() : <Skeleton className="h-8 w-16" />} icon={Receipt} />
        <StatCard label="Completed"    value={isLoading ? <Skeleton className="h-8 w-16" /> : completed.toLocaleString()} icon={CheckCircle2} accent />
        <StatCard label="Pending Pay"  value={isLoading ? <Skeleton className="h-8 w-16" /> : pending.toLocaleString()}   icon={Clock} />
        <StatCard label="Revenue"      value={isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(revenue)}    icon={TrendingUp} accent />
      </div>

      {/* Table */}
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email, phone, tracking..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-8 h-9 w-60"
              />
            </div>
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fulfillFilter} onValueChange={(v) => { setFulfillFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Fulfillment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fulfillment</SelectItem>
                {FULFILLMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Product type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {PRODUCT_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">{filtered.length} orders</p>
        </AdminTableHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    {(error as any).message || "Failed to load guest orders"}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState icon={Receipt} title="No guest orders found" description="Try adjusting your filters" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id} className="group">
                    <TableCell className="font-mono text-xs font-semibold">{o.tracking_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{o.customer_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                        {o.customer_phone && <p className="text-xs text-muted-foreground">{o.customer_phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted rounded px-2 py-0.5 font-medium">
                        {o.product_type.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{formatCurrency(Number(o.amount_ghs))}</TableCell>
                    <TableCell>
                      <Badge variant={paymentVariant(o.payment_status)} className="capitalize text-xs">
                        {o.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fulfillVariant(o.fulfillment_status)} className="capitalize text-xs">
                        {o.fulfillment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(o.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewOrder(o)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {o.payment_status === "success" && o.paystack_reference && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleRefund(o)}
                          >
                            Refund
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {(data?.total ?? 0) > 50 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Page {page}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={filtered.length < 50} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </AdminTableShell>

      {/* View Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Guest Order — {viewOrder?.tracking_number}</DialogTitle>
            <DialogDescription className="font-mono text-xs">{viewOrder?.id}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ["Customer",    viewOrder.customer_name ?? "—"],
                  ["Email",       viewOrder.customer_email],
                  ["Phone",       viewOrder.customer_phone ?? "—"],
                  ["Product",     viewOrder.product_type.replace(/_/g, " ")],
                  ["Amount",      formatCurrency(Number(viewOrder.amount_ghs))],
                  ["Payment",     viewOrder.payment_status],
                  ["Fulfillment", viewOrder.fulfillment_status],
                  ["Paystack Ref",viewOrder.paystack_reference ?? "—"],
                  ["DM Ref",      viewOrder.datamart_order_reference ?? "—"],
                  ["DM Status",   viewOrder.datamart_order_status ?? "—"],
                  ["Created",     formatDateTime(viewOrder.created_at)],
                  ["Updated",     formatDateTime(viewOrder.updated_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
                    <p className="font-medium break-all">{value}</p>
                  </div>
                ))}
              </div>
              {viewOrder.product_details && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Product Details</p>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-36">{JSON.stringify(viewOrder.product_details, null, 2)}</pre>
                </div>
              )}
              {viewOrder.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Notes</p>
                  <p className="text-xs">{viewOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOrder} onOpenChange={() => setEditOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Guest Order</DialogTitle>
            <DialogDescription>{editOrder?.tracking_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select value={editForm.payment_status} onValueChange={(v) => setEditForm((f) => ({ ...f, payment_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fulfillment Status</Label>
              <Select value={editForm.fulfillment_status} onValueChange={(v) => setEditForm((f) => ({ ...f, fulfillment_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Datamart Order Status</Label>
              <Input
                value={editForm.datamart_order_status}
                onChange={(e) => setEditForm((f) => ({ ...f, datamart_order_status: e.target.value }))}
                placeholder="e.g. PENDING, COMPLETED"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Admin Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
