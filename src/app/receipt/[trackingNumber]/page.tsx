"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Printer, Package } from "lucide-react"
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

const PRODUCT_LABELS: Record<string, string> = {
  data_bundle: "Data Bundle",
  airtime: "Airtime",
  bill_payment: "Bill Payment",
  esim: "eSIM",
  foreign_number: "Foreign Number",
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: "Paid", color: "text-green-700" },
  pending: { label: "Pending", color: "text-amber-700" },
  failed: { label: "Failed", color: "text-red-700" },
  abandoned: { label: "Cancelled", color: "text-muted-foreground" },
}

const FULFILLMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: "Delivered", color: "text-green-700" },
  processing: { label: "Processing", color: "text-blue-700" },
  pending: { label: "Pending", color: "text-amber-700" },
  failed: { label: "Needs Review", color: "text-red-700" },
}

export default function ReceiptPage() {
  const params = useParams()
  const trackingNumber = (params.trackingNumber as string).toUpperCase()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/track/${trackingNumber}`)
        if (res.status === 404) { setNotFound(true); return }
        const data = await res.json()
        if (data.success) setOrder(data.order)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetch_()
  }, [trackingNumber])

  const receiptDate = order
    ? new Date(order.created_at).toLocaleString("en-GH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Receipt Not Found</h1>
          <p className="text-sm text-muted-foreground">
            No order found for{" "}
            <span className="font-mono font-semibold">{trackingNumber}</span>
          </p>
          <Button asChild variant="outline"><Link href="/track">Track an Order</Link></Button>
        </div>
      </div>
    )
  }

  const payStatus = PAYMENT_STATUS_LABELS[order.payment_status] || { label: order.payment_status, color: "text-foreground" }
  const fulfillStatus = FULFILLMENT_STATUS_LABELS[order.fulfillment_status] || { label: order.fulfillment_status, color: "text-foreground" }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Print-hidden nav */}
      <header className="border-b bg-card print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-foreground">Topchart</Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 print:py-4 print:px-0">
        {/* Receipt card */}
        <div className="bg-card border rounded-lg overflow-hidden print:border-0 print:shadow-none">
          {/* Receipt header */}
          <div className="bg-[color:var(--primary)] text-white px-6 py-5 print:py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xl">Topchart</p>
                <p className="text-white/80 text-xs mt-0.5">Your trusted mobile top-up platform</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs uppercase tracking-wide">Receipt</p>
                <p className="font-mono font-bold text-sm">{order.tracking_number}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Date & status */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium mt-0.5">{receiptDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className={`text-sm font-semibold mt-0.5 ${payStatus.color}`}>{payStatus.label}</p>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Product */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
                Order Details
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{PRODUCT_LABELS[order.product_type] || order.product_type}</span>
                </div>
                {Object.entries(order.product_details)
                  .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Amount */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base">Total Paid</span>
              <span className="font-bold text-xl text-[color:var(--primary)]">
                GH&#x20B5;{Number(order.amount_ghs).toFixed(2)}
              </span>
            </div>

            <hr className="border-dashed" />

            {/* Delivery status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Status</span>
              <span className={`font-semibold ${fulfillStatus.color}`}>{fulfillStatus.label}</span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{order.customer_email_masked}</span>
            </div>

            <hr className="border-dashed" />

            {/* Tracking ref */}
            <div className="bg-muted/40 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Tracking Reference</p>
              <p className="font-mono font-bold text-lg">{order.tracking_number}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use this to track your order at topchart.store/track
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-muted/20 text-center">
            <p className="text-xs text-muted-foreground">
              Thank you for choosing Topchart. For support, contact us on WhatsApp.
            </p>
          </div>
        </div>

        {/* Print-hidden actions */}
        <div className="flex gap-3 mt-6 print:hidden">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/track/${order.tracking_number}`}>Track Order</Link>
          </Button>
          <Button className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Receipt
          </Button>
        </div>
      </main>
    </div>
  )
}
