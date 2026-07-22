"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Filter,
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
  amount_ghs: string | number
  payment_status: string
  fulfillment_status: string
  datamart_order_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface PanelStats {
  total: number
  pending_payment: number
  paid: number
  fulfilled: number
  failed: number
  total_revenue: number
}

const PRODUCT_LABELS: Record<string, string> = {
  data_bundle: "Data Bundle",
  airtime: "Airtime",
  bill_payment: "Bill Payment",
  esim: "eSIM",
  foreign_number: "Foreign Number",
}

function statusBadge(status: string) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    success: "default",
    fulfilled: "default",
    paid: "default",
    pending: "secondary",
    processing: "secondary",
    failed: "destructive",
    cancelled: "destructive",
    refunded: "outline",
  }
  return map[status] ?? "secondary"
}

export function GuestOrdersPanel() {
  const [orders, setOrders] = useState<GuestOrder[]>([])
  const [stats, setStats] = useState<PanelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<GuestOrder | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(paymentFilter !== "all" ? { payment_status: paymentFilter } : {}),
        ...(fulfillmentFilter !== "all" ? { fulfillment_status: fulfillmentFilter } : {}),
        ...(productFilter !== "all" ? { product_type: productFilter } : {}),
      })
      const res = await fetch(`/api/admin/guest-orders?${params}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setOrders(data.orders ?? [])
      setStats(data.stats ?? null)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error("Failed to load guest orders")
    } finally {
      setLoading(false)
    }
  }, [page, search, paymentFilter, fulfillmentFilter, productFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Debounce search
  useEffect(() => {
    setPage(1)
  }, [search, paymentFilter, fulfillmentFilter, productFilter])

  const handleAction = async (
    orderId: string,
    action: "mark_fulfilled" | "mark_failed" | "cancel"
  ) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/guest-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      toast.success(
        action === "mark_fulfilled"
          ? "Order marked as fulfilled"
          : action === "mark_failed"
          ? "Order marked as failed"
          : "Order cancelled"
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(data.order)
      }
      await fetchOrders()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const exportCsv = () => {
    if (!orders.length) return
    const headers = [
      "Tracking Number",
      "Email",
      "Name",
      "Phone",
      "Product",
      "Amount (GHS)",
      "Payment Status",
      "Fulfillment Status",
      "Paystack Ref",
      "Provider Ref",
      "Created At",
    ]
    const rows = orders.map((o) => [
      o.tracking_number,
      o.customer_email,
      o.customer_name ?? "",
      o.customer_phone ?? "",
      PRODUCT_LABELS[o.product_type] ?? o.product_type,
      Number(o.amount_ghs).toFixed(2),
      o.payment_status,
      o.fulfillment_status,
      o.paystack_reference ?? "",
      o.datamart_order_reference ?? "",
      new Date(o.created_at).toLocaleString(),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `guest-orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Orders", value: stats.total, color: "text-foreground" },
            { label: "Pending Payment", value: stats.pending_payment, color: "text-amber-600" },
            { label: "Paid", value: stats.paid, color: "text-blue-600" },
            { label: "Fulfilled", value: stats.fulfilled, color: "text-green-600" },
            { label: "Failed", value: stats.failed, color: "text-destructive" },
            {
              label: "Revenue",
              value: `GH₵${Number(stats.total_revenue).toFixed(2)}`,
              color: "text-[color:var(--marketing-accent)]",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="w-4 h-4" />
              Guest Orders
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={!orders.length}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search + Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email, tracking, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Fulfillment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="data_bundle">Data Bundle</SelectItem>
                <SelectItem value="airtime">Airtime</SelectItem>
                <SelectItem value="bill_payment">Bill Payment</SelectItem>
                <SelectItem value="esim">eSIM</SelectItem>
                <SelectItem value="foreign_number">Foreign Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-[800px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Tracking</th>
                    <th className="text-left p-3 font-medium">Customer</th>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Payment</th>
                    <th className="text-left p-3 font-medium">Fulfillment</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No guest orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/40 transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-xs font-semibold text-[color:var(--marketing-accent)]">
                            {order.tracking_number}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm whitespace-nowrap">
                            {order.customer_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {order.customer_email}
                          </div>
                          {order.customer_phone && (
                            <div className="text-xs text-muted-foreground">
                              {order.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {PRODUCT_LABELS[order.product_type] ?? order.product_type}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold whitespace-nowrap">
                          GH₵{Number(order.amount_ghs).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Badge variant={statusBadge(order.payment_status)} className="capitalize text-xs">
                            {order.payment_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={statusBadge(order.fulfillment_status)} className="capitalize text-xs">
                            {order.fulfillment_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString("en-GH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedOrder(order)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {order.payment_status === "paid" &&
                              order.fulfillment_status !== "completed" &&
                              order.fulfillment_status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700"
                                  onClick={() => handleAction(order.id, "mark_fulfilled")}
                                  disabled={actionLoading}
                                  title="Mark fulfilled"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                            {order.fulfillment_status !== "cancelled" &&
                              order.fulfillment_status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleAction(order.id, "cancel")}
                                  disabled={actionLoading}
                                  title="Cancel order"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Guest Order —{" "}
              <span className="font-mono text-[color:var(--marketing-accent)]">
                {selectedOrder?.tracking_number}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Full order details and management actions.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant={statusBadge(selectedOrder.payment_status)} className="capitalize">
                  Payment: {selectedOrder.payment_status}
                </Badge>
                <Badge variant={statusBadge(selectedOrder.fulfillment_status)} className="capitalize">
                  Fulfillment: {selectedOrder.fulfillment_status}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Customer</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{selectedOrder.customer_name || "—"}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium break-all">{selectedOrder.customer_email}</span>
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{selectedOrder.customer_phone || "—"}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Product</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {PRODUCT_LABELS[selectedOrder.product_type] ?? selectedOrder.product_type}
                  </span>
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-[color:var(--marketing-accent)]">
                    GH₵{Number(selectedOrder.amount_ghs).toFixed(2)}
                  </span>
                  {Object.entries(selectedOrder.product_details ?? {})
                    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
                    .map(([k, v]) => (
                      <>
                        <span key={`k-${k}`} className="text-muted-foreground capitalize">
                          {k.replace(/_/g, " ")}
                        </span>
                        <span key={`v-${k}`} className="font-medium break-all">
                          {String(v)}
                        </span>
                      </>
                    ))}
                </div>
              </div>

              {/* References */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">References</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Paystack Ref</span>
                  <span className="font-mono text-xs break-all">
                    {selectedOrder.paystack_reference || "—"}
                  </span>
                  <span className="text-muted-foreground">Provider Ref</span>
                  <span className="font-mono text-xs break-all">
                    {selectedOrder.datamart_order_reference || "—"}
                  </span>
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(selectedOrder.updated_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="font-medium text-muted-foreground mb-1">Notes</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {selectedOrder && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={`/track/${selectedOrder.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Track Page
                  </a>
                </Button>
                {selectedOrder.payment_status === "paid" &&
                  selectedOrder.fulfillment_status !== "completed" &&
                  selectedOrder.fulfillment_status !== "cancelled" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction(selectedOrder.id, "mark_fulfilled")}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Mark Fulfilled
                    </Button>
                  )}
                {selectedOrder.fulfillment_status !== "cancelled" &&
                  selectedOrder.fulfillment_status !== "completed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(selectedOrder.id, "cancel")}
                      disabled={actionLoading}
                    >
                      Cancel Order
                    </Button>
                  )}
                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
