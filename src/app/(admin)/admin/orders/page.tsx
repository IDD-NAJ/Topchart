"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, exportToCsv, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ShoppingCart, Search, Download, RefreshCw, CheckCircle2, Eye } from "lucide-react"

interface Order {
  id: string
  user_id: string
  user_email?: string
  phone_number: string
  network: string
  capacity: string
  status: string
  price?: number | null
  order_reference?: string | null
  transaction_reference?: string | null
  processing_method?: string | null
  created_at: string
  updated_at: string
}

interface OrdersResponse {
  success: boolean
  orders: Order[]
  total?: number
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  const v = s?.toLowerCase()
  if (v === "completed" || v === "delivered") return "default"
  if (v === "pending" || v === "processing") return "secondary"
  if (v === "failed" || v === "refunded") return "destructive"
  return "outline"
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    `/api/admin/purchases?${params.toString()}`,
    adminFetcher,
    { refreshInterval: 30_000 }
  )

  const orders = data?.orders || []
  const filtered = orders.filter((o) =>
    !search ||
    o.phone_number?.includes(search) ||
    o.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_reference?.includes(search) ||
    o.network?.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = async (id: string) => {
    setConfirming(id)
    try {
      const res = await adminMutate("/api/admin/purchases", "POST", { transactionId: id })
      if (res.success) {
        toast.success("Order confirmed successfully")
        mutate()
      } else {
        toast.error(res.error || "Failed to confirm order")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setConfirming(null)
    }
  }

  return (
    <AdminPageShell
      title="Data Orders"
      description="Monitor and manage all data bundle orders."
      icon={ShoppingCart}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => exportToCsv(filtered, "orders")}>
            <Download className="w-4 h-4 mr-1.5" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
        </>
      }
    >
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Phone, email, ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
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
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState icon={ShoppingCart} title="Failed to load orders" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders found" description="Orders will appear here as they come in." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{order.phone_number}</p>
                        {order.user_email && <p className="text-xs text-muted-foreground">{order.user_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.network}</TableCell>
                    <TableCell>{order.capacity}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)} className="text-[10px] uppercase">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.price != null ? formatCurrency(Number(order.price)) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDateTime(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewOrder(order)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {(order.status?.toLowerCase() === "pending" || order.status?.toLowerCase() === "processing") && (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleConfirm(order.id)}
                            disabled={confirming === order.id}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {confirming === order.id ? "..." : "Confirm"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Full information for this order.</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-3 text-sm">
              {[
                ["Phone", viewOrder.phone_number],
                ["Network", viewOrder.network],
                ["Bundle / Capacity", viewOrder.capacity],
                ["Status", viewOrder.status],
                ["Price", viewOrder.price != null ? `GH₵ ${Number(viewOrder.price).toFixed(2)}` : "—"],
                ["Order Reference", viewOrder.order_reference || "—"],
                ["Transaction Reference", viewOrder.transaction_reference || "—"],
                ["Processing Method", viewOrder.processing_method || "—"],
                ["User Email", viewOrder.user_email || "—"],
                ["Created", formatDateTime(viewOrder.created_at)],
                ["Updated", formatDateTime(viewOrder.updated_at)],
              ].map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium text-muted-foreground">{key}</span>
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
