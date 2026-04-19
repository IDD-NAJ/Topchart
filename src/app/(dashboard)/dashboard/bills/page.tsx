"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  Receipt,
  Zap as ZapIcon,
  Tv,
  Droplets,
  Wifi,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  CreditCard,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Step = "select" | "form" | "confirm" | "processing" | "success" | "failed"

interface BillProvider {
  id: string
  name: string
  category: string
  icon: React.ElementType
  color: string
  accountLabel: string
  accountPlaceholder: string
  minAmount: number
  maxAmount: number
}

const CATEGORY_TABS = [
  { id: "electricity", label: "Electricity", icon: ZapIcon },
  { id: "tv", label: "TV & Subscriptions", icon: Tv },
  { id: "water", label: "Water", icon: Droplets },
  { id: "internet", label: "Internet", icon: Wifi },
]

const BILL_PROVIDERS: BillProvider[] = [
  { id: "ecg-prepaid", name: "ECG Prepaid", category: "electricity", icon: ZapIcon, color: "text-yellow-600 bg-yellow-50", accountLabel: "Meter Number", accountPlaceholder: "e.g., 1234567890", minAmount: 10, maxAmount: 500 },
  { id: "ecg-postpaid", name: "ECG Postpaid", category: "electricity", icon: ZapIcon, color: "text-yellow-600 bg-yellow-50", accountLabel: "Account Number", accountPlaceholder: "e.g., 9876543210", minAmount: 10, maxAmount: 5000 },
  { id: "dstv", name: "DSTV", category: "tv", icon: Tv, color: "text-blue-600 bg-blue-50", accountLabel: "Smart Card Number", accountPlaceholder: "e.g., 2012345678", minAmount: 25, maxAmount: 500 },
  { id: "gotv", name: "GOtv", category: "tv", icon: Tv, color: "text-orange-600 bg-orange-50", accountLabel: "ICU Number", accountPlaceholder: "e.g., 2012345678", minAmount: 20, maxAmount: 300 },
  { id: "gwcl", name: "Ghana Water (GWCL)", category: "water", icon: Droplets, color: "text-cyan-600 bg-cyan-50", accountLabel: "Account Number", accountPlaceholder: "e.g., 1234567", minAmount: 10, maxAmount: 1000 },
  { id: "mtn-fibre", name: "MTN Fibre", category: "internet", icon: Wifi, color: "text-[#FFC300] bg-yellow-50", accountLabel: "Account Number", accountPlaceholder: "e.g., 024XXXXXXX", minAmount: 50, maxAmount: 500 },
  { id: "vodafone-broadband", name: "Telecel Broadband", category: "internet", icon: Wifi, color: "text-red-600 bg-red-50", accountLabel: "Account Number", accountPlaceholder: "e.g., 020XXXXXXX", minAmount: 50, maxAmount: 500 },
]

export default function BillsPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>("select")
  const [selectedCategory, setSelectedCategory] = useState("electricity")
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null)
  const [accountNumber, setAccountNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")

  const filteredProviders = BILL_PROVIDERS.filter((p) => p.category === selectedCategory)

  const handleOrder = async () => {
    if (!selectedProvider || !accountNumber || !amount) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < selectedProvider.minAmount || numAmount > selectedProvider.maxAmount) {
      toast.error(`Amount must be between ₵${selectedProvider.minAmount} and ₵${selectedProvider.maxAmount}`)
      return
    }

    setStep("processing")
    setError("")

    try {
      const res = await fetch("/api/purchases/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          accountNumber,
          amount: numAmount,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setStep("success")
        toast.success("Bill payment successful!")
      } else {
        setStep("failed")
        setError(data.error || "Payment failed. Please try again.")
        toast.error(data.error || "Payment failed")
      }
    } catch {
      setStep("failed")
      setError("Network error. Please try again.")
      toast.error("Network error")
    }
  }

  const reset = () => {
    setStep("select")
    setSelectedProvider(null)
    setAccountNumber("")
    setAmount("")
    setError("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {step !== "select" && (
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pay Bills</h1>
          <p className="text-muted-foreground">Electricity, TV, water & internet payments</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(step === "select" || step === "form") && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedCategory(tab.id)
                      setSelectedProvider(null)
                      setStep("select")
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedCategory === tab.id
                        ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProviders.map((provider) => {
                const Icon = provider.icon
                return (
                  <Card
                    key={provider.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-2",
                      selectedProvider?.id === provider.id
                        ? "border-[color:var(--marketing-accent)] shadow-md"
                        : "border-transparent hover:border-[color:var(--marketing-accent)]/30"
                    )}
                    onClick={() => {
                      setSelectedProvider(provider)
                      setStep("form")
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", provider.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        ₵{provider.minAmount} – ₵{provider.maxAmount}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {step === "form" && selectedProvider && (
              <Card className="border-2 border-[color:var(--marketing-accent)]/20 mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[color:var(--marketing-accent)]" />
                    Pay {selectedProvider.name}
                  </CardTitle>
                  <CardDescription>Enter your account details and amount</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{selectedProvider.accountLabel}</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={selectedProvider.accountPlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (GHS)</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`₵${selectedProvider.minAmount} – ₵${selectedProvider.maxAmount}`}
                      min={selectedProvider.minAmount}
                      max={selectedProvider.maxAmount}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min: ₵{selectedProvider.minAmount} · Max: ₵{selectedProvider.maxAmount}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">
                      ₵{amount || "0.00"}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep("select")} className="flex-1">Back</Button>
                    <Button
                      onClick={handleOrder}
                      disabled={!accountNumber || !amount}
                      className="flex-1 bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Bill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--marketing-accent)]" />
            <p className="mt-4 text-lg font-medium">Processing payment...</p>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your payment</p>
          </motion.div>
        )}

        {step === "success" && selectedProvider && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground mt-1">
              ₵{amount} paid to {selectedProvider.name} ({accountNumber})
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4 text-green-600" />
              <span>A receipt has been sent to your email</span>
            </div>
            <Button onClick={reset} className="mt-6">Pay Another Bill</Button>
          </motion.div>
        )}

        {step === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Payment Failed</h2>
            <p className="text-muted-foreground mt-1">{error}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={reset}>Go Back</Button>
              <Button onClick={handleOrder}>Retry</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
