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
  ShoppingCart, Search, Download, RefreshCw, Eye, Pencil, Trash2,
  TrendingUp, CheckCircle2, Clock, XCircle,
} from "lucide-react"

interface Order {
  id: string
  phone_number: string
  network: string
  capacity: string
  price?: number | null
  status: string
  order_reference?: string | null
  transaction_reference?: string | null
  processing_method?: string | null
  gateway?: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
  user_id?: string | null
  user_email?: string | null
  user_first_name?: string | null
  user_last_name?: string | null
  source?: string
}

interface OrdersResponse {
  success: boolean
  orders: Order[]
  total: number
  stats?: {
    total: number
    completed: number
    pending: number
    failed: number
    revenue: number
  }
}

const STATUS_OPTIONS = ["pending", "processing", "completed", "failed", "cancelled", "refunded"]

function statusVariant(s?: string | null): "default" | "secondary" | "destructive" | "outline" {
  const v = s?.toLowerCase()
  if (v === "completed" || v === "delivered") return "default"
  if (v === "pending" || v === "processing") return "secondary"
  if (v === "failed" || v === "cancelled" || v === "refunded") return "destructive"
  return "outline"
}

function StatusDot({ status }: { status?: string | null }) {
  const v = status?.toLowerCase()
  const color =
    v === "completed" ? "bg-green-500" :
    v === "pending"   ? "bg-yellow-500" :
    v === "processing"? "bg-blue-500" :
    v === "failed"    ? "bg-red-500" :
    v === "cancelled" ? "bg-red-400" :
                        "bg-muted-foreground"
  return <span className={`inline-block h-2 w-2 rounded-full ${color} mr-1.5`} />
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState({ status: "", error_message: "" })

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)
  if (networkFilter !== "all") params.set("network", networkFilter)
  params.set("page", String(page))
  params.set("limit", "50")

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    `/api/admin/orders?${params}`,
    adminFetcher,
    { refreshInterval: 30_000 }
  )

  const orders = data?.orders ?? []
  const stats  = data?.stats

  const filtered = orders.filter((o) =>
    !search ||
    o.phone_number?.includes(search) ||
    o.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_reference?.includes(search) ||
    o.transaction_reference?.includes(search) ||
    o.network?.toLowerCase().includes(search.toLowerCase())
  )

  const networks = Array.from(new Set(orders.map((o) => o.network).filter(Boolean)))

  function openEdit(o: Order) {
    setEditForm({ status: o.status, error_message: o.error_message ?? "" })
    setEditOrder(o)
  }

  async function handleSave() {
    if (!editOrder) return
    setSaving(true)
    try {
      await adminMutate("/api/admin/orders", "PATCH", {
        id: editOrder.id,
        status: editForm.status,
        error_message: editForm.error_message || null,
      })
      toast.success("Order updated")
      setEditOrder(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminMutate("/api/admin/orders", "DELETE", { id: deleteId })
      toast.success("Order deleted")
      setDeleteId(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminPageShell
      title="Orders"
      description="All data orders from the platform"
      icon={ShoppingCart}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => exportToCsv("orders.csv", filtered.map((o) => ({
              id: o.id, phone: o.phone_number, network: o.network, capacity: o.capacity,
              price: o.price, status: o.status, reference: o.order_reference,
              user: o.user_email, created: o.created_at,
            })))}
          >
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Orders"  value={stats ? stats.total.toLocaleString()     : <Skeleton className="h-8 w-20" />} icon={ShoppingCart} />
        <StatCard label="Completed"     value={stats ? stats.completed.toLocaleString() : <Skeleton className="h-8 w-16" />} icon={CheckCircle2} accent />
        <StatCard label="Pending"       value={stats ? stats.pending.toLocaleString()   : <Skeleton className="h-8 w-16" />} icon={Clock} />
        <StatCard label="Revenue (GHS)" value={stats ? formatCurrency(stats.revenue)    : <Skeleton className="h-8 w-24" />} icon={TrendingUp} accent />
      </div>

      {/* Table */}
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search phone, email, reference..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-8 h-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={(v) => { setNetworkFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All networks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All networks</SelectItem>
                {networks.map((n) => <SelectItem key={n} value={n!}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {filtered.length} of {data?.total ?? "..."} orders
          </p>
        </AdminTableHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-destructive py-10">
                    {(error as any).message || "Failed to load orders"}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState icon={ShoppingCart} title="No orders found" description="Try adjusting your filters" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id} className="group">
                    <TableCell className="font-mono text-sm">{o.phone_number}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs uppercase">{o.network}</span>
                    </TableCell>
                    <TableCell className="text-sm">{o.capacity}</TableCell>
                    <TableCell className="text-sm font-semibold">
                      {o.price != null ? formatCurrency(Number(o.price)) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(o.status)} className="capitalize text-xs">
                        <StatusDot status={o.status} />
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {o.order_reference ?? o.transaction_reference ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.user_email ? (
                        <div>
                          <p className="font-medium text-foreground">{o.user_first_name} {o.user_last_name}</p>
                          <p className="truncate max-w-[140px]">{o.user_email}</p>
                        </div>
                      ) : "Guest"}
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(o.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">{viewOrder?.id}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Phone",       viewOrder.phone_number],
                ["Network",     viewOrder.network],
                ["Capacity",    viewOrder.capacity],
                ["Price",       viewOrder.price != null ? formatCurrency(Number(viewOrder.price)) : "—"],
                ["Status",      viewOrder.status],
                ["Gateway",     viewOrder.gateway ?? "—"],
                ["Processing",  viewOrder.processing_method ?? "—"],
                ["Order Ref",   viewOrder.order_reference ?? "—"],
                ["TX Ref",      viewOrder.transaction_reference ?? "—"],
                ["User",        viewOrder.user_email ?? "Guest"],
                ["Created",     formatDateTime(viewOrder.created_at)],
                ["Updated",     formatDateTime(viewOrder.updated_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-medium break-all">{value}</p>
                </div>
              ))}
              {viewOrder.error_message && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Error</p>
                  <p className="text-destructive text-xs">{viewOrder.error_message}</p>
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
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription className="font-mono text-xs">{editOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Error Message (optional)</Label>
              <Textarea
                value={editForm.error_message}
                onChange={(e) => setEditForm((f) => ({ ...f, error_message: e.target.value }))}
                rows={3}
                placeholder="Leave blank to clear"
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

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this order from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  )
}
