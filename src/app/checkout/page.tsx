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
  Loader2,
  ShieldCheck,
  Lock,
  AlertCircle,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react"

type ProductType = "data_bundle" | "bill_payment" | "foreign_number"

interface FormData {
  product_type: ProductType | ""
  network?: string
  bundle_id?: string
  amount?: number
  email: string
  phone: string
  full_name?: string
  reference_id?: string
}

interface ValidationErrors {
  [key: string]: string
}

const PRODUCT_CATEGORIES = [
  {
    id: "data_bundle",
    label: "Data Bundle",
    description: "MTN, Telecel & AirtelTigo",
    icon: Wifi,
  },
  {
    id: "bill_payment",
    label: "Bill Payment",
    description: "ECG, GWCL, DStv & more",
    icon: FileText,
  },
  {
    id: "foreign_number",
    label: "Foreign Number",
    description: "Virtual verification numbers",
    icon: SmartphoneIcon,
  },
]

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<FormData>({
    product_type: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [bundles, setBundles] = useState<any[]>([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [selectedBundleDetails, setSelectedBundleDetails] = useState<any>(null)

  // Load bundles when product type changes
  useEffect(() => {
    if (formData.product_type === "data_bundle") {
      loadBundles()
    }
  }, [formData.product_type])

  const loadBundles = async () => {
    try {
      setBundlesLoading(true)
      const response = await fetch("/api/purchases/plans")
      if (response.ok) {
        const data = await response.json()
        const bundleList = data.bundles || data.data || []
        setBundles(bundleList.slice(0, 12)) // Show top 12 bundles
      }
    } catch (error) {
      console.error("[v0] Failed to load bundles:", error)
    } finally {
      setBundlesLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.product_type) {
      newErrors.product_type = "Please select a product type"
    }

    if (formData.product_type === "data_bundle" && !formData.bundle_id) {
      newErrors.bundle_id = "Please select a data bundle"
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email address required"
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = "Valid phone number required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInitializePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        product_type: formData.product_type,
        email: formData.email,
        phone: formData.phone,
        ...(formData.full_name && { full_name: formData.full_name }),
        ...(formData.bundle_id && { bundle_id: formData.bundle_id }),
        ...(formData.amount && { amount: formData.amount }),
      }

      const response = await fetch("/api/guest/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        setErrors({ submit: error.error || "Failed to initialize payment" })
        setIsLoading(false)
        return
      }

      const data = await response.json()

      // Redirect to Paystack
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (error) {
      console.error("[v0] Payment initialization error:", error)
      setErrors({ submit: "An error occurred. Please try again." })
      setIsLoading(false)
    }
  }

  const handleBundleSelect = (bundle: any) => {
    setFormData({
      ...formData,
      bundle_id: bundle.id,
      amount: bundle.price,
    })
    setSelectedBundleDetails(bundle)
  }

  const getProductIcon = (type: ProductType | "") => {
    const category = PRODUCT_CATEGORIES.find((c) => c.id === type)
    return category ? <category.icon className="w-5 h-5" /> : null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-muted-foreground">
              Fast, secure, and instant delivery
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8">
            {errors.submit && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleInitializePayment} className="space-y-6">
              {/* Product Type Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  What would you like to buy?
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRODUCT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, product_type: category.id as ProductType })
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.product_type === category.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <category.icon className="w-5 h-5" />
                        <span className="font-semibold">{category.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </button>
                  ))}
                </div>
                {errors.product_type && (
                  <p className="text-sm text-destructive mt-2">{errors.product_type}</p>
                )}
              </div>

              {/* Bundle Selection for Data Bundles */}
              {formData.product_type === "data_bundle" && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Select Data Bundle
                  </Label>
                  {bundlesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {bundles.map((bundle) => (
                        <button
                          key={bundle.id}
                          type="button"
                          onClick={() => handleBundleSelect(bundle)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            formData.bundle_id === bundle.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-lg font-bold">{bundle.size_label}</div>
                          <div className="text-sm text-muted-foreground">
                            {bundle.validity_label}
                          </div>
                          <div className="text-primary font-semibold mt-1">
                            GHS {bundle.price.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.bundle_id && (
                    <p className="text-sm text-destructive mt-2">{errors.bundle_id}</p>
                  )}
                </div>
              )}

              {/* Selected Item Summary */}
              {selectedBundleDetails && (
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Bundle</p>
                      <p className="font-semibold">{selectedBundleDetails.size_label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        GHS {selectedBundleDetails.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <Label htmlFor="email" className="text-base font-semibold">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-2"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-2"
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="full_name" className="text-base font-semibold">
                    Full Name <span className="text-muted-foreground text-sm">(Optional)</span>
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.full_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="mt-2"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Security Information */}
              <div className="bg-muted/50 p-4 rounded-lg flex gap-3 border border-border">
                <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Your payment is secured by <strong>Paystack</strong>. We never store your card details.
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay with Paystack
                  </>
                )}
              </Button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div>•</div>
                <div>Instant Delivery</div>
              </div>
            </form>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-primary hover:underline text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  )
}
