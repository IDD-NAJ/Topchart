"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/networks"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle, XCircle, Copy, Check, ArrowLeft, RefreshCw, MessageSquare, History, AlertCircle } from "lucide-react"
import { trackAdsPurchase, adsValueFromData } from "@/lib/ads"

type State =
  | { phase: "verifying" }
  | {
      phase: "success"
      number_id: string | null
      number: string
      expires_at: string | null
      price: number
      type: string
      ltr_days: number | null
    }
  | { phase: "pending" }
  | { phase: "refunded"; refund_amount: number; message: string }
  | { phase: "error"; message: string }

interface CallbackSmsRow {
  id: string
  from_number: string
  message: string
  received_at: string
}

function CallbackContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  const [state, setState] = useState<State>({ phase: "verifying" })
  const [copied, setCopied] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [callbackSms, setCallbackSms] = useState<CallbackSmsRow[]>([])
  const [callbackSmsLoading, setCallbackSmsLoading] = useState(false)

  const verify = async () => {
    try {
      const res = await fetch(`/api/verification/purchase/verify?reference=${reference}`)
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }

      if (data?.success && data?.data?.status === "success") {
        setState({
          phase: "success",
          number_id: data?.data?.number_id ?? null,
          number: data?.data?.number,
          expires_at: data?.data?.expires_at ?? null,
          price: data?.data?.price,
          type: data?.data?.type,
          ltr_days: data?.data?.ltr_days ?? null,
        })
        try {
          trackAdsPurchase(reference, {
            value: adsValueFromData(data?.data as Record<string, unknown> | undefined),
            currency: "GHS",
          })
        } catch {}
      } else if (data?.data?.status === "pending" && attempts < 5) {
        setState({ phase: "pending" })
        setAttempts((a) => a + 1)
        setTimeout(verify, 3000)
      } else if (!data?.success && data?.refunded) {
        setState({
          phase: "refunded",
          refund_amount: data?.refund_amount ?? 0,
          message: data?.error || "Number unavailable from provider.",
        })
      } else if (!data?.success) {
        setState({ phase: "error", message: data?.error || "Payment was not completed." })
      } else {
        setState({ phase: "error", message: "Verification timed out. Please check your history." })
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." })
    }
  }

  useEffect(() => {
    if (!reference) {
      setState({ phase: "error", message: "No payment reference found." })
      return
    }
    verify()
  }, [reference])

  const successNumberId = state.phase === "success" ? state.number_id : null

  const fetchCallbackSms = useCallback(
    async (silent: boolean) => {
      if (!successNumberId) return
      if (!silent) setCallbackSmsLoading(true)
      try {
        const res = await fetch(`/api/verification/sms/${successNumberId}`, { credentials: "include", cache: "no-store" })
        let data: unknown = null
        try {
          data = await res.json()
        } catch {
          /* non-JSON */
        }
        const d = data as { success?: boolean; data?: { sms?: CallbackSmsRow[] } } | null
        if (d?.success) setCallbackSms(d?.data?.sms ?? [])
      } finally {
        if (!silent) setCallbackSmsLoading(false)
      }
    },
    [successNumberId]
  )

  useEffect(() => {
    if (!successNumberId) {
      setCallbackSms([])
      return
    }
    fetchCallbackSms(false)
    const interval = setInterval(() => fetchCallbackSms(true), 60000)
    return () => clearInterval(interval)
  }, [successNumberId, fetchCallbackSms])

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
                  {state.expires_at ? (
                    <span>Expires: {new Date(state.expires_at).toLocaleString()}</span>
                  ) : null}
                </div>

                <p className="text-xs font-medium">
                  Charged: {formatCurrency(state.price)}
                </p>
              </div>

              {successNumberId ? (
                <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      Incoming SMS
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchCallbackSms(false)}
                      disabled={callbackSmsLoading}
                      className="p-1 rounded-md hover:bg-background transition-colors disabled:opacity-50"
                      title="Refresh SMS"
                    >
                      <RefreshCw
                        className={cn("h-3.5 w-3.5 text-muted-foreground", callbackSmsLoading && "animate-spin")}
                      />
                    </button>
                  </div>
                  {callbackSmsLoading && callbackSms.length === 0 ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Checking for messages…</span>
                    </div>
                  ) : callbackSms.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No messages yet. Tap refresh or wait — auto-checks every 12s.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                      {callbackSms.map((msg) => (
                        <div key={msg.id} className="rounded-md border bg-background/80 p-2 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground truncate">
                              From {msg.from_number}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                              {new Date(msg.received_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                          <p className="text-xs font-mono break-all leading-snug">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Use this number on the target platform. You can monitor SMS from your verification dashboard.
              </p>

              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  If SMS is not received within <span className="font-semibold">7 minutes</span>, go to{" "}
                  <span className="font-semibold">Verification History</span> and click{" "}
                  <span className="font-semibold">Cancel</span> to get a refund.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild className="w-full sm:flex-1 gap-2">
                  <Link href="/dashboard/verification/history">
                    <History className="h-4 w-4" />
                    Verification History
                  </Link>
                </Button>
                <Button asChild className="w-full sm:flex-1">
                  <Link href="/dashboard/verification">Verification Dashboard</Link>
                </Button>
              </div>
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

function Fallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Loading...</h2>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerificationCallbackPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CallbackContent />
    </Suspense>
  )
}
