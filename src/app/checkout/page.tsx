"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Wifi,
  FileText,
  SmartphoneIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Gift,
  Phone,
  Mail,
  MapPin,
  Zap,
} from "lucide-react"

type ProductType = "data_bundle" | "bill_payment" | "foreign_number"

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
    id: "bill_payment",
    label: "Bill Payment",
    description: "ECG, GWCL, DStv & more",
    icon: <FileText className="w-6 h-6" />,
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

const NETWORKS = [
  { id: "mtn", label: "MTN", code: "YELLO", color: "#FFD700", textColor: "#000" },
  { id: "telecel", label: "Telecel", code: "TELECEL", color: "#E60000", textColor: "#fff" },
  { id: "airteltigo", label: "AirtelTigo", code: "AT_PREMIUM", color: "#0066CC", textColor: "#fff" },
]

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

// ─── Modern Step Indicator ────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Select Product", description: "Choose what to buy" },
    { num: 2, label: "Your Details", description: "Contact information" },
    { num: 3, label: "Review & Pay", description: "Secure payment" },
  ]

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, idx) => {
          const isActive = step === s.num
          const isDone = step > s.num

          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-3 flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-lg"
                      : isActive
                      ? "bg-[color:var(--marketing-accent)] text-white ring-2 ring-[color:var(--marketing-accent)] ring-offset-2 shadow-xl scale-110"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <div className="text-center hidden sm:block">
                  <p className={`text-xs font-bold uppercase tracking-wide ${isActive ? "text-[color:var(--marketing-accent)]" : "text-slate-600"}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 max-w-20 rounded-full transition-all duration-300 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Checkout Component ───────────────────────────────────────────────────

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

  // Bill payment state
  const [billType, setBillType] = useState("")
  const [billAccount, setBillAccount] = useState("")
  const [billAmount, setBillAmount] = useState("")

  // Foreign number state
  const [foreignCountry, setForeignCountry] = useState("")
  const [foreignAmount, setForeignAmount] = useState("")

  // Customer details state
  const [recipientPhone, setRecipientPhone] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load bundles when network is selected
  useEffect(() => {
    if (selectedProduct === "data_bundle" && selectedNetwork) {
      setBundlesLoading(true)
      fetch(`/api/guest/bundles?network=${selectedNetwork}`)
        .then((r) => r.json())
        .then((data) => {
          setBundles(data.bundles || [])
          setSelectedBundle(null)
        })
        .catch((err) => {
          console.error("Failed to load bundles:", err)
          setError("Failed to load bundles. Please try again.")
        })
        .finally(() => setBundlesLoading(false))
    }
  }, [selectedNetwork, selectedProduct])

  // Helper: Get current product details
  const getProductDetails = () => {
    switch (selectedProduct) {
      case "data_bundle":
        return selectedBundle
          ? {
              network: selectedNetwork,
              capacity: selectedBundle.capacity,
              size: selectedBundle.size_label,
              validity: selectedBundle.validity_label,
              phone_number: recipientPhone,
            }
          : null
      case "bill_payment":
        return billType && billAccount && billAmount ? { bill_type: billType, account_number: billAccount, amount: billAmount } : null
      case "foreign_number":
        return foreignCountry && foreignAmount ? { country: foreignCountry, amount: foreignAmount } : null
      default:
        return null
    }
  }

  const getAmount = () => {
    switch (selectedProduct) {
      case "data_bundle":
        return selectedBundle?.price || 0
      case "bill_payment":
        return parseFloat(billAmount) || 0
      case "foreign_number":
        return parseFloat(foreignAmount) || 0
      default:
        return 0
    }
  }

  const isStep1Valid = () => {
    switch (selectedProduct) {
      case "data_bundle":
        return !!selectedBundle && !!recipientPhone && recipientPhone.replace(/\D/g, "").length >= 10
      case "bill_payment":
        return !!billType && !!billAccount && parseFloat(billAmount) > 0
      case "foreign_number":
        return !!foreignCountry && parseFloat(foreignAmount) > 0
      default:
        return false
    }
  }

  const isStep2Valid = () => {
    return customerName.trim() && customerPhone.trim() && customerPhone.replace(/\D/g, "").length >= 10
  }

  const handleProceed = () => {
    if (step === 1 && !isStep1Valid()) {
      setError("Please complete all required fields")
      return
    }
    if (step === 2 && !isStep2Valid()) {
      setError("Please enter your name and valid phone number")
      return
    }
    setError(null)
    setStep(step + 1)
  }

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true)
      setError(null)
    }
  }

  const handleCheckout = async () => {
    if (!isStep2Valid()) {
      setError("Please complete your details")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const amount = getAmount()
      const response = await fetch("/api/guest/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: selectedProduct,
          product_details: getProductDetails(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          amount_ghs: amount,
        }),
      })

      const data = await response.json()

      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        setError(data.error || "Payment initialization failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = getAmount()
  const discountAmount = promoApplied ? totalAmount * 0.05 : 0
  const finalAmount = totalAmount - discountAmount

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Progress Indicator */}
        <StepIndicator step={step} />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              {/* STEP 1: Product Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">What do you need?</h2>
                    <p className="text-slate-600">Select a product to get started</p>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedProduct(cat.id)
                          setError(null)
                        }}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          selectedProduct === cat.id
                            ? "border-[color:var(--marketing-accent)] bg-orange-50"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={selectedProduct === cat.id ? "text-[color:var(--marketing-accent)]" : "text-slate-600"}>
                            {cat.icon}
                          </div>
                          {selectedProduct === cat.id && (
                            <CheckCircle2 className="w-5 h-5 text-[color:var(--marketing-accent)]" />
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900">{cat.label}</h3>
                        <p className="text-sm text-slate-600 mt-1">{cat.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Product-Specific Form */}
                  {selectedProduct === "data_bundle" && (
                    <div className="space-y-4 pt-6 border-t">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 block">Select Network</label>
                        <div className="grid grid-cols-3 gap-3">
                          {NETWORKS.map((net) => (
                            <button
                              key={net.id}
                              onClick={() => setSelectedNetwork(net.code)}
                              className={`py-3 rounded-lg font-semibold transition-all ${
                                selectedNetwork === net.code
                                  ? "ring-2 ring-offset-2 ring-[color:var(--marketing-accent)] scale-105"
                                  : "border border-slate-200 hover:border-slate-300"
                              }`}
                              style={
                                selectedNetwork === net.code ? { background: net.color, color: net.textColor } : {}
                              }
                            >
                              {net.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {bundlesLoading && (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[color:var(--marketing-accent)]" />
                        </div>
                      )}

                      {!bundlesLoading && selectedNetwork && bundles.length > 0 && (
                        <div>
                          <label className="text-sm font-bold text-slate-700 mb-3 block">Choose a Bundle</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                            {bundles.map((bundle) => (
                              <button
                                key={bundle.id}
                                onClick={() => setSelectedBundle(bundle)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  selectedBundle?.id === bundle.id
                                    ? "border-[color:var(--marketing-accent)] bg-orange-50"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div className="font-bold text-slate-900">{bundle.size_label}</div>
                                <div className="text-xs text-slate-600 mt-1">{bundle.validity_label}</div>
                                <div className="text-sm font-bold text-[color:var(--marketing-accent)] mt-2">
                                  GH₵{bundle.price.toFixed(2)}
                                </div>
                                {bundle.is_popular && (
                                  <Badge className="mt-2 bg-emerald-500 text-white">
                                    Popular
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                          <Phone className="w-4 h-4" /> Recipient Phone Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="e.g. 024 000 0000"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProduct === "bill_payment" && (
                    <div className="space-y-4 pt-6 border-t">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Bill Type</label>
                        <select
                          value={billType}
                          onChange={(e) => setBillType(e.target.value)}
                          className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="">Select bill type...</option>
                          <option value="ecg">ECG (Electricity)</option>
                          <option value="gwcl">GWCL (Water)</option>
                          <option value="dstv">DStv</option>
                          <option value="gotv">GoTV</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Account Number</label>
                        <Input
                          placeholder="Enter your account number"
                          value={billAccount}
                          onChange={(e) => setBillAccount(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Amount (GH₵)</label>
                        <Input
                          type="number"
                          min="1"
                          step="0.5"
                          placeholder="Enter amount"
                          value={billAmount}
                          onChange={(e) => setBillAmount(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProduct === "foreign_number" && (
                    <div className="space-y-4 pt-6 border-t">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Country</label>
                        <Input
                          placeholder="e.g. United States"
                          value={foreignCountry}
                          onChange={(e) => setForeignCountry(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Amount (GH₵)</label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                          value={foreignAmount}
                          onChange={(e) => setForeignAmount(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Customer Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your Details</h2>
                    <p className="text-slate-600">We need this information to process your order</p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Full Name *</label>
                    <Input
                      placeholder="Enter your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number *
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. 024 000 0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Address (optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                      <Gift className="w-4 h-4" /> Promo or Referral Code
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-11"
                        disabled={promoApplied}
                      />
                      <Button
                        onClick={handleApplyPromo}
                        variant="outline"
                        className="h-11 px-4"
                        disabled={!promoCode.trim() || promoApplied}
                      >
                        Apply
                      </Button>
                    </div>
                    {promoApplied && (
                      <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Promo applied! You&apos;ll save 5%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Pay */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Review Your Order</h2>
                    <p className="text-slate-600">Check everything before completing payment</p>
                  </div>

                  {/* Order Summary Card */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="text-slate-600">Product</span>
                        <span className="font-bold text-slate-900">
                          {PRODUCT_CATEGORIES.find((c) => c.id === selectedProduct)?.label}
                        </span>
                      </div>

                      {selectedProduct === "data_bundle" && selectedBundle && (
                        <>
                          <div className="flex justify-between items-center pb-4 border-b">
                            <span className="text-slate-600">Network</span>
                            <span className="font-bold text-slate-900">{selectedNetwork}</span>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b">
                            <span className="text-slate-600">Bundle</span>
                            <span className="font-bold text-slate-900">{selectedBundle.size_label}</span>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b">
                            <span className="text-slate-600">Validity</span>
                            <span className="font-bold text-slate-900">{selectedBundle.validity_label}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="text-slate-600">Recipient</span>
                        <span className="font-bold text-slate-900">{recipientPhone || customerPhone}</span>
                      </div>

                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="text-slate-600">Name</span>
                        <span className="font-bold text-slate-900">{customerName}</span>
                      </div>

                      <div className="pt-4 space-y-2">
                        <div className="flex justify-between text-slate-700">
                          <span>Subtotal</span>
                          <span className="font-semibold">GH₵{totalAmount.toFixed(2)}</span>
                        </div>

                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount (5%)</span>
                            <span className="font-semibold">-GH₵{discountAmount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-lg font-bold bg-white p-3 rounded-lg border-2 border-[color:var(--marketing-accent)]">
                          <span>Total Amount</span>
                          <span className="text-[color:var(--marketing-accent)]">GH₵{finalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Secured by Paystack</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Your payment is encrypted and securely processed through Paystack.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 justify-between mt-8 pt-8 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  className="h-11 px-6"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                {step < 3 ? (
                  <Button
                    onClick={handleProceed}
                    className="h-11 px-8 font-semibold"
                    style={{ backgroundColor: "var(--marketing-accent)" }}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="h-11 px-8 font-semibold text-white"
                    style={{ backgroundColor: "var(--marketing-accent)" }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" /> Complete Payment
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm mb-4">
                {selectedProduct && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Product</span>
                      <span className="font-semibold text-slate-900">
                        {PRODUCT_CATEGORIES.find((c) => c.id === selectedProduct)?.label}
                      </span>
                    </div>

                    {selectedProduct === "data_bundle" && selectedBundle && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Bundle</span>
                          <span className="font-semibold">{selectedBundle.size_label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Amount</span>
                          <span className="font-semibold text-[color:var(--marketing-accent)]">GH₵{selectedBundle.price.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {selectedProduct === "bill_payment" && billAmount && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-semibold text-[color:var(--marketing-accent)]">GH₵{parseFloat(billAmount).toFixed(2)}</span>
                      </div>
                    )}

                    {selectedProduct === "foreign_number" && foreignAmount && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-semibold text-[color:var(--marketing-accent)]">GH₵{parseFloat(foreignAmount).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">GH₵{totalAmount.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xs">
                    <span>Promo Discount</span>
                    <span className="font-semibold">-GH₵{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span className="text-slate-900">Total</span>
                  <span className="text-[color:var(--marketing-accent)]">GH₵{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Secure
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Zap className="w-4 h-4 text-blue-500" /> Instant Processing
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Money-back Guarantee
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ─── Page Component ────────────────────────────────────────────────────────

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
