"use client"

import { useState, useEffect } from "react"
import { Smartphone, CheckCircle2, XCircle, Clock, Package, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Order {
  id: string
  userId: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
  processingStatus?: string
  deliveryDetails?: any
  adminNotes?: string
  processedAt?: string
}

export default function EsimOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [deliveryDetails, setDeliveryDetails] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/esim/orders")
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch {
      toast.error("Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  const handleProcessOrder = async () => {
    if (!selectedOrder) return

    setIsProcessing(true)
    try {
      let parsedDeliveryDetails: any = {}
      if (deliveryDetails.trim()) {
        try {
          parsedDeliveryDetails = JSON.parse(deliveryDetails)
        } catch {
          toast.error("Invalid JSON in delivery details")
          setIsProcessing(false)
          return
        }
      }

      const res = await fetch("/api/admin/esim/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          processingStatus: processingStatus || undefined,
          deliveryDetails: Object.keys(parsedDeliveryDetails).length > 0 ? parsedDeliveryDetails : undefined,
          adminNotes: adminNotes || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Order updated successfully")
        setSelectedOrder(null)
        setProcessingStatus("")
        setDeliveryDetails("")
        setAdminNotes("")
        fetchOrders()
      } else {
        toast.error(data.error || "Failed to update order")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.processingStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    pending: orders.filter(o => o.processingStatus === "pending").length,
    processing: orders.filter(o => o.processingStatus === "processing").length,
    completed: orders.filter(o => o.processingStatus === "completed").length,
    failed: orders.filter(o => o.processingStatus === "failed").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">eSIM Orders</h1>
        <p className="text-muted-foreground">Process and manage eSIM orders manually</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{statusCounts.pending}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{statusCounts.processing}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{statusCounts.completed}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{statusCounts.failed}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Total: {orders.length} orders</CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Processing</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{order.id.slice(0, 8)}...</td>
                      <td className="p-3 text-sm">{order.userId.slice(0, 8)}...</td>
                      <td className="p-3 text-sm">{order.type}</td>
                      <td className="p-3 text-sm">₵{order.amount}</td>
                      <td className="p-3">
                        <Badge variant={order.status === "success" ? "default" : order.status === "pending" ? "secondary" : "destructive"}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {order.processingStatus ? (
                          <Badge variant={order.processingStatus === "completed" ? "default" : order.processingStatus === "processing" ? "default" : order.processingStatus === "failed" ? "destructive" : "secondary"}>
                            {order.processingStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm max-w-xs truncate">{order.description || "-"}</td>
                      <td className="p-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                              Process
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Process Order {order.id?.slice(0, 8)}...</DialogTitle>
                              <CardDescription>
                                Order amount: ₵{order.amount} | Type: {order.type}
                              </CardDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Processing Status</Label>
                                <Select value={processingStatus} onValueChange={setProcessingStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Delivery Details (JSON)</Label>
                                <Textarea
                                  placeholder='{"phoneNumber": "+1234567890", "qrCode": "https://..."}'
                                  value={deliveryDetails}
                                  onChange={(e) => setDeliveryDetails(e.target.value)}
                                  rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                  For phone numbers: {`{phoneNumber, areaCode}`}. For eSIM: {`{qrCode, activationCode}`}.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label>Admin Notes</Label>
                                <Textarea
                                  placeholder="Add notes about this order..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleProcessOrder} disabled={isProcessing}>
                                  {isProcessing ? "Processing..." : "Update Order"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
