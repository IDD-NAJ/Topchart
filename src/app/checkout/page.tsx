'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Phone,
  Mail,
  Package,
  Wifi,
  Globe,
  FileText,
} from 'lucide-react'
import {
  calculateTotalWithServiceCharge,
  serviceChargeLabel,
} from '@/lib/service-charge'

type ProductType = 'data_bundle' | 'bill_payment' | 'foreign_number' | ''

interface FormData {
  product_type: ProductType
  bundle_id: string
  email: string
  phone: string
  full_name: string
}

const PRODUCT_CATEGORIES = [
  { id: 'data_bundle', label: 'Data Bundle', icon: Wifi },
  { id: 'foreign_number', label: 'Foreign Number', icon: Globe },
  { id: 'bill_payment', label: 'Bill Payment', icon: FileText },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    product_type: '',
    bundle_id: '',
    email: '',
    phone: '',
    full_name: '',
  })
  const [selectedNetwork, setSelectedNetwork] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bundles, setBundles] = useState<any[]>([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [networks, setNetworks] = useState<any[]>([])
  const [networksLoading, setNetworksLoading] = useState(false)

  // Load networks on mount
  useEffect(() => {
    loadNetworks()
  }, [])

  // Load bundles when product type is data_bundle or network changes
  useEffect(() => {
    if (formData.product_type === 'data_bundle') {
      loadBundles()
    }
  }, [formData.product_type, selectedNetwork])

  const loadNetworks = async () => {
    try {
      setNetworksLoading(true)
      const response = await fetch('/api/purchases/networks')
      if (!response.ok) {
        console.error('[v0] Failed to fetch networks:', response.status)
        return
      }

      const result = await response.json()
      console.log('[v0] Networks API response:', result)

      const networkList = Array.isArray(result.data) ? result.data : []

      if (networkList.length > 0) {
        setNetworks(networkList)
        // Auto-select first network
        setSelectedNetwork(networkList[0].id)
      }
    } catch (error) {
      console.error('[v0] Failed to load networks:', error)
    } finally {
      setNetworksLoading(false)
    }
  }

  const loadBundles = async () => {
    try {
      setBundlesLoading(true)
      const url = selectedNetwork
        ? `/api/purchases/plans?network=${selectedNetwork}`
        : '/api/purchases/plans'
      const response = await fetch(url)
      if (!response.ok) {
        console.error('[v0] Failed to fetch bundles:', response.status)
        setErrors(prev => ({ ...prev, bundle_id: 'Failed to load bundles. Please try again.' }))
        return
      }

      const result = await response.json()
      console.log('[v0] Bundles API response for network', selectedNetwork, ':', result)
      
      // API returns { success: true, data: [...] } structure
      const bundleList = Array.isArray(result.data) ? result.data : (result.bundles || [])
      
      if (bundleList.length === 0) {
        console.warn('[v0] No bundles returned from API')
        setErrors(prev => ({ ...prev, bundle_id: 'No bundles available. Please try again later.' }))
        setBundles([])
        return
      }
      
      // Transform API response to expected format
      const transformedBundles = bundleList.map((bundle: any) => ({
        id: bundle.id || bundle.datamartPlanId,
        size_label: bundle.name || `${bundle.sizeMb}MB`,
        validity_label: bundle.validity || `${bundle.validityDays || 1} days`,
        price: bundle.effectivePrice || bundle.price || 0,
        ...bundle
      }))
      
      setBundles(transformedBundles.slice(0, 15))
    } catch (error) {
      console.error('[v0] Failed to load bundles:', error)
      setErrors(prev => ({ ...prev, bundle_id: 'Error loading bundles. Please refresh.' }))
    } finally {
      setBundlesLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_type) {
      newErrors.product_type = 'Select a product type'
    }

    if (formData.product_type === 'data_bundle' && !formData.bundle_id) {
      newErrors.bundle_id = 'Select a data bundle'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email required'
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Valid phone required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const selectedBundle = bundles.find(b => b.id === formData.bundle_id)
      
      const response = await fetch('/api/guest/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: formData.product_type,
          email: formData.email,
          phone: formData.phone,
          full_name: formData.full_name || undefined,
          ...(formData.bundle_id && { bundle_id: formData.bundle_id }),
          ...(selectedBundle && { amount: selectedBundle.price }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initialize payment')
      }

      const data = await response.json()
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setErrors({ submit: message })
      setLoading(false)
    }
  }

  const selectedBundle = bundles.find(b => b.id === formData.bundle_id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold text-primary">Topchart</h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-2">Secure Checkout</h2>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Powered by Paystack • Instant Delivery
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Error Alert */}
            {errors.submit && (
              <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}

            {/* Product Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground block">
                What would you like to purchase?
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {PRODUCT_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, product_type: category.id as ProductType, bundle_id: '' })}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.product_type === category.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <category.icon className="h-5 w-5" />
                    <span className="text-xs sm:text-sm font-medium text-center">{category.label}</span>
                  </button>
                ))}
              </div>
              {errors.product_type && <p className="text-xs text-destructive mt-2">{errors.product_type}</p>}
            </div>

            {/* Network Selection */}
            {formData.product_type === 'data_bundle' && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground block">
                  Select a network
                </label>
                {networksLoading ? (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Loading networks...</p>
                  </div>
                ) : networks.length === 0 ? (
                  <div className="flex items-center justify-center py-4 px-4 text-center">
                    <p className="text-sm text-destructive">No networks available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {networks.map(network => (
                      <button
                        key={network.id}
                        type="button"
                        onClick={() => {
                          setSelectedNetwork(network.id)
                          setFormData(prev => ({ ...prev, bundle_id: '' }))
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${
                          selectedNetwork === network.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-semibold text-foreground">{network.name}</p>
                        <p className="text-xs text-muted-foreground">{network.bundle_count} bundles</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bundle Selection */}
            {formData.product_type === 'data_bundle' && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground block">
                  Select a data bundle
                </label>
                {bundlesLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Loading available bundles...</p>
                  </div>
                ) : bundles.length === 0 ? (
                  <div className="flex items-center justify-center py-8 px-4 text-center">
                    <p className="text-sm text-destructive">No bundles available. Please try again later.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {bundles.map(bundle => (
                      <button
                        key={bundle.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, bundle_id: bundle.id })}
                        className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${
                          formData.bundle_id === bundle.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-bold text-foreground">{bundle.size_label}</p>
                        <p className="text-xs text-muted-foreground">{bundle.validity_label}</p>
                        <p className="text-primary font-semibold mt-1">GHS {(bundle.price || 0).toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                )}
                {errors.bundle_id && <p className="text-xs text-destructive mt-2">{errors.bundle_id}</p>}
              </div>
            )}

            {/* Order Summary */}
            {selectedBundle && (() => {
              const { base, serviceCharge, total } = calculateTotalWithServiceCharge(
                selectedBundle.price || 0
              )
              return (
                <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Order Summary</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{selectedBundle.size_label}</span>
                    <span className="text-foreground">GHS {base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Service charge ({serviceChargeLabel()})
                    </span>
                    <span className="text-muted-foreground">GHS {serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">GHS {total.toFixed(2)}</span>
                  </div>
                </div>
              )
            })()}

            {/* Contact Info */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-foreground block mb-2">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-semibold text-foreground block mb-2">
                  Phone <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+233 55 123 4567"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="full_name" className="text-sm font-semibold text-foreground block mb-2">
                  Full Name <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.product_type}
              className="w-full bg-primary hover:bg-primary-dark disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Proceed to Payment
                </>
              )}
            </button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Secure SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Paystack Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Instant Delivery</span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 text-sm text-muted-foreground space-y-3">
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
          <p className="text-xs">© 2024 Topchart. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
