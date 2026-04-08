"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/networks"
import { Loader2, CheckCircle, XCircle, Copy, Check, ArrowLeft, RefreshCw } from "lucide-react"

type State =
  | { phase: "verifying" }
  | { phase: "success"; number: string; expires_at: string; price: number; type: string; ltr_days: number | null }
  | { phase: "pending" }
  | { phase: "refunded"; refund_amount: number; message: string }
  | { phase: "error"; message: string }

export default function VerificationCallbackPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  const [state, setState] = useState<State>({ phase: "verifying" })
  const [copied, setCopied] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!reference) {
      setState({ phase: "error", message: "No payment reference found." })
      return
    }
    verify()
  }, [reference])

  const verify = async () => {
    try {
      const res = await fetch(`/api/verification/purchase/verify?reference=${reference}`)
      const data = await res.json()

      if (data.success && data.data?.status === "success") {
        setState({
          phase: "success",
          number: data.data.number,
          expires_at: data.data.expires_at,
          price: data.data.price,
          type: data.data.type,
          ltr_days: data.data.ltr_days ?? null,
        })
      } else if (data.data?.status === "pending" && attempts < 5) {
        setState({ phase: "pending" })
        setAttempts((a) => a + 1)
        setTimeout(verify, 3000)
      } else if (!data.success && data.refunded) {
        setState({
          phase: "refunded",
          refund_amount: data.refund_amount ?? 0,
          message: data.error || "Number unavailable from provider.",
        })
      } else if (!data.success) {
        setState({ phase: "error", message: data.error || "Payment was not completed." })
      } else {
        setState({ phase: "error", message: "Verification timed out. Please check your history." })
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." })
    }
  }

  const copyNumber = () => {
    if (state.phase !== "success") return
    navigator.clipboard.writeText(state.number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {state.phase === "verifying" || state.phase === "pending" ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">
                {state.phase === "pending" ? "Payment received — issuing number…" : "Verifying payment…"}
              </h2>
              <p className="text-sm text-muted-foreground">Please don&apos;t close this page.</p>
            </div>
          ) : state.phase === "success" ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-7 w-7 text-green-600 shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold">Number purchased!</h2>
                  <p className="text-xs text-muted-foreground">Payment verified via Paystack</p>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/40 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-2xl font-bold flex-1 tracking-wider">{state.number}</p>
                  <button
                    onClick={copyNumber}
                    className="p-2 rounded-lg hover:bg-background border transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    {state.type === "LTR" ? `LTR ${state.ltr_days}-day` : "STR 20 min"}
                  </Badge>
                  <span>Expires: {new Date(state.expires_at).toLocaleString()}</span>
                </div>

                <p className="text-xs font-medium">
                  Charged: {formatCurrency(state.price)}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Use this number on the target platform. You can monitor SMS from your verification dashboard.
              </p>

              <Button asChild className="w-full">
                <Link href="/dashboard/verification">Go to Verification Dashboard</Link>
              </Button>
            </div>
          ) : state.phase === "refunded" ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Payment refunded to wallet</h2>
                  <p className="text-xs text-muted-foreground">{state.message}</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {formatCurrency(state.refund_amount)} has been credited to your wallet
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You can now use your wallet balance to try again or purchase a different number.
                </p>
              </div>

              <Button asChild className="w-full">
                <Link href="/dashboard/verification">Try Again</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <XCircle className="h-7 w-7 text-red-500 shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold">Payment failed</h2>
                  <p className="text-xs text-muted-foreground">{state.message}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/verification">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Verification
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
