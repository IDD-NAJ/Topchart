"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import {
  Smartphone,
  Globe,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Zap,
  ShieldCheck,
  Wifi,
  Phone,
  MessageSquare,
  Clock,
  CreditCard,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ProductTab = "phone-number" | "travel-data"
type Step = "catalog" | "processing" | "success" | "failed"
type PaymentMethod = "wallet" | "paystack"

interface ESIMPackage {
  id: string
  country: string
  countryCode: string
  flag: string
  dataAllowance: string
  validity: string
  price: number
  network: string
  speed: string
}

interface PhoneNumberPlan {
  id: string
  name: string
  price: number
  minutes: number
  sms: number
  features: string[]
  popular?: boolean
}

const DEFAULT_AREA_CODES = [
  { code: "random", city: "Any available" },
]

// Static region tabs
const REGION_TABS = [
  { id: "africa", label: "Africa", icon: Globe },
  { id: "europe", label: "Europe", icon: Globe },
  { id: "americas", label: "Americas", icon: Globe },
  { id: "middle_east", label: "Middle East", icon: Globe },
  { id: "asia", label: "Asia", icon: Globe },
]


export default function ESIMPage() {
  const { user } = useAuth()
  const [productTab, setProductTab] = useState<ProductTab>("phone-number")
  const [step, setStep] = useState<Step>("catalog")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet")
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // API-fetched data
  const [phonePlans, setPhonePlans] = useState<PhoneNumberPlan[]>([])
  const [dataPackages, setDataPackages] = useState<ESIMPackage[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)

  const [selectedRegion, setSelectedRegion] = useState("africa")
  const [selectedPackage, setSelectedPackage] = useState<ESIMPackage | null>(null)
  const [selectedPhonePlan, setSelectedPhonePlan] = useState<PhoneNumberPlan | null>(null)
  const [areaCode, setAreaCode] = useState("random")
  const [customAreaCode, setCustomAreaCode] = useState("")
  const [useCustomAreaCode, setUseCustomAreaCode] = useState(false)
  const [fullName, setFullName] = useState("")
  const [comments, setComments] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [error, setError] = useState("")

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true)
        const res = await fetch("/api/wallet", { credentials: "include" })
        if (res.ok) {
          const result = await res.json()
          if (result.success) setWalletBalance(result.data.balance ?? 0)
        }
      } catch { /* ignore */ } finally {
        setLoadingBalance(false)
      }
    }
    if (user) fetchBalance()
  }, [user])

  // Fetch phone plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true)
        const res = await fetch("/api/esim/plans", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.success) setPhonePlans(data.data)
        }
      } catch {
        toast.error("Failed to load phone plans")
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  // Fetch data packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true)
        const res = await fetch("/api/esim/packages", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.success) setDataPackages(data.data)
        }
      } catch {
        toast.error("Failed to load data packages")
      } finally {
        setLoadingPackages(false)
      }
    }
    fetchPackages()
  }, [])

  const getPackagesByRegion = useCallback((region: string) => {
    const regionMap: Record<string, string[]> = {
      africa: ["GH", "NG", "KE", "ZA"],
      europe: ["GB", "DE", "FR", "IT", "ES", "NL"],
      americas: ["US", "CA", "BR", "MX"],
      middle_east: ["AE", "SA", "QA", "KW"],
      asia: ["IN", "JP", "KR", "SG", "TH", "CN"],
    }
    const codes = regionMap[region] || []
    return dataPackages.filter((p) => codes.includes(p.countryCode))
  }, [dataPackages])

  const filteredPackages = getPackagesByRegion(selectedRegion)
  const currentAmount = productTab === "phone-number"
    ? (selectedPhonePlan?.price ?? 0)
    : (selectedPackage?.price ?? 0)
  const canAfford = walletBalance >= currentAmount

  const handleOrder = async () => {
    if (productTab === "phone-number" && !selectedPhonePlan) return
    if (productTab === "travel-data" && !selectedPackage) return
    if (paymentMethod === "wallet" && !canAfford) {
      toast.error("Insufficient wallet balance. Please top up or use Paystack.")
      return
    }

    setStep("processing")
    setError("")

    try {
      const payload: Record<string, unknown> = {
        paymentMethod,
        email,
        planType: productTab,
      }

      if (productTab === "phone-number") {
        payload.planId = selectedPhonePlan!.id
        payload.amount = selectedPhonePlan!.price
        payload.areaCode = useCustomAreaCode && customAreaCode ? customAreaCode : areaCode
        payload.fullName = fullName
        payload.comments = comments
      } else {
        payload.packageId = selectedPackage!.id
        payload.amount = selectedPackage!.price
      }

      const res = await fetch("/api/purchases/esim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        if (paymentMethod === "paystack" && data.authorizationUrl) {
          window.location.href = data.authorizationUrl
          return
        }
        setStep("success")
        toast.success(productTab === "phone-number" ? "Phone number order placed!" : "eSIM order placed!")
      } else {
        setStep("failed")
        setError(data.error || "Order failed. Please try again.")
        toast.error(data.error || "Order failed")
      }
    } catch {
      setStep("failed")
      setError("Network error. Please try again.")
      toast.error("Network error")
    }
  }

  const reset = () => {
    setStep("catalog")
    setSelectedPackage(null)
    setSelectedPhonePlan(null)
    setError("")
  }

  const PaymentToggle = () => (
    <div className="space-y-2">
      <Label>Payment Method</Label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPaymentMethod("wallet")}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
            paymentMethod === "wallet"
              ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/5"
              : "border-muted hover:border-[color:var(--marketing-accent)]/30"
          )}
        >
          <Wallet className="h-5 w-5 text-[color:var(--marketing-accent)]" />
          <div>
            <p className="text-sm font-medium">Wallet</p>
            <p className="text-xs text-muted-foreground">Balance: ₵{loadingBalance ? "..." : walletBalance.toFixed(2)}</p>
          </div>
        </button>
        <button
          onClick={() => setPaymentMethod("paystack")}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
            paymentMethod === "paystack"
              ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/5"
              : "border-muted hover:border-[color:var(--marketing-accent)]/30"
          )}
        >
          <CreditCard className="h-5 w-5 text-[color:var(--marketing-accent)]" />
          <div>
            <p className="text-sm font-medium">Paystack</p>
            <p className="text-xs text-muted-foreground">Card / Mobile Money</p>
          </div>
        </button>
      </div>
      {paymentMethod === "wallet" && !canAfford && currentAmount > 0 && (
        <p className="text-xs text-red-500">Insufficient balance. Top up your wallet or use Paystack.</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {step !== "catalog" && (
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">eSIM</h1>
          <p className="text-muted-foreground">US phone numbers & travel data eSIMs</p>
        </div>
      </div>

      {step === "catalog" && (
        <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
          <button
            onClick={() => { setProductTab("phone-number"); reset() }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              productTab === "phone-number"
                ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Phone className="h-4 w-4" />
            Americas Phone Number
          </button>
          <button
            onClick={() => { setProductTab("travel-data"); reset() }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              productTab === "travel-data"
                ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Wifi className="h-4 w-4" />
            Travel Data eSIM
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "catalog" && productTab === "phone-number" && (
          <motion.div key="phone-catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Get a US Phone Number</p>
                    <p className="text-sm text-muted-foreground">Activate a real American number on your phone via eSIM</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> SMS</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Calls</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verification</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Moderator-processed</span>
                </div>
              </CardContent>
            </Card>

            {loadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[color:var(--marketing-accent)]" />
                <span className="ml-3 text-muted-foreground">Loading phone plans...</span>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {phonePlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-2 relative",
                      selectedPhonePlan?.id === plan.id
                        ? "border-[color:var(--marketing-accent)] shadow-md"
                        : "border-transparent hover:border-[color:var(--marketing-accent)]/30"
                    )}
                    onClick={() => setSelectedPhonePlan(plan)}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-2 right-4 bg-[color:var(--marketing-accent)] text-white text-[10px]">Popular</Badge>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <CardDescription>🇺🇸 US phone number</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{plan.price}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {plan.minutes} minutes</div>
                        <div className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> {plan.sms} SMS</div>
                      </div>
                      <div className="pt-2 border-t space-y-1">
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> {f}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedPhonePlan && (
              <Card className="border-2 border-[color:var(--marketing-accent)]/20">
                <CardHeader>
                  <CardTitle className="text-base">Configure & Pay</CardTitle>
                  <CardDescription>Configure your phone number preferences and delivery details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Preferred Area Code</Label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomAreaCode}
                          onChange={(e) => setUseCustomAreaCode(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Enter manually
                      </label>
                    </div>
                    {useCustomAreaCode ? (
                      <Input
                        placeholder="e.g., 305"
                        value={customAreaCode}
                        onChange={(e) => setCustomAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        maxLength={3}
                      />
                    ) : (
                      <Select value={areaCode} onValueChange={setAreaCode}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEFAULT_AREA_CODES.map((ac) => (
                            <SelectItem key={ac.code} value={ac.code}>
                              {ac.code === "random" ? "Any available" : `${ac.code} (${ac.city})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">We will try your preferred area code; if unavailable, a similar one will be assigned.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Comments (Optional)</Label>
                    <textarea
                      className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[color:var(--marketing-accent)] focus:border-transparent"
                      placeholder="Any special requests or notes..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                    <p className="text-xs text-muted-foreground">Activation details will be sent to this email</p>
                  </div>

                  <PaymentToggle />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{selectedPhonePlan.price}</span>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Phone number orders are processed by Moderator. You will be notified once your number is assigned.</span>
                  </div>

                  <Button
                    onClick={handleOrder}
                    disabled={paymentMethod === "wallet" && !canAfford}
                    className="w-full bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {paymentMethod === "paystack" ? "Pay with Paystack" : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {step === "catalog" && productTab === "travel-data" && (
          <motion.div key="travel-catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
              {REGION_TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRegion(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedRegion === tab.id
                        ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[color:var(--marketing-accent)]" />
                <span className="ml-3 text-muted-foreground">Loading data packages...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPackages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-2",
                        selectedPackage?.id === pkg.id
                          ? "border-[color:var(--marketing-accent)] shadow-md"
                          : "border-transparent hover:border-[color:var(--marketing-accent)]/30"
                      )}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{pkg.flag}</span>
                            <CardTitle className="text-base">{pkg.country}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="text-xs">{pkg.speed}</Badge>
                        </div>
                        <CardDescription className="text-xs">{pkg.network}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Wifi className="h-4 w-4 text-[color:var(--marketing-accent)]" />
                            <span className="font-semibold">{pkg.dataAllowance}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Smartphone className="h-4 w-4" />
                            <span>Valid for {pkg.validity}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{pkg.price}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredPackages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No eSIM packages available for this region yet.</p>
                  </div>
                )}
              </>
            )}

            {selectedPackage && (
              <Card className="border-2 border-[color:var(--marketing-accent)]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{selectedPackage.flag}</span>
                    {selectedPackage.country} eSIM
                  </CardTitle>
                  <CardDescription>Review your order & select payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Data</span>
                      <p className="font-semibold">{selectedPackage.dataAllowance}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Validity</span>
                      <p className="font-semibold">{selectedPackage.validity}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Network</span>
                      <p className="font-semibold">{selectedPackage.network}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Speed</span>
                      <p className="font-semibold">{selectedPackage.speed}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                    <p className="text-xs text-muted-foreground">eSIM QR code will be sent to this email</p>
                  </div>

                  <PaymentToggle />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{selectedPackage.price}</span>
                  </div>

                  <Button
                    onClick={handleOrder}
                    disabled={paymentMethod === "wallet" && !canAfford}
                    className="w-full bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {paymentMethod === "paystack" ? "Pay with Paystack" : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--marketing-accent)]" />
            <p className="mt-4 text-lg font-medium">Processing your order...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Order Placed!</h2>
            {productTab === "phone-number" ? (
              <>
                <p className="text-muted-foreground mt-1">Your US phone number request has been received.</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Admin will assign your number and notify you via email.</span>
                </div>
              </>
            ) : selectedPackage && (
              <>
                <p className="text-muted-foreground mt-1">Your {selectedPackage.country} eSIM will be delivered to {email}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>QR code and activation instructions will be emailed shortly</span>
                </div>
              </>
            )}
            <Button onClick={reset} className="mt-6">Order Another</Button>
          </motion.div>
        )}

        {step === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Order Failed</h2>
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
