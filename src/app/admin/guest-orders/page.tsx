export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Receipt,
  Search,
  RefreshCw,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface GuestOrder {
  id: string
  tracking_number: string
  paystack_reference: string | null
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  product_type: string
  product_details: Record<string, unknown>
  amount_ghs: number
  payment_status: string
  fulfillment_status: string
  datamart_order_reference: string | null
  datamart_order_status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  paymentPending: number
  paymentSuccess: number
  fulfillmentPending: number
  fulfillmentCompleted: number
  fulfillmentFailed: number
  revenueGhs: number
  todayCount: number
  todayRevenue: number
}

const PRODUCT_LABELS: Record<string, string> = {
  data_bundle: "Data Bundle",
  airtime: "Airtime",
  bill_payment: "Bill Payment",
  esim: "eSIM",
  foreign_number: "Foreign Number",
}

function paymentBadge(status: string) {
  switch (status) {
    case "success":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">Paid</Badge>
    case "pending":
      return <Badge variant="secondary">Pending</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    case "abandoned":
      return <Badge variant="outline">Abandoned</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function fulfillmentBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">Completed</Badge>
    case "processing":
      return <Badge className="bg-amber-500 hover:bg-amber-500">Processing</Badge>
    case "pending":
      return <Badge variant="secondary">Pending</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AdminGuestOrdersPage() {
  const [orders, setOrders] = useState<GuestOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [selected, setSelected] = useState<GuestOrder | null>(null)
  const [editNotes, setEditNotes] = useState("")
  const [editFulfillment, setEditFulfillment] = useState("")
  const [saving, setSaving] = useState(false)
  const [refundTarget, setRefundTarget] = useState<GuestOrder | null>(null)
  const [refunding, setRefunding] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guest-orders?stats=1", { credentials: "include", cache: "no-store" })
      const data = await res.json()
      if (data.success) setStats(data.stats)
    } catch {
      // ignore
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (paymentFilter !== "all") params.set("payment_status", paymentFilter)
      if (fulfillmentFilter !== "all") params.set("fulfillment_status", fulfillmentFilter)
      if (productFilter !== "all") params.set("product_type", productFilter)

      const res = await fetch(`/api/admin/guest-orders?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      } else {
        toast.error(data.error || "Failed to load orders")
      }
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [page, search, paymentFilter, fulfillmentFilter, productFilter])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const openDetail = (order: GuestOrder) => {
    setSelected(order)
    setEditNotes(order.notes || "")
    setEditFulfillment(order.fulfillment_status)
  }

  const saveOrder = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/guest-orders/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fulfillment_status: editFulfillment, notes: editNotes }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Order updated")
        setSelected(null)
        loadOrders()
        loadStats()
      } else {
        toast.error(data.error || "Update failed")
      }
    } catch {
      toast.error("Update failed")
    } finally {
      setSaving(false)
    }
  }

  const doRefund = async () => {
    if (!refundTarget) return
    setRefunding(true)
    try {
      const res = await fetch(`/api/admin/guest-orders/${refundTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "refund" }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Refund initiated")
        setRefundTarget(null)
        loadOrders()
        loadStats()
      } else {
        toast.error(data.error || "Refund failed")
      }
    } catch {
      toast.error("Refund failed")
    } finally {
      setRefunding(false)
    }
  }

  const exportCsv = () => {
    const header = [
      "Tracking",
      "Paystack Ref",
      "Customer",
      "Email",
      "Phone",
      "Product",
      "Amount (GHS)",
      "Payment",
      "Fulfillment",
      "Created",
    ]
    const rows = orders.map((o) => [
      o.tracking_number,
      o.paystack_reference || "",
      o.customer_name || "",
      o.customer_email,
      o.customer_phone || "",
      PRODUCT_LABELS[o.product_type] || o.product_type,
      Number(o.amount_ghs).toFixed(2),
      o.payment_status,
      o.fulfillment_status,
      new Date(o.created_at).toISOString(),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `guest-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const applySearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-[color:var(--marketing-accent)]" />
            Guest Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Orders placed without an account via the public checkout
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadOrders(); loadStats() }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={orders.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.todayCount} today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Revenue (Paid)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">GH₵{stats.revenueGhs.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">GH₵{stats.todayRevenue.toFixed(2)} today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Awaiting Fulfillment</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.fulfillmentPending}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid, not delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.fulfillmentCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.fulfillmentFailed} failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1 block">Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Tracking, email, or name"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) applySearch()
                  }}
                />
                <Button size="icon" onClick={applySearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-[140px]">
              <Label className="text-xs mb-1 block">Payment</Label>
              <Select value={paymentFilter} onValueChange={(v) => { setPage(1); setPaymentFilter(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Label className="text-xs mb-1 block">Fulfillment</Label>
              <Select value={fulfillmentFilter} onValueChange={(v) => { setPage(1); setFulfillmentFilter(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Label className="text-xs mb-1 block">Product</Label>
              <Select value={productFilter} onValueChange={(v) => { setPage(1); setProductFilter(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="data_bundle">Data Bundle</SelectItem>
                  <SelectItem value="airtime">Airtime</SelectItem>
                  <SelectItem value="bill_payment">Bill Payment</SelectItem>
                  <SelectItem value="esim">eSIM</SelectItem>
                  <SelectItem value="foreign_number">Foreign Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">Tracking</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Fulfillment</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No guest orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[color:var(--marketing-accent)]">
                        {o.tracking_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">{PRODUCT_LABELS[o.product_type] || o.product_type}</td>
                      <td className="px-4 py-3 text-right font-semibold">GH₵{Number(o.amount_ghs).toFixed(2)}</td>
                      <td className="px-4 py-3">{paymentBadge(o.payment_status)}</td>
                      <td className="px-4 py-3">{fulfillmentBadge(o.fulfillment_status)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}<br />
                        {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} total orders</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-[color:var(--marketing-accent)]">
              {selected?.tracking_number}
            </DialogTitle>
            <DialogDescription>Guest order details and management</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{selected.customer_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{selected.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selected.customer_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">GH₵{Number(selected.amount_ghs).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-medium">{PRODUCT_LABELS[selected.product_type] || selected.product_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paystack Ref</p>
                  <p className="font-mono text-xs break-all">{selected.paystack_reference || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <div className="mt-1">{paymentBadge(selected.payment_status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">DataMart Status</p>
                  <p className="font-medium">{selected.datamart_order_status || "—"}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Order Details</p>
                <div className="space-y-1 text-sm">
                  {Object.entries(selected.product_details || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="font-medium text-right break-all">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Fulfillment Status</Label>
                <Select value={editFulfillment} onValueChange={setEditFulfillment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Admin Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Internal notes about this order"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                if (selected) setRefundTarget(selected)
                setSelected(null)
              }}
              disabled={!selected || selected.payment_status !== "success"}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Refund
            </Button>
            <Button onClick={saveOrder} disabled={saving}>
              {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund confirm */}
      <AlertDialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will initiate a Paystack refund of GH₵{refundTarget ? Number(refundTarget.amount_ghs).toFixed(2) : "0.00"} for
              order {refundTarget?.tracking_number}. The order will be marked as failed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doRefund} disabled={refunding} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {refunding ? "Processing..." : "Confirm Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
