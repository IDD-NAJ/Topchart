"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { detectNetwork, type Network } from "@/lib/networks"
import { datamartNetworkMatches } from "@/lib/datamart"
import { NetworkSelector } from "@/components/network-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Wifi, Star, Zap, ShieldCheck, Target, CreditCard, Users } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { addFavorite } from "@/lib/actions/favorites"
import { FavoriteNumbers } from "@/components/favorite-numbers"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface DatamartPlan {
  id: string
  data_plan: string
  plan_network: string
  month_validate: string
  plan_amount: string
  plan_type?: string
}

type Step = "form" | "confirm" | "processing" | "success" | "failed"

const PLAN_TYPE_LABELS: Record<string, string> = {
  SME: "SME",
  GIFTING: "Gifting",
  CORPORATE_GIFTING: "Corp. Gift",
  DATA_COUPONS: "Coupon",
  UNLIMITED: "Unlimited",
}

export default function DataPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, refreshUser } = useAuth()

  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<DatamartPlan | null>(null)
  const [phone, setPhone] = useState(searchParams.get("phone") || "")
  const [step, setStep] = useState<Step>("form")
  const [error, setError] = useState("")
  const [saveAsFavorite, setSaveAsFavorite] = useState(false)
  const [favoriteName, setFavoriteName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [plans, setPlans] = useState<DatamartPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansError, setPlansError] = useState("")
  const [plansStale, setPlansStale] = useState(false)
  const [plansFetchedAt, setPlansFetchedAt] = useState<string>("")
  const [activeType, setActiveType] = useState<string>("ALL")

  useEffect(() => {
    if (phone.length >= 4) {
      const detected = detectNetwork(phone)
      if (detected) setSelectedNetwork(detected)
    }
  }, [phone])

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
        if (json.stale && json.providerError) {
          setPlansError(`Showing cached plans: ${json.providerError}`)
        }
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

  // Deselect plan if network changes and plan doesn't match
  useEffect(() => {
    if (selectedNetwork && selectedPlan) {
      const isMatch = datamartNetworkMatches(selectedPlan.plan_network, selectedNetwork.name);
      if (!isMatch) {
        setSelectedPlan(null);
      }
    }
  }, [selectedNetwork, selectedPlan]);

  const planTypes = ["ALL", ...Array.from(new Set(plans.map((p) => p.plan_type || "SME").filter(Boolean)))]

  const filteredPlans = plans.filter((p) => {
    if (activeType !== "ALL" && (p.plan_type || "SME") !== activeType) return false;
    
    // If a network is selected, filter by network
    if (selectedNetwork) {
      const isMatch = datamartNetworkMatches(p.plan_network, selectedNetwork.name);
      if (!isMatch) return false;
    }
    
    return true;
  });

  const validateForm = () => {
    if (!selectedNetwork) { setError("Please select a network provider."); return false }
    if (!phone || phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return false }
    if (!selectedPlan) { setError("Please select a data bundle plan."); return false }
    const price = parseFloat(selectedPlan.plan_amount)
    if (!authUser || price > authUser.walletBalance) {
      setError("Insufficient wallet balance. Please fund your wallet.")
      return false
    }
    return true
  }

  const handleSaveFavorite = async () => {
    if (!authUser || !phone) return
    if (saveAsFavorite && !favoriteName) { toast.error("Please provide a label for this recipient."); return }
    setIsSaving(true)
    const result = await addFavorite({
      userId: authUser.id,
      phoneNumber: phone,
      name: favoriteName,
      type: "data",
      network: selectedNetwork?.name,
    })
    setIsSaving(false)
    if (result.success) {
      toast.success("Recipient saved successfully.")
      setSaveAsFavorite(false)
      setFavoriteName("")
    } else {
      toast.error(result.error || "Failed to save recipient.")
    }
  }

  const handleProceed = () => {
    setError("")
    if (validateForm()) setStep("confirm")
  }

  const handleConfirm = async () => {
    if (!selectedNetwork || !selectedPlan || !authUser) return
    setStep("processing")
    try {
      const idempotencyKey = crypto.randomUUID()
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": idempotencyKey },
        credentials: "include",
        body: JSON.stringify({
          phone,
          networkId: selectedNetwork.id,
          networkName: selectedNetwork.name,
          planId: selectedPlan.id,
          planName: selectedPlan.data_plan,
          planSize: selectedPlan.data_plan,
          planPrice: parseFloat(selectedPlan.plan_amount),
          type: "DATA",
          idempotencyKey,
        }),
      })
      const result = await response.json()
      if (result.success) {
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

  const planPrice = selectedPlan ? parseFloat(selectedPlan.plan_amount) : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-[#0052CC] transition-colors uppercase tracking-widest mb-2 group">
            <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Buy Data Bundle</h1>
          <p className="text-muted-foreground">Live data plans from MTN, Telecel & AirtelTigo via provider.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-[#0052CC]/5 border border-[#0052CC]/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC]">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {step === "confirm" ? (
          <div className="lg:col-span-12 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[#0052CC]/20 bg-[#0052CC]/5 max-w-2xl mx-auto overflow-hidden">
              <div className="bg-gradient-to-r from-[#0052CC] to-[#1A85B8] p-8 text-white relative">
                <div className="absolute right-8 top-8 w-24 h-24 bg-white/5 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Confirm Purchase</h2>
                    <p className="text-white/80 text-sm">Review your data bundle request.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Network</p>
                    <p className="text-lg font-bold">{selectedNetwork?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Recipient</p>
                    <p className="text-lg font-mono font-bold">{phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Bundle</p>
                    <p className="text-lg font-bold">{selectedPlan?.data_plan}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Amount</p>
                    <p className="text-2xl font-black">GH₵{planPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 bg-background">
                <div className="flex flex-col md:flex-row gap-4">
                  <Button variant="outline" onClick={() => setStep("form")} className="flex-1 h-12 font-bold uppercase text-xs tracking-widest border-2">
                    Go Back
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1 h-12 font-bold uppercase text-xs tracking-widest shadow-xl shadow-[#0052CC]/20 bg-gradient-to-r from-[#0052CC] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#0052CC] group">
                    Confirm & Pay
                    <Zap className="w-4 h-4 ml-2 group-hover:scale-125 transition-transform" />
                  </Button>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-dashed flex items-start gap-3">
                  <Target className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    By clicking "Confirm & Pay", you authorize an immediate debit from your wallet and dispatch of the data bundle to the recipient. This action is irreversible.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="lg:col-span-8 space-y-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Zap className="w-4 h-4 text-[#0052CC]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Network & Recipient</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-4 border-b bg-muted/20">
                      <CardTitle className="text-base">Network Provider</CardTitle>
                      <CardDescription>Select the network for this data bundle.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <NetworkSelector selected={selectedNetwork} onSelect={setSelectedNetwork} />
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-1">
                    <CardHeader className="pb-4 border-b bg-muted/20">
                      <CardTitle className="text-base">Recipient Number</CardTitle>
                      <CardDescription>Enter the phone number to receive data.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="relative">
                        <Input
                          type="tel"
                          placeholder="e.g. 024XXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="text-lg font-mono tracking-widest pr-10 h-12"
                        />
                        {phone.length >= 9 && (
                          <button
                            onClick={() => setSaveAsFavorite(!saveAsFavorite)}
                            className={cn(
                              "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
                              saveAsFavorite ? "text-[#0052CC] bg-[#0052CC]/10 shadow-sm" : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <Star className={cn("w-5 h-5", saveAsFavorite && "fill-current")} />
                          </button>
                        )}
                      </div>

                      {saveAsFavorite && (
                        <div className="p-3 rounded-lg border border-dashed border-[#0052CC]/30 bg-[#0052CC]/5 space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <Label htmlFor="fav-name" className="text-[10px] uppercase font-bold text-[#0052CC]">Save As (Label)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="fav-name"
                              placeholder="e.g. Personal, Work"
                              value={favoriteName}
                              onChange={(e) => setFavoriteName(e.target.value)}
                              className="h-9 text-sm"
                            />
                            <Button size="sm" className="h-9 px-4 font-bold uppercase text-[10px]" onClick={handleSaveFavorite} disabled={isSaving}>
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-2 text-destructive">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <p className="text-xs font-medium">{error}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#0052CC]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Available Plans</h2>
                  </div>
                  {selectedNetwork && !plansLoading && plans.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {plans.length} plans available{plansStale ? " (cached)" : ""}
                    </span>
                  )}
                </div>
                {plansStale && plansFetchedAt && (
                  <p className="px-1 text-xs text-amber-600">
                    Provider is temporarily unavailable. Showing cached plans from {new Date(plansFetchedAt).toLocaleString()}.
                  </p>
                )}

                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {plansLoading ? (
                      <div className="p-12 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                        <p className="text-sm text-muted-foreground">Fetching live plans from provider…</p>
                      </div>
                    ) : plansError ? (
                      <div className="p-8 text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                        <p className="text-sm text-destructive">{plansError}</p>
                        <Button size="sm" variant="outline" onClick={() => fetchPlans()}>
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <>
                        {planTypes.length > 2 && (
                          <div className="flex gap-2 p-3 border-b overflow-x-auto">
                            {planTypes.map((type) => (
                              <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all",
                                  activeType === type
                                    ? "bg-[#0052CC] text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {type === "ALL" ? "All" : (PLAN_TYPE_LABELS[type] || type)}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-border">
                          {filteredPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => setSelectedPlan(plan)}
                              className={cn(
                                "p-4 text-left transition-all hover:bg-muted/50 group flex items-center justify-between",
                                selectedPlan?.id === plan.id ? "bg-[#0052CC]/5 ring-1 ring-inset ring-[#0052CC]/20" : ""
                              )}
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-bold group-hover:text-[#0052CC] transition-colors">{plan.data_plan}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{plan.month_validate}</p>
                                {plan.plan_type && plan.plan_type !== "SME" && (
                                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold">
                                    {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm font-bold">GH₵{parseFloat(plan.plan_amount).toFixed(2)}</p>
                                {selectedPlan?.id === plan.id && (
                                  <Badge className="text-[8px] h-4 px-1.5 uppercase bg-[#0052CC]">Selected</Badge>
                                )}
                              </div>
                            </button>
                          ))}
                          {filteredPlans.length === 0 && (
                            <div className="md:col-span-2 p-8 text-center text-muted-foreground text-sm">
                              No plans in this category.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Users className="w-4 h-4 text-[#0052CC]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Saved Recipients</h2>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <FavoriteNumbers userId={authUser?.id ?? ""} type="data" onSelect={(val) => setPhone(val)} />
                  </CardContent>
                </Card>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="sticky top-24 border-[#0052CC]/20 bg-[#0052CC]/5">
                <CardHeader className="pb-2 border-b border-[#0052CC]/10">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0052CC]" />
                    Order Summary
                  </CardTitle>
                  <CardDescription>Pre-flight verification for your request.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#0052CC]/20">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Network</span>
                      <span className="text-sm font-bold">{selectedNetwork?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#0052CC]/20">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Recipient</span>
                      <span className="text-sm font-mono font-bold">{phone || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#0052CC]/20">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Bundle</span>
                      <span className="text-sm font-bold truncate max-w-[120px]">{selectedPlan?.data_plan || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#0052CC]/20">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Validity</span>
                      <span className="text-sm font-bold">{selectedPlan?.month_validate || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#0052CC]/20">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Wallet</span>
                      <span className="text-sm font-bold text-green-600">GH₵{Number(authUser?.walletBalance || 0).toFixed(2)}</span>
                    </div>
                    <div className="pt-4 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-[#0052CC]">Total</p>
                        <p className="text-3xl font-bold tracking-tighter">GH₵{planPrice.toFixed(2)}</p>
                      </div>
                      <div className="p-2 rounded bg-[#0052CC]/10 border border-[#0052CC]/20">
                        <CreditCard className="w-4 h-4 text-[#0052CC]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#0052CC]/20 bg-gradient-to-r from-[#0052CC] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#0052CC] group"
                      onClick={handleProceed}
                      disabled={!selectedNetwork || !phone || !selectedPlan || !authUser || plansLoading}
                    >
                      Review & Pay
                      <Zap className="w-3 h-3 ml-2 group-hover:scale-125 transition-transform" />
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                      Instant delivery processed through secure infrastructure.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      <Dialog open={["processing", "success", "failed"].includes(step)} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] text-center p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-500",
              step === "processing" ? "bg-primary/10" :
              step === "success" ? "bg-green-500/10" : "bg-destructive/10"
            )}>
              {step === "processing" && <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />}
              {step === "success" && <CheckCircle2 className="w-8 h-8 text-green-500" />}
              {step === "failed" && <AlertCircle className="w-8 h-8 text-red-500" />}
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold">
                {step === "processing" && "Processing…"}
                {step === "success" && "Bundle Activated!"}
                {step === "failed" && "Purchase Failed"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {step === "processing" && "Sending your request to network provider. Please wait…"}
                {step === "success" && `${selectedPlan?.data_plan} has been activated on ${phone}.`}
                {step === "failed" && (error || "The data bundle could not be activated. Your wallet has been refunded.")}
              </DialogDescription>
            </div>
            {step === "success" && (
              <Button onClick={() => router.push("/dashboard")} className="w-full font-bold uppercase tracking-widest text-[10px]">
                Back to Dashboard
              </Button>
            )}
            {step === "failed" && (
              <Button onClick={() => { setStep("form"); setError("") }} variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px]">
                Try Again
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
