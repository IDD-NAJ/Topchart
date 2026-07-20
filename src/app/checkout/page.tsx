"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Wifi,
  Phone,
  FileText,
  Globe,
  SmartphoneIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Lock,
  Search,
} from "lucide-react"

// ─── Product types ─────────────────────────────────────────────────────────────

type ProductType = "data_bundle" | "airtime" | "bill_payment" | "esim" | "foreign_number"

interface ProductCategory {
  id: ProductType
  label: string
  description: string
  icon: React.ReactNode
  available: boolean
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "data_bundle",
    label: "Data Bundle",
    description: "MTN, Telecel & AirtelTigo bundles",
    icon: <Wifi className="w-6 h-6" />,
    available: true,
  },
  {
    id: "airtime",
    label: "Airtime",
    description: "Top up any Ghana number",
    icon: <Phone className="w-6 h-6" />,
    available: true,
  },
  {
    id: "bill_payment",
    label: "Bill Payment",
    description: "ECG, GWCL, DStv & more",
    icon: <FileText className="w-6 h-6" />,
    available: true,
  },
  {
    id: "esim",
    label: "eSIM",
    description: "International data eSIM cards",
    icon: <Globe className="w-6 h-6" />,
    available: true,
  },
  {
    id: "foreign_number",
    label: "Foreign Number",
    description: "Virtual verification numbers",
    icon: <SmartphoneIcon className="w-6 h-6" />,
    available: true,
  },
]

// ─── Networks for data bundles ─────────────────────────────────────────────────

const NETWORKS = [
  { id: "mtn", label: "MTN", code: "YELLO", color: "#FFD700", textColor: "#000" },
  { id: "telecel", label: "Telecel", code: "TELECEL", color: "#E60000", textColor: "#fff" },
  { id: "airteltigo", label: "AirtelTigo", code: "AT_PREMIUM", color: "#0066CC", textColor: "#fff" },
]

// ─── Bundle type ───────────────────────────────────────────────────────────────

interface Bundle {
  id: string
  capacity: string
  network_name: string
  network_code: string
  size_label: string
  size_mb: number
  validity_label: string
  validity_hours: number
  price: number
  is_popular: boolean
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ["Product", "Details", "Pay"]
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = step > n
        return (
          <React.Fragment key={n}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-[color:var(--primary)] text-white"
                    : active
                    ? "bg-[color:var(--primary)] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : n}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 max-w-12 h-0.5 transition-colors ${
                  done ? "bg-[color:var(--primary)]" : "bg-border"
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main checkout component ───────────────────────────────────────────────────

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    (searchParams.get("product") as ProductType) || null
  )

  // Data bundle state
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [bundleSearch, setBundleSearch] = useState("")

  // Airtime state
  const [airtimePhone, setAirtimePhone] = useState("")
  const [airtimeNetwork, setAirtimeNetwork] = useState("")
  const [airtimeAmount, setAirtimeAmount] = useState("")

  // Bill payment state
  const [billType, setBillType] = useState("")
  const [billAccount, setBillAccount] = useState("")
  const [billAmount, setBillAmount] = useState("")

  // eSIM state
  const [esimCountry, setEsimCountry] = useState("")
  const [esimPlan, setEsimPlan] = useState("")
  const [esimAmount, setEsimAmount] = useState("")

  // Foreign number state
  const [fnCountry, setFnCountry] = useState("")
  const [fnService, setFnService] = useState("")
  const [fnAmount, setFnAmount] = useState("")

  // Common recipient phone for data/airtime
  const [recipientPhone, setRecipientPhone] = useState("")

  // Customer info (step 2)
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load bundles when a network is selected
  const loadBundles = useCallback(async (networkName: string) => {
    setBundlesLoading(true)
    setBundles([])
    setSelectedBundle(null)
    try {
      const res = await fetch(`/api/guest/bundles?network=${encodeURIComponent(networkName)}`)
      const data = await res.json()
      if (data.success) {
        setBundles(data.bundles)
      }
    } catch {
      // silent
    } finally {
      setBundlesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedNetwork) {
      const net = NETWORKS.find((n) => n.id === selectedNetwork)
      if (net) loadBundles(net.label)
    }
  }, [selectedNetwork, loadBundles])

  // When product is selected from query param, auto-advance to step 1 product selection
  useEffect(() => {
    if (selectedProduct) setStep(1)
  }, [selectedProduct])

  const getProductDetails = (): Record<string, unknown> => {
    switch (selectedProduct) {
      case "data_bundle":
        return {
          network: selectedBundle?.network_code || "",
          network_name: selectedBundle?.network_name || "",
          capacity: selectedBundle?.capacity || "",
          size: selectedBundle?.size_label || "",
          validity: selectedBundle?.validity_label || "",
          phone_number: recipientPhone,
        }
      case "airtime":
        return {
          phone_number: airtimePhone || recipientPhone,
          network: airtimeNetwork,
          amount: airtimeAmount,
        }
      case "bill_payment":
        return {
          bill_type: billType,
          account_number: billAccount,
          amount: billAmount,
        }
      case "esim":
        return {
          country: esimCountry,
          plan: esimPlan,
          amount: esimAmount,
        }
      case "foreign_number":
        return {
          country: fnCountry,
          service: fnService,
          amount: fnAmount,
        }
      default:
        return {}
    }
  }

  const getAmount = (): number => {
    switch (selectedProduct) {
      case "data_bundle":
        return selectedBundle?.price || 0
      case "airtime":
        return parseFloat(airtimeAmount) || 0
      case "bill_payment":
        return parseFloat(billAmount) || 0
      case "esim":
        return parseFloat(esimAmount) || 0
      case "foreign_number":
        return parseFloat(fnAmount) || 0
      default:
        return 0
    }
  }

  const isStep1Valid = (): boolean => {
    if (!selectedProduct) return false
    switch (selectedProduct) {
      case "data_bundle":
        return !!selectedBundle && !!recipientPhone && recipientPhone.replace(/\D/g, "").length >= 10
      case "airtime":
        return !!(airtimePhone || recipientPhone) && !!airtimeNetwork && parseFloat(airtimeAmount) > 0
      case "bill_payment":
        return !!billType && !!billAccount && parseFloat(billAmount) > 0
      case "esim":
        return !!esimCountry && !!esimPlan && parseFloat(esimAmount) > 0
      case "foreign_number":
        return !!fnCountry && !!fnService && parseFloat(fnAmount) > 0
      default:
        return false
    }
  }

  const isStep2Valid = (): boolean => {
    return (
      !!customerEmail.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) &&
      !!customerName.trim()
    )
  }

  const handleSubmit = async () => {
    if (!selectedProduct || !customerEmail || !customerName) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/guest/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: customerEmail.trim(),
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || undefined,
          product_type: selectedProduct,
          product_details: getProductDetails(),
          amount_ghs: getAmount(),
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Failed to initialize checkout")
        return
      }

      // Store tracking number for callback page
      sessionStorage.setItem("guest_tracking", data.tracking_number)
      sessionStorage.setItem("guest_reference", data.paystack_reference)

      // Redirect to Paystack
      window.location.href = data.authorization_url
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredBundles = bundles.filter(
    (b) =>
      !bundleSearch ||
      b.size_label.toLowerCase().includes(bundleSearch.toLowerCase()) ||
      b.validity_label.toLowerCase().includes(bundleSearch.toLowerCase()) ||
      String(b.price).includes(bundleSearch)
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl text-foreground">Topchart</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>Secured by Paystack</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Quick Checkout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No account required &mdash; pay instantly with card or MoMo
          </p>
        </div>

        <StepIndicator step={step} />

        {/* ── STEP 1: Product + Details ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Product category picker */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                What do you need?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedProduct(cat.id)
                      setSelectedBundle(null)
                      setSelectedNetwork(null)
                    }}
                    disabled={!cat.available}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedProduct === cat.id
                        ? "border-[color:var(--primary)] bg-primary/5 ring-1 ring-[color:var(--primary)]"
                        : "border-border bg-card hover:border-muted-foreground/50"
                    } ${!cat.available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div
                      className={`mb-2 ${
                        selectedProduct === cat.id
                          ? "text-[color:var(--primary)]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {cat.icon}
                    </div>
                    <div className="font-semibold text-sm text-foreground">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cat.description}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Data Bundle Details ── */}
            {selectedProduct === "data_bundle" && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Select Network
                </h2>
                <div className="flex gap-2">
                  {NETWORKS.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => setSelectedNetwork(net.id)}
                      className={`flex-1 py-3 rounded-lg border font-semibold text-sm transition-all ${
                        selectedNetwork === net.id
                          ? "border-[color:var(--primary)] ring-1 ring-[color:var(--primary)]"
                          : "border-border bg-card hover:border-muted-foreground/50"
                      }`}
                      style={
                        selectedNetwork === net.id
                          ? { background: net.color, color: net.textColor, borderColor: net.color }
                          : {}
                      }
                    >
                      {net.label}
                    </button>
                  ))}
                </div>

                {selectedNetwork && (
                  <>
                    {bundlesLoading ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading bundles...</span>
                      </div>
                    ) : (
                      <>
                        {bundles.length > 6 && (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search bundles..."
                              value={bundleSearch}
                              onChange={(e) => setBundleSearch(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                          {filteredBundles.map((bundle) => (
                            <button
                              key={bundle.id}
                              onClick={() => setSelectedBundle(bundle)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                selectedBundle?.id === bundle.id
                                  ? "border-[color:var(--primary)] bg-primary/5 ring-1 ring-[color:var(--primary)]"
                                  : "border-border bg-card hover:border-muted-foreground/50"
                              }`}
                            >
                              <div className="font-bold text-base text-foreground">{bundle.size_label}</div>
                              <div className="text-xs text-muted-foreground">{bundle.validity_label}</div>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="font-semibold text-sm text-[color:var(--primary)]">
                                  GH&#x20B5;{bundle.price.toFixed(2)}
                                </span>
                                {bundle.is_popular && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </button>
                          ))}
                          {filteredBundles.length === 0 && (
                            <p className="col-span-full text-center text-sm text-muted-foreground py-4">
                              No bundles match your search.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="data-phone">Recipient Phone Number</Label>
                  <Input
                    id="data-phone"
                    type="tel"
                    placeholder="e.g. 024 000 0000"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* ── Airtime Details ── */}
            {selectedProduct === "airtime" && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Airtime Details
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="airtime-phone">Phone Number</Label>
                  <Input
                    id="airtime-phone"
                    type="tel"
                    placeholder="e.g. 024 000 0000"
                    value={airtimePhone}
                    onChange={(e) => setAirtimePhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Network</Label>
                  <div className="flex gap-2">
                    {NETWORKS.map((net) => (
                      <button
                        key={net.id}
                        onClick={() => setAirtimeNetwork(net.code)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                          airtimeNetwork === net.code
                            ? "border-[color:var(--primary)] ring-1 ring-[color:var(--primary)]"
                            : "border-border bg-card"
                        }`}
                        style={
                          airtimeNetwork === net.code
                            ? { background: net.color, color: net.textColor }
                            : {}
                        }
                      >
                        {net.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="airtime-amount">Amount (GH&#x20B5;)</Label>
                  <Input
                    id="airtime-amount"
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="e.g. 5.00"
                    value={airtimeAmount}
                    onChange={(e) => setAirtimeAmount(e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* ── Bill Payment Details ── */}
            {selectedProduct === "bill_payment" && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Bill Payment Details
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-type">Bill Type</Label>
                  <select
                    id="bill-type"
                    value={billType}
                    onChange={(e) => setBillType(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select bill type</option>
                    <option value="ECG">ECG (Electricity)</option>
                    <option value="GWCL">GWCL (Water)</option>
                    <option value="DSTV">DStv</option>
                    <option value="GoTV">GoTV</option>
                    <option value="StarTimes">StarTimes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-account">Account / Meter Number</Label>
                  <Input
                    id="bill-account"
                    placeholder="Enter account or meter number"
                    value={billAccount}
                    onChange={(e) => setBillAccount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-amount">Amount (GH&#x20B5;)</Label>
                  <Input
                    id="bill-amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 50.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* ── eSIM Details ── */}
            {selectedProduct === "esim" && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  eSIM Details
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="esim-country">Destination Country</Label>
                  <Input
                    id="esim-country"
                    placeholder="e.g. United States"
                    value={esimCountry}
                    onChange={(e) => setEsimCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="esim-plan">Plan / Package</Label>
                  <Input
                    id="esim-plan"
                    placeholder="e.g. 5GB / 30 days"
                    value={esimPlan}
                    onChange={(e) => setEsimPlan(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="esim-amount">Amount (GH&#x20B5;)</Label>
                  <Input
                    id="esim-amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 150.00"
                    value={esimAmount}
                    onChange={(e) => setEsimAmount(e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* ── Foreign Number Details ── */}
            {selectedProduct === "foreign_number" && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Foreign Number Details
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="fn-country">Country</Label>
                  <Input
                    id="fn-country"
                    placeholder="e.g. United States"
                    value={fnCountry}
                    onChange={(e) => setFnCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fn-service">Service / App</Label>
                  <Input
                    id="fn-service"
                    placeholder="e.g. WhatsApp, Telegram"
                    value={fnService}
                    onChange={(e) => setFnService(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fn-amount">Amount (GH&#x20B5;)</Label>
                  <Input
                    id="fn-amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 20.00"
                    value={fnAmount}
                    onChange={(e) => setFnAmount(e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* Step 1 CTA */}
            {selectedProduct && (
              <Button
                className="w-full"
                disabled={!isStep1Valid()}
                onClick={() => setStep(2)}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* ── STEP 2: Customer Info ── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Order summary */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium capitalize">
                    {PRODUCT_CATEGORIES.find((c) => c.id === selectedProduct)?.label}
                  </span>
                </div>
                {selectedProduct === "data_bundle" && selectedBundle && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bundle</span>
                      <span className="font-medium">
                        {selectedBundle.size_label} — {selectedBundle.validity_label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network</span>
                      <span className="font-medium">{selectedBundle.network_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recipient</span>
                      <span className="font-medium">{recipientPhone}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-[color:var(--primary)]">
                    GH&#x20B5;{getAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer info form */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Your Details
              </h2>
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="cust-name"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="you@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your receipt and tracking details will be sent to this email.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Phone (optional)</Label>
                <Input
                  id="cust-phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </section>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!isStep2Valid() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Pay GH&#x20B5;{getAmount().toFixed(2)}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Payments secured by Paystack. We never store your card details.</span>
            </div>
          </div>
        )}

        {/* Already have order? */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already ordered?{" "}
            <Link href="/track" className="text-[color:var(--primary)] font-medium hover:underline">
              Track your order
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CheckoutContent />
    </Suspense>
  )
}
