"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
  ExternalLink,
  Package,
  Wifi,
  Phone,
  FileText,
  Globe,
  SmartphoneIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderData {
  tracking_number: string
  product_type: string
  product_details: Record<string, unknown>
  amount_ghs: number
  payment_status: string
  fulfillment_status: string
  datamart_order_status: string | null
  created_at: string
  updated_at: string
  customer_email_masked: string
}

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  data_bundle: <Wifi className="w-5 h-5" />,
  airtime: <Phone className="w-5 h-5" />,
  bill_payment: <FileText className="w-5 h-5" />,
  esim: <Globe className="w-5 h-5" />,
  foreign_number: <SmartphoneIcon className="w-5 h-5" />,
}

const PRODUCT_LABELS: Record<string, string> = {
  data_bundle: "Data Bundle",
  airtime: "Airtime",
  bill_payment: "Bill Payment",
  esim: "eSIM",
  foreign_number: "Foreign Number",
}

type TimelineStep = {
  key: string
  label: string
  description: string
  done: boolean
  active: boolean
  failed: boolean
}

function buildTimeline(order: OrderData): TimelineStep[] {
  const paymentOk = order.payment_status === "success"
  const paymentFailed = ["failed", "abandoned"].includes(order.payment_status)
  const fulfillProcessing = order.fulfillment_status === "processing"
  const fulfillDone = order.fulfillment_status === "completed"
  const fulfillFailed = order.fulfillment_status === "failed"

  return [
    {
      key: "ordered",
      label: "Order Placed",
      description: "Your order was received",
      done: true,
      active: false,
      failed: false,
    },
    {
      key: "payment",
      label: "Payment",
      description: paymentOk
        ? "Payment confirmed"
        : paymentFailed
        ? "Payment failed"
        : "Awaiting payment",
      done: paymentOk,
      active: !paymentOk && !paymentFailed,
      failed: paymentFailed,
    },
    {
      key: "processing",
      label: "Processing",
      description: fulfillDone
        ? "Order processed"
        : fulfillFailed
        ? "Processing issue"
        : fulfillProcessing
        ? "Processing your order"
        : paymentOk
        ? "Queued for processing"
        : "Waiting for payment",
      done: fulfillDone || fulfillFailed,
      active: fulfillProcessing || (paymentOk && !fulfillDone && !fulfillFailed),
      failed: fulfillFailed,
    },
    {
      key: "delivered",
      label: "Delivered",
      description: fulfillDone ? "Successfully delivered" : "Pending delivery",
      done: fulfillDone,
      active: false,
      failed: false,
    },
  ]
}

export default function TrackOrderPage() {
  const params = useParams()
  const trackingNumber = (params.trackingNumber as string).toUpperCase()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const fetched = useRef(false)

  const fetchOrder = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch(`/api/track/${trackingNumber}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      if (data.success) setOrder(data.order)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true
      fetchOrder()
    }
  }, [trackingNumber])

  // Auto-refresh every 10s while processing
  useEffect(() => {
    if (!order) return
    if (!["processing", "pending"].includes(order.fulfillment_status)) return
    const interval = setInterval(() => fetchOrder(true), 10000)
    return () => clearInterval(interval)
  }, [order?.fulfillment_status])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading order&hellip;</span>
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <Link href="/" className="font-bold text-xl text-foreground">Topchart</Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Order Not Found</h1>
          <p className="text-sm text-muted-foreground">
            No order found for tracking number{" "}
            <span className="font-mono font-semibold">{trackingNumber}</span>.
          </p>
          <Button asChild variant="outline">
            <Link href="/track">Try Another Number</Link>
          </Button>
        </main>
      </div>
    )
  }

  const timeline = buildTimeline(order)
  const isActive =
    order.payment_status === "pending" ||
    order.fulfillment_status === "processing" ||
    order.fulfillment_status === "pending"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-foreground">Topchart</Link>
          <Link href="/track" className="text-sm text-[color:var(--primary)] font-medium hover:underline">
            Track Another
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Tracking header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Order Status</h1>
            <p className="font-mono text-[color:var(--primary)] font-semibold mt-0.5">
              {order.tracking_number}
            </p>
          </div>
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-lg p-5">
          <div className="space-y-0">
            {timeline.map((step, i) => (
              <div key={step.key} className="flex gap-4">
                {/* Connector line + icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.failed
                        ? "bg-destructive/10 text-destructive"
                        : step.done
                        ? "bg-[color:var(--primary)] text-white"
                        : step.active
                        ? "bg-primary/10 text-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.failed ? (
                      <XCircle className="w-4 h-4" />
                    ) : step.done ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step.active ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  {i < timeline.length - 1 && (
                    <div
                      className={`w-0.5 h-8 my-1 ${
                        step.done ? "bg-[color:var(--primary)]" : "bg-border"
                      }`}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="pb-6 pt-1">
                  <p
                    className={`font-semibold text-sm ${
                      step.done || step.active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-card border rounded-lg divide-y">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="text-[color:var(--primary)]">
              {PRODUCT_ICONS[order.product_type] || <Package className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {PRODUCT_LABELS[order.product_type] || order.product_type}
              </p>
              <p className="text-xs text-muted-foreground">
                GH&#x20B5;{Number(order.amount_ghs).toFixed(2)}
              </p>
            </div>
          </div>

          {Object.entries(order.product_details)
            .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
            .map(([key, value]) => (
              <div key={key} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}

          <div className="px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Ordered</span>
            <span>
              {new Date(order.created_at).toLocaleString("en-GH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated</span>
            <span>
              {new Date(order.updated_at).toLocaleString("en-GH", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {isActive && (
          <p className="text-xs text-center text-muted-foreground">
            This page refreshes automatically every 10 seconds.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/receipt/${order.tracking_number}`}>
              Receipt
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href="/checkout">New Order</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
