"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type VerifyState = "verifying" | "success" | "failed" | "error"

interface VerifyResult {
  tracking_number: string
  payment_status: string
  fulfillment_status: string
  fulfillment_note?: string
}

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [state, setState] = useState<VerifyState>("verifying")
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const verified = useRef(false)

  useEffect(() => {
    if (!reference || verified.current) return
    verified.current = true

    const verify = async () => {
      try {
        const res = await fetch(`/api/guest/checkout/verify?reference=${encodeURIComponent(reference)}`)
        const data = await res.json()

        if (data.success) {
          setResult({
            tracking_number: data.tracking_number,
            payment_status: data.payment_status,
            fulfillment_status: data.fulfillment_status,
            fulfillment_note: data.fulfillment_note,
          })
          setState("success")

          // Auto-redirect to success page after 2.5s
          setTimeout(() => {
            router.replace(`/checkout/success?tracking=${data.tracking_number}`)
          }, 2500)
        } else {
          setErrorMsg(data.error || "Payment verification failed")
          setState("failed")
        }
      } catch {
        setErrorMsg("Network error. Please use your tracking number to check order status.")
        setState("error")
      }
    }

    verify()
  }, [reference, router])

  const trackingFromStorage =
    typeof window !== "undefined" ? sessionStorage.getItem("guest_tracking") : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link href="/" className="font-bold text-xl text-foreground">
            Topchart
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          {state === "verifying" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-[color:var(--primary)] animate-spin" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Confirming your payment</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Please wait while we verify your payment and process your order&hellip;
                </p>
              </div>
              <div className="space-y-2 text-sm text-left bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--primary)] animate-pulse" />
                  <span>Verifying payment with Paystack</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <span>Processing your order</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <span>Sending confirmation email</span>
                </div>
              </div>
            </>
          )}

          {state === "success" && result && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Payment Confirmed!</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting you to your order receipt&hellip;
                </p>
              </div>
              <div className="bg-card border rounded-lg p-4 text-sm text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Tracking number</span>
                  <span className="font-mono font-bold text-[color:var(--primary)]">
                    {result.tracking_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-600 capitalize">
                    {result.fulfillment_status === "completed" ? "Delivered" : "Processing"}
                  </span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => router.replace(`/checkout/success?tracking=${result.tracking_number}`)}
              >
                View Order Receipt
              </Button>
            </>
          )}

          {(state === "failed" || state === "error") && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                {state === "failed" ? (
                  <XCircle className="w-8 h-8 text-destructive" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {state === "failed" ? "Payment Failed" : "Verification Error"}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
              </div>

              {trackingFromStorage && (
                <div className="bg-card border rounded-lg p-4 text-sm text-left">
                  <p className="text-muted-foreground mb-2">Your order reference:</p>
                  <p className="font-mono font-bold text-[color:var(--primary)]">
                    {trackingFromStorage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    If your payment was debited, use this number to track your order or contact support.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/checkout">Try Again</Link>
                </Button>
                {trackingFromStorage && (
                  <Button className="flex-1" asChild>
                    <Link href={`/track/${trackingFromStorage}`}>Track Order</Link>
                  </Button>
                )}
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "233000000000"}`}
              className="text-[color:var(--primary)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Contact us on WhatsApp
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CallbackContent />
    </Suspense>
  )
}
