"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Package, Loader2, ArrowRight } from "lucide-react"

function TrackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get("q") || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = trackingNumber.trim().toUpperCase()
    if (!normalized) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/track/search?tracking=${encodeURIComponent(normalized)}`)
      const data = await res.json()

      if (data.success) {
        router.push(`/track/${data.order.tracking_number}`)
      } else {
        setError(data.error || "Order not found. Please check your tracking number.")
        setLoading(false)
      }
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

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

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7 text-[color:var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Track Your Order</h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Enter your tracking number to check the status of your order. Tracking numbers look like{" "}
            <span className="font-mono font-semibold">TCG-20260720-XXXX</span>.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="space-y-4 max-w-md mx-auto">
          <div className="space-y-1.5">
            <Label htmlFor="tracking-input">Tracking Number</Label>
            <div className="flex gap-2">
              <Input
                id="tracking-input"
                placeholder="TCG-20260720-XXXX"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" disabled={!trackingNumber.trim() || loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </form>

        {/* Tips */}
        <div className="max-w-md mx-auto bg-card border rounded-lg p-5 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Where to find your tracking number
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[color:var(--primary)]" />
              <span>Check the confirmation email sent to your inbox after payment</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[color:var(--primary)]" />
              <span>Look at the order success page you saw after checkout</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[color:var(--primary)]" />
              <span>
                Format: <span className="font-mono font-semibold">TCG-YYYYMMDD-XXXX</span>
              </span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Lost your tracking number?{" "}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "233000000000"}`}
              className="text-[color:var(--primary)] font-medium hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TrackContent />
    </Suspense>
  )
}
