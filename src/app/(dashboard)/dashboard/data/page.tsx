"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { detectNetwork, networks, type Network } from "@/lib/networks"
import { resolveNetworkCode } from "@/lib/datamart"
import { datamartNetworkMatches } from "@/lib/datamart"
import { NetworkSelector } from "@/components/network-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Star, Zap, ShieldCheck, Target, CreditCard, Users, Smartphone, Receipt, Check, Database, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { addFavorite } from "@/lib/actions/favorites"
import { FavoriteNumbers } from "@/components/favorite-numbers"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { PurchaseCard } from "@/components/purchase/PurchaseCard"
import { RecentRecipients } from "@/components/purchase/RecentRecipients"
import { addRecentRecipient, getRecentRecipients, type RecentRecipient } from "@/lib/purchase-data"
import { Skeleton } from "@/components/ui/skeleton"

interface DatamartPlan {
  id: string
  networkId: string
  network: string
  name: string
  validity: string | null
  validityHours: number | null
  validityDays: number | null
  providerPrice: number
  effectivePrice: number
  priceOverride: number | null
  markupPercent: number | null
  isPopular: boolean
  isActive: boolean
  isFeatured: boolean
  datamartPlanId: string | null
  datamartPlanType: string | null
}

type Step = "form" | "confirm" | "processing" | "success" | "failed"

const PLAN_TYPE_LABELS: Record<string, string> = {
  SME: "SME",
  GIFTING: "Gifting",
  CORPORATE_GIFTING: "Corp. Gift",
  DATA_COUPONS: "Coupon",
  UNLIMITED: "Unlimited",
}

function normalizeNetworkId(networkName: string, selectedNetworkId?: string): string {
  if (selectedNetworkId) return selectedNetworkId
  const name = networkName.toLowerCase()
  if (name.includes("mtn")) return "mtn"
  if (name.includes("vodafone") || name.includes("telecel")) return "vodafone"
  if (name.includes("airtel") || name.includes("tigo")) return "airteltigo"
  return "mtn"
}

export default function DataPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, refreshUser } = useAuth()

  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(() => networks.find(n => n.id === "mtn") || null)
  const [selectedPlan, setSelectedPlan] = useState<DatamartPlan | null>(null)
  const [phone, setPhone] = useState(searchParams.get("phone") || "")
  const [step, setStep] = useState<Step>("form")
  const [error, setError] = useState("")
  const [saveAsFavorite, setSaveAsFavorite] = useState(false)
  const [favoriteName, setFavoriteName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([])

  const [plans, setPlans] = useState<DatamartPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansError, setPlansError] = useState("")
  const [plansStale, setPlansStale] = useState(false)
  const [plansFetchedAt, setPlansFetchedAt] = useState<string>("")
  const [activeType, setActiveType] = useState<string>("ALL")
  const [favoritesRefreshKey, setFavoritesRefreshKey] = useState(0)

  useEffect(() => {
    if (phone.length >= 4) {
      const detected = detectNetwork(phone)
      if (detected) setSelectedNetwork(detected)
    }
  }, [phone])

  useEffect(() => {
    setRecentRecipients(getRecentRecipients())
  }, [])

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true)
    setPlansError("")
    setPlansStale(false)
    setPlansFetchedAt("")
    setSelectedPlan(null)
    try {
      const res = await fetch(`/api/purchases/plans`, {
        credentials: "include",
        cache: "no-store",
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setPlans(json.data)
        setPlansStale(Boolean(json.stale))
        setPlansFetchedAt(String(json.fetchedAt || ""))
        setPlansError("")
      } else {
        setPlansError(json.error || "Failed to load plans from provider.")
        setPlans([])
      }
    } catch {
      setPlansError("Network error loading plans. Please try again.")
      setPlans([])
    } finally {
      setPlansLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => {
    if (selectedNetwork && selectedPlan) {
      const isMatch = datamartNetworkMatches(selectedPlan.network, selectedNetwork.name);
      if (!isMatch) {
        setSelectedPlan(null);
      }
    }
  }, [selectedNetwork, selectedPlan]);

  const planTypes = ["ALL", ...Array.from(new Set(plans.map((p) => p.datamartPlanType || "SME").filter(Boolean)))]

  const filteredPlans = plans.filter((p) => {
    if (activeType !== "ALL" && (p.datamartPlanType || "SME") !== activeType) return false;
    if (selectedNetwork && p.network) {
      const isMatch = datamartNetworkMatches(p.network, selectedNetwork.name);
      if (!isMatch) return false;
    }
    return true;
  });

  const availableNetworks = Array.from(new Set(plans.map(p => normalizeNetworkId(p.network))))
    .map(id => networks.find(n => n.id === id))
    .filter(Boolean) as Network[];

  const validateForm = () => {
    if (!selectedNetwork) { setError("Please select a network provider."); return false }
    if (!phone || phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return false }
    if (!selectedPlan) { setError("Please select a data bundle plan."); return false }
    const price = selectedPlan.effectivePrice
    if (!authUser || price > authUser.walletBalance) {
      setError("Insufficient wallet balance. Please fund your wallet.")
      return false
    }
    return true
  }

  const handleSaveFavorite = async () => {
    if (!authUser || !phone) {
      toast.error("Please enter a phone number.")
      return
    }

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 9) {
      toast.error("Please enter a valid phone number (at least 9 digits).")
      return
    }

    setIsSaving(true)
    const result = await addFavorite({
      userId: authUser.id,
      phoneNumber: phone,
      name: favoriteName.trim() || phone,
      type: "data",
      network: selectedNetwork?.name || "general",
    })
    setIsSaving(false)

    if (result.success) {
      toast.success("Recipient saved successfully.")
      setSaveAsFavorite(false)
      setFavoriteName("")
      setFavoritesRefreshKey(prev => prev + 1)
    } else {
      toast.error(result.error || "Failed to save recipient.")
    }
  }

  const handleProceed = () => {
    setError("")
    if (validateForm()) setStep("confirm")
  }

  const handleConfirm = async () => {
    if (!validateForm()) return;
    setStep("processing")
    
    try {
      const idempotencyKey = crypto.randomUUID()
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": idempotencyKey },
        credentials: "include",
        body: JSON.stringify({
          phone,
          networkId: resolveNetworkCode(selectedNetwork!.id),
          networkName: selectedNetwork!.name,
          planId: selectedPlan!.id,
          planName: selectedPlan!.name,
          planSize: selectedPlan!.name,
          planPrice: selectedPlan!.effectivePrice,
          type: "DATA",
          idempotencyKey,
        }),
      })
      const result = await response.json()
      
      if (result.success) {
        addRecentRecipient(phone, selectedNetwork!.id)
        setRecentRecipients(getRecentRecipients())
        setStep("success")
        await refreshUser()
      } else {
        setStep("failed")
        setError(result.error || "Transaction declined by provider.")
      }
    } catch {
      setStep("failed")
      setError("Connectivity issue. Your balance remains unchanged.")
      await refreshUser()
    }
  }

  const planPrice = selectedPlan ? selectedPlan.effectivePrice : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 pb-24 px-4 sm:px-6">
      
      <div className="flex flex-col gap-2 mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group w-fit">
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Bundles</h1>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Database className="w-4 h-4 fill-current" />
            Live Pricing
          </div>
        </div>
        <p className="text-muted-foreground">Purchase direct data bundles across all major networks.</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-2 text-xs sm:text-sm font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Delivery: 2–15 minutes</span>
            <span className="sm:hidden">2–15 min</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">No refunds for wrong numbers</span>
            <span className="sm:hidden">No refunds</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Services Available 24/7</span>
            <span className="sm:hidden">24/7</span>
          </span>
        </div>
      </div>

      {step === "confirm" ? (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-primary/20 shadow-xl overflow-hidden">
            <div className="bg-primary p-6 sm:p-8 text-primary-foreground">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Review Purchase</h2>
                  <p className="text-primary-foreground/80">Please verify the details below</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
                <div>
                  <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Network</p>
                  <p className="text-lg font-bold mt-1">{selectedNetwork?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Recipient</p>
                  <p className="text-lg font-mono font-bold mt-1">{phone}</p>
                </div>
                <div className="col-span-2 bg-white/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Bundle & Amount</p>
                    <p className="text-2xl font-bold mt-1">{selectedPlan?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white/70 uppercase tracking-wider">You Pay</p>
                    <p className="text-2xl font-bold text-green-300 mt-1">GH₵ {planPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 bg-card space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Please ensure the phone number is correct. Data purchases cannot be reversed once processed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setStep("form")} 
                  className="flex-1"
                >
                  Edit Details
                </Button>
                <Button 
                  size="lg"
                  onClick={handleConfirm} 
                  className="flex-1"
                >
                  Confirm & Pay
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {/* Network & Recipient Details */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
                  Network & Recipient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                
                <div className="space-y-3">
                  <Label>Select Network</Label>
                  <NetworkSelector
                    networks={availableNetworks.length > 0 ? availableNetworks : networks}
                    selected={selectedNetwork}
                    onSelect={setSelectedNetwork}
                  />
                </div>

                <div className="space-y-4 pt-2 border-t">
                  {recentRecipients.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Contacts</Label>
                      <RecentRecipients
                        recipients={recentRecipients}
                        onSelect={(recipient) => {
                          setPhone(recipient.phoneNumber)
                          const matchedNetwork = networks.find((n) => n.id === recipient.networkId)
                          if (matchedNetwork) setSelectedNetwork(matchedNetwork)
                        }}
                        onRemove={(recipient) => {
                          setRecentRecipients(prev => prev.filter(r => r.id !== recipient.id))
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone">Phone Number</Label>
                      {phone.length >= 10 && (
                        <button
                          onClick={() => setSaveAsFavorite(!saveAsFavorite)}
                          className={cn(
                            "text-sm font-medium flex items-center gap-1 transition-colors",
                            saveAsFavorite ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Star className={cn("w-4 h-4", saveAsFavorite && "fill-current")} />
                          {saveAsFavorite ? "Saving..." : "Save to Favorites"}
                        </button>
                      )}
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="024 XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="h-14 text-lg font-mono tracking-wider transition-all focus-visible:ring-primary"
                      maxLength={10}
                    />
                  </div>

                  {saveAsFavorite && (
                    <div className="p-4 rounded-xl bg-muted border animate-in slide-in-from-top-2">
                      <Label htmlFor="fav-name" className="text-sm font-medium mb-2 block">Contact Name</Label>
                      <div className="flex gap-3">
                        <Input
                          id="fav-name"
                          placeholder="e.g. Mom, Personal, Office"
                          value={favoriteName}
                          onChange={(e) => setFavoriteName(e.target.value)}
                          className="flex-1 bg-background"
                        />
                        <Button onClick={handleSaveFavorite} disabled={isSaving} className="shrink-0">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plans Selection */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-base font-bold">2</span>
                    Select Plan
                  </CardTitle>
                  {selectedNetwork && !plansLoading && plans.length > 0 && (
                    <span className="text-sm font-medium text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                      {filteredPlans.length} available
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {plansLoading ? (
                  <div className="p-12 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Fetching live plans from provider...</p>
                  </div>
                ) : plansError ? (
                  <div className="p-12 flex flex-col items-center text-center space-y-4">
                    <AlertCircle className="w-10 h-10 text-destructive/50" />
                    <div>
                      <p className="font-medium text-destructive">{plansError}</p>
                      <p className="text-sm text-muted-foreground mt-1">Please try refreshing the available plans.</p>
                    </div>
                    <Button variant="outline" onClick={() => fetchPlans()}>Retry Connection</Button>
                  </div>
                ) : !selectedNetwork ? (
                  <div className="p-12 flex flex-col items-center text-center space-y-3 opacity-50">
                    <Target className="w-10 h-10 text-muted-foreground" />
                    <p className="font-medium text-muted-foreground">Select a network above to view plans.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {planTypes.length > 2 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {planTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={cn(
                              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
                              activeType === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {type === "ALL" ? "All Types" : (PLAN_TYPE_LABELS[type] || type)}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            "rounded-md transition-all cursor-pointer",
                            selectedPlan?.id === plan.id 
                              ? "ring-2 ring-primary ring-offset-1 ring-offset-background" 
                              : ""
                          )}
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <PurchaseCard
                            bundle={{
                              id: plan.id,
                              name: plan.name,
                              networkId: normalizeNetworkId(plan.network || "", selectedNetwork?.id),
                              dataAmount: plan.name,
                              validity: plan.validity || "N/A",
                              price: plan.effectivePrice,
                              originalPrice: plan.providerPrice > plan.effectivePrice ? plan.providerPrice : undefined,
                              category: "other",
                              isPopular: plan.isPopular,
                              description: plan.datamartPlanType ? `Type: ${PLAN_TYPE_LABELS[plan.datamartPlanType] || plan.datamartPlanType}` : undefined,
                            }}
                            onPurchase={() => setSelectedPlan(plan)}
                          />
                        </div>
                      ))}
                      {filteredPlans.length === 0 && (
                        <div className="sm:col-span-2 p-12 text-center flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
                          <p className="font-medium text-muted-foreground">No plans match this category.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Saved Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FavoriteNumbers 
                  key={favoritesRefreshKey}
                  userId={authUser?.id ?? ""} 
                  type="data" 
                  onSelect={(val) => {
                    setPhone(val)
                    setError("")
                  }} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Summary */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 shadow-lg border-primary/10 bg-gradient-to-b from-card to-muted/20">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">{selectedNetwork?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Number</span>
                    <span className="font-mono font-medium">{phone || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bundle</span>
                    <span className="font-medium truncate max-w-[150px]">{selectedPlan?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Validity</span>
                    <span className="font-medium">{selectedPlan?.validity || "—"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Total to Pay</span>
                    <span className="text-3xl font-bold tracking-tight">GH₵ {planPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-4">
                    <span className="text-muted-foreground">Wallet Balance</span>
                    <span className={cn(
                      "font-medium",
                      authUser && planPrice > authUser.walletBalance ? "text-destructive" : "text-green-600"
                    )}>
                      GH₵ {authUser ? authUser.walletBalance.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    size="lg"
                    className="w-full h-14 text-base font-bold shadow-lg transition-transform hover:scale-[1.02]"
                    onClick={handleProceed}
                    disabled={!selectedNetwork || phone.length < 9 || !selectedPlan || plansLoading}
                  >
                    Proceed to Pay
                  </Button>
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  Secure, instant transaction
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Processing/Outcome Modal */}
      <Dialog open={["processing", "success", "failed"].includes(step)} onOpenChange={(open) => {
        if (!open && step !== "processing") setStep("form")
      }}>
        <DialogContent className="sm:max-w-md p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center animate-in zoom-in duration-300",
              step === "processing" ? "bg-primary/10" : 
              step === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
            )}>
              {step === "processing" ? <Loader2 className="w-12 h-12 animate-spin text-primary" /> :
               step === "success" ? <Check className="w-12 h-12" /> :
               <AlertCircle className="w-12 h-12" />}
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {step === "processing" && "Processing"}
                {step === "success" && "Transaction Successful"}
                {step === "failed" && "Transaction Failed"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {step === "processing" && "Please wait while we secure your transaction."}
                {step === "success" && `${selectedPlan?.name} delivered to ${phone}.`}
                {step === "failed" && (error || "Your transaction could not be completed.")}
              </DialogDescription>
            </div>

            {step === "success" && (
              <div className="flex flex-col gap-3 w-full mt-4">
                <Button onClick={() => {
                  setSelectedPlan(null)
                  setStep("form")
                }} variant="outline" className="w-full h-12">
                  Buy Another
                </Button>
                <Button onClick={() => router.push("/dashboard")} className="w-full h-12">
                  Return to Dashboard
                </Button>
              </div>
            )}
            
            {step === "failed" && (
              <Button onClick={() => { setStep("form"); setError("") }} className="w-full h-12">
                Try Again
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

