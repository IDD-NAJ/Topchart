"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle2, XCircle, Clock, Package, Search, Loader2 } from "lucide-react"
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
  plan_type: string
  bandwidth_gb: number
  duration_days: number
  price: number
  status: string
  proxy_username: string
  proxy_password: string
  proxy_list: string
  expires_at: string
  createdAt: string
  processingStatus?: string
  deliveryDetails?: any
  adminNotes?: string
  processedAt?: string
  user_email?: string
  first_name?: string
  last_name?: string
}

export default function ProxyOrdersPage() {
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
      const res = await fetch("/api/admin/proxy/orders")
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

      const res = await fetch("/api/admin/proxy/orders", {
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
      (order.user_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.plan_type || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.processingStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    pending: orders.filter(o => o.processingStatus === "pending" || !o.processingStatus).length,
    processing: orders.filter(o => o.processingStatus === "processing").length,
    completed: orders.filter(o => o.processingStatus === "completed").length,
    failed: orders.filter(o => o.processingStatus === "failed").length,
  }

  return null
}
