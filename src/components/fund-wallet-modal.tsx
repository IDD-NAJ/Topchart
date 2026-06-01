"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, CreditCard, ExternalLink } from "lucide-react"

const quickAmounts = [10, 20, 50, 100, 200, 500]

interface FundWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingReference?: string | null
}

type Step = "amount" | "redirecting" | "verifying" | "success" | "failed"

export function FundWalletModal({ open, onOpenChange, pendingReference }: FundWalletModalProps) {
  const { user, refreshUser } = useAuth()
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<Step>("amount")
  const [error, setError] = useState("")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [reference, setReference] = useState("")

  // Handle pending reference from callback
  useEffect(() => {
    if (pendingReference && open) {
      setReference(pendingReference)
      setStep("verifying")
      verifyPayment(pendingReference)
    }
  }, [pendingReference, open])

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    setAmount(cleaned)
    setError("")
  }

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
    setError("")
  }

  const handleProceed = async () => {
    const numAmount = Number.parseInt(amount, 10)
    
    if (!numAmount || numAmount < 10) {
      setError("Minimum amount is GH₵10")
      return
    }
    
    if (numAmount > 10000) {
      setError("Maximum amount is GH₵10,000")
      return
    }

    if (!user) {
      setError("Please log in to continue")
      return
    }

    setStep("redirecting")
    setError("")

    try {
      // Initialize payment via API
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount: numAmount }),
      })

      let result: any
      try {
        result = await response.json()
      } catch {
        setError("Server error. Please try again.")
        setStep("failed")
        return
      }

      if (!response.ok || !result.success) {
        setError(result?.error || "Failed to initialize payment")
        setStep("failed")
        return
      }

      // Store reference and redirect URL
      setReference(result.data.reference)
      setPaymentUrl(result.data.authorization_url)

      // Redirect to Paystack checkout
      window.location.href = result.data.authorization_url
    } catch (err) {
      console.error("Payment initialization error:", err)
      setError("Failed to initialize payment. Please try again.")
      setStep("failed")
    }
  }

  const verifyPayment = async (ref: string) => {
    try {
      const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(ref)}`)
      let result: any
      try {
        result = await response.json()
      } catch {
        setError("Payment verification failed. Please contact support.")
        setStep("failed")
        return
      }

      if (result.success && result.data.status === "success") {
        await refreshUser()
        setStep("success")
      } else if (result.data?.status === "pending") {
        // Payment still processing, wait and retry
        setTimeout(() => verifyPayment(ref), 3000)
      } else {
        setError(result.data?.message || result.error || "Payment verification failed")
        setStep("failed")
      }
    } catch (err) {
      console.error("Payment verification error:", err)
      setError("Failed to verify payment. Please contact support.")
      setStep("failed")
    }
  }

  const handleOpenPaystack = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    refreshUser()
    setTimeout(() => {
      setAmount("")
      setStep("amount")
      setError("")
      setPaymentUrl("")
      setReference("")
    }, 200)
  }

  const handleRetry = () => {
    setStep("amount")
    setError("")
    setPaymentUrl("")
    setReference("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "amount" && (
          <>
            <DialogHeader>
              <DialogTitle>Fund Wallet</DialogTitle>
              <DialogDescription>
                Add money to your wallet using Paystack
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (GHS)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      GH₵
                    </span>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter amount"
                      value={amount ? Number(amount).toLocaleString() : ""}
                      onChange={(e) => handleAmountChange(e.target.value.replace(/,/g, ""))}
                      className="pl-12 text-lg font-medium"
                    />
                  </div>
                  {amount && (
                    <div className="mt-2 space-y-1 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(Number(amount))}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Service Charge (4%):</span>
                        <span className="font-medium">{formatCurrency(Number(amount) * 0.04)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-border pt-1 mt-1">
                        <span>Total to Pay:</span>
                        <span className="text-[color:var(--marketing-accent)]">{formatCurrency(Number(amount) * 1.04)}</span>
                      </div>
                    </div>
                  )}
                </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Quick select</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={amount === value.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleQuickAmount(value)}
                      className="font-medium"
                    >
                      {formatCurrency(value)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleProceed}
                className="w-full"
                disabled={!amount}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with Paystack
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You will be redirected to Paystack to complete your payment securely.
              </p>
            </div>
          </>
        )}

        {step === "redirecting" && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[color:var(--marketing-accent)]/10 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-[color:var(--marketing-accent)] animate-spin" />
            </div>
            <DialogTitle className="text-lg font-semibold mb-2">
              Redirecting to Paystack
            </DialogTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Please wait while we redirect you to complete your payment...
            </p>
            {paymentUrl && (
              <Button variant="outline" size="sm" onClick={handleOpenPaystack} className="bg-transparent">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Paystack manually
              </Button>
            )}
          </div>
        )}

        {step === "verifying" && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[color:var(--marketing-accent)]/10 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-[color:var(--marketing-accent)] animate-spin" />
            </div>
            <DialogTitle className="text-lg font-semibold mb-2">
              Verifying Payment
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your payment...
            </p>
            {reference && (
              <p className="text-xs text-muted-foreground mt-2">
                Reference: {reference}
              </p>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-lg font-semibold mb-2">
              Payment Successful!
            </DialogTitle>
            <p className="text-sm text-muted-foreground mb-2">
              Your wallet has been credited successfully.
            </p>
            {reference && (
              <p className="text-xs text-muted-foreground mb-6">
                Reference: {reference}
              </p>
            )}
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {step === "failed" && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-semibold mb-2">
              Payment Failed
            </DialogTitle>
            <p className="text-sm text-muted-foreground mb-2">
              {error || "Something went wrong. Please try again."}
            </p>
            {reference && (
              <p className="text-xs text-muted-foreground mb-6">
                Reference: {reference}
              </p>
            )}
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
