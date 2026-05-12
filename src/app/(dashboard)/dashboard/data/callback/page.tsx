"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

type Phase = "verifying" | "pending" | "success" | "error"

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  const [phase, setPhase] = useState<Phase>("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!reference) {
      setPhase("error")
      setMessage("Missing payment reference.")
      return
    }

    let cancelled = false
    let attempts = 0

    const verify = async (): Promise<void> => {
      if (cancelled) return
      try {
        const res = await fetch(`/api/datamart/purchase/verify?reference=${encodeURIComponent(reference)}`)
        let data: Record<string, unknown> | null = null
        try {
          data = (await res.json()) as Record<string, unknown>
        } catch {
          /* ignore */
        }
        const d = data?.data as Record<string, unknown> | undefined
        const status = typeof d?.status === "string" ? d.status : ""

        if (cancelled) return

        if (data?.success && status === "success") {
          setPhase("success")
          const order = d?.order as Record<string, unknown> | null | undefined
          const oref = order?.order_reference ? String(order.order_reference) : ""
          const idk = typeof d?.idempotency_key === "string" ? d.idempotency_key : ""
          const qp = new URLSearchParams()
          if (oref) qp.set("oref", oref)
          if (idk) qp.set("idc", idk)
          qp.set("paystack_ok", "1")
          router.replace(`/dashboard/data?${qp.toString()}`)
          return
        }

        if (status === "pending" && attempts < 10) {
          attempts += 1
          setPhase("pending")
          setTimeout(() => {
            void verify()
          }, 2500)
          return
        }

        setPhase("error")
        setMessage(String(data?.error || "Payment could not be confirmed."))
      } catch {
        if (!cancelled) {
          setPhase("error")
          setMessage("Network error. Try opening Buy Data from your dashboard.")
        }
      }
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [reference, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {phase === "verifying" || phase === "pending" ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">
                {phase === "pending" ? "Confirming payment…" : "Verifying payment…"}
              </h2>
              <p className="text-sm text-muted-foreground">Please wait.</p>
            </div>
          ) : phase === "success" ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-semibold">Redirecting…</h2>
              <p className="text-sm text-muted-foreground">Taking you back to your data purchase.</p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Could not complete purchase</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/dashboard/data">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Buy Data
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DataPurchaseCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
