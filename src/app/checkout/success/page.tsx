"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface OrderDetails {
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

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  data_bundle: "Data Bundle",
  airtime: "Airtime",
  bill_payment: "Bill Payment",
  esim: "eSIM",
  foreign_number: "Foreign Number",
}

const FULFILLMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; description: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    description: "Your order is queued for processing.",
  },
  processing: {
    label: "Processing",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    description: "Your order is being processed right now.",
  },
  completed: {
    label: "Delivered",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    description: "Your order has been delivered successfully.",
  },
  failed: {
    label: "Needs Review",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    description: "There was an issue with delivery. Our team will resolve this shortly.",
  },
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const tracking = searchParams.get("tracking")?.toUpperCase()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const fetched = useRef(false)

  const fetchOrder = async (isRefresh = false) => {
    if (!tracking) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/track/${tracking}`)
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
    // Auto-refresh every 8s if still processing
    const interval = setInterval(() => {
      if (order?.fulfillment_status === "processing") fetchOrder(true)
    }, 8000)
    return () => clearInterval(interval)
  }, [tracking, order?.fulfillment_status])

  const copyTracking = () => {
    if (!tracking) return
    navigator.clipboard.writeText(tracking)
    toast.success("Tracking number copied!")
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No tracking number provided.</p>
          <Button asChild><Link href="/checkout">New Order</Link></Button>
        </div>
      </div>
    )
  }

  const statusConfig =
    FULFILLMENT_STATUS_CONFIG[order?.fulfillment_status || "pending"] ||
    FULFILLMENT_STATUS_CONFIG.pending

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-foreground">
            Topchart
          </Link>
          <Link href="/checkout" className="text-sm text-[color:var(--primary)] font-medium hover:underline">
            New Order
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Success banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Confirmed!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Payment received. We&apos;re processing your order.
            </p>
          </div>
        </div>

        {/* Tracking number card */}
        <div className="bg-card border rounded-lg p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
            Your Tracking Number
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xl font-bold text-[color:var(--primary)]">
              {tracking}
            </span>
            <Button variant="outline" size="sm" onClick={copyTracking} className="shrink-0">
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Save this number to track and look up your order at any time.
          </p>
        </div>

        {/* Order details */}
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading order details&hellip;</span>
          </div>
        ) : order ? (
          <>
            {/* Status */}
            <div className={`border rounded-lg p-4 ${statusConfig.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold text-sm ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {(order.fulfillment_status === "processing" || order.fulfillment_status === "pending") && (
                  <button
                    onClick={() => fetchOrder(true)}
                    disabled={refreshing}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
              <p className={`text-xs ${statusConfig.color}`}>{statusConfig.description}</p>
            </div>

            {/* Order info */}
            <div className="bg-card border rounded-lg divide-y">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Product</span>
                <span className="text-sm font-medium">
                  {PRODUCT_TYPE_LABELS[order.product_type] || order.product_type}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-bold text-[color:var(--primary)]">
                  GH&#x20B5;{Number(order.amount_ghs).toFixed(2)}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email (receipt sent to)</span>
                <span className="text-sm font-medium">{order.customer_email_masked}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ordered at</span>
                <span className="text-sm">
                  {new Date(order.created_at).toLocaleString("en-GH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Product details */}
            {Object.keys(order.product_details).length > 0 && (
              <div className="bg-card border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Order Details
                </h3>
                <div className="space-y-2">
                  {Object.entries(order.product_details)
                    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Could not load order details. Use your tracking number to check later.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/track/${tracking}`}>
              Track Order
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/receipt/${tracking}`}>
              View Receipt
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href="/checkout">New Order</Link>
          </Button>
        </div>

        {/* Help */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Need help with this order? Save your tracking number{" "}
            <span className="font-mono font-bold">{tracking}</span> and{" "}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "233000000000"}`}
              className="text-[color:var(--primary)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              contact us on WhatsApp
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SuccessContent />
    </Suspense>
  )
}
