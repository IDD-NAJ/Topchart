"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { detectNetwork, networks, type Network } from "@/lib/networks"
import { datamartNetworkMatches } from "@/lib/datamart"
import { NetworkSelector } from "@/components/network-selector"
import { ServiceGuard } from "@/components/service-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataServiceSchema } from "./schema"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Star, Zap, ShieldCheck, Target, Users, Smartphone, Receipt, Check, Database, Clock, X, Wallet, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { addFavorite } from "@/lib/actions/favorites"
import { FavoriteNumbers } from "@/components/favorite-numbers"
import { toast } from "sonner"
import { trackAdsPurchase } from "@/lib/ads"
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
  effectivePrice: number
  priceOverride: number | null
  markupPercent: number | null
  isPopular: boolean
  isActive: boolean
  isFeatured: boolean
  datamartPlanId: string | null
  datamartPlanType: string | null
}

type DatamartNetworkCode = "YELLO" | "TELECEL" | "AT_PREMIUM"

interface DatamartOrderRow {
  id: string
  phone_number: string
  network: string
  capacity: string
  price?: number | string | null
  status: string
  order_reference: string | null
  transaction_reference: string | null
  purchase_id: string | null
  idempotency_key: string
  balance_before?: number | string | null
  balance_after?: number | string | null
  processing_method?: string | null
  created_at: string
  updated_at: string
}

interface DatamartOrderStatusSnapshot {
  orderStatus?: string
  orderReference?: string
  transactionReference?: string
  purchaseId?: string
  balanceBefore?: number
  balanceAfter?: number
  price?: number
  processingMethod?: string
  updatedAt?: string
}

interface DatamartDeliveryTrackerPayload {
  stats?: {
    delivered?: number
    pending?: number
    failed?: number
  }
  lastDelivered?: Record<string, unknown> | null
  checkingNow?: Record<string, unknown> | null
  yourOrders?: Record<string, unknown> | null
  message?: string
}

const NETWORK_TO_PROVIDER: Record<string, DatamartNetworkCode> = {
  yello: "YELLO",
  mtn: "YELLO",
  mtngh: "YELLO",
  vodafone: "TELECEL",
  telecel: "TELECEL",
  voda: "TELECEL",
  airteltigo: "AT_PREMIUM",
  airtel: "AT_PREMIUM",
  tigo: "AT_PREMIUM",
  atpremium: "AT_PREMIUM",
}

const FINAL_ORDER_STATUSES = new Set(["completed", "delivered", "failed", "refunded"])
const POLL_INTERVAL_MS = 12000
const PAYSTACK_DATA_SURCHARGE = 0.04

function normalizeNetworkKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "")
}

function resolveDatamartNetworkCode(...candidates: Array<string | undefined | null>): DatamartNetworkCode | null {
  for (const candidate of candidates) {
    if (!candidate) continue
    const key = normalizeNetworkKey(candidate)
    if (NETWORK_TO_PROVIDER[key]) {
      return NETWORK_TO_PROVIDER[key]
    }
  }
  return null
}

function extractPlanCapacity(plan: DatamartPlan | null): string | null {
  if (!plan) return null
  if (plan.datamartPlanId && plan.datamartPlanId.trim().length > 0) {
    return plan.datamartPlanId.trim()
  }
  const numericMatch = plan.name.match(/([\d.]+)/)
  if (numericMatch) {
    return numericMatch[1]
  }
  return null
}

function normalizeProviderPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("233")) return `0${digits.slice(3)}`
  return digits.startsWith("0") ? digits : `0${digits.slice(-9)}`
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
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "paystack">("wallet")
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
  const [plansProviderError, setPlansProviderError] = useState<string>("")
  const [planAvailability, setPlanAvailability] = useState<Record<string, boolean>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [activeType, setActiveType] = useState<string>("ALL")
  const [favoritesRefreshKey, setFavoritesRefreshKey] = useState(0)
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState<string | null>(null)
  const [currentOrder, setCurrentOrder] = useState<DatamartOrderRow | null>(null)
  const [orderStatusSnapshot, setOrderStatusSnapshot] = useState<DatamartOrderStatusSnapshot | null>(null)
  const [pollingOrder, setPollingOrder] = useState(false)
  const [pollError, setPollError] = useState<string | null>(null)
  const [deliveryTracker, setDeliveryTracker] = useState<DatamartDeliveryTrackerPayload | null>(null)
  const [correlationId, setCorrelationId] = useState<string>("")
  const [newWalletBalance, setNewWalletBalance] = useState<number | null>(null)
  const pollTimerRef = useRef<number | null>(null)
  const pendingPhoneRef = useRef<string>("")
  const pendingNetworkIdRef = useRef<string | null>(null)
  const confirmTimerRef = useRef<number | null>(null)
  const successTimerRef = useRef<number | null>(null)
  const processingRedirectTimerRef = useRef<number | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [successCountdown, setSuccessCountdown] = useState<number>(0)
  const [processingRedirectCountdown, setProcessingRedirectCountdown] = useState<number>(0)

  const closeConfirmToForm = useCallback(() => {
    if (confirmTimerRef.current) {
      clearInterval(confirmTimerRef.current)
      confirmTimerRef.current = null
    }
    setCountdown(0)
    setStep("form")
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const dismissOutcomeDialogToForm = useCallback(() => {
    stopPolling()
    if (successTimerRef.current) {
      clearInterval(successTimerRef.current)
      successTimerRef.current = null
    }
    if (processingRedirectTimerRef.current) {
      clearInterval(processingRedirectTimerRef.current)
      processingRedirectTimerRef.current = null
    }
    setProcessingRedirectCountdown(0)
    setPollingOrder(false)
    setPollError(null)
    setCurrentOrder(null)
    setOrderStatusSnapshot(null)
    setCorrelationId("")
    setNewWalletBalance(null)
    setDeliveryTracker(null)
    setSelectedPlan(null)
    setError("")
    setStep("form")
  }, [stopPolling])

  useEffect(() => {
    if (phone.length >= 4) {
      const detected = detectNetwork(phone)
      if (detected) setSelectedNetwork(detected)
    }
  }, [phone])

  useEffect(() => {
    setRecentRecipients(getRecentRecipients())
  }, [])

  useEffect(() => {
    if (step === "confirm") {
      setCountdown(30)
      confirmTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (confirmTimerRef.current) {
              clearInterval(confirmTimerRef.current)
              confirmTimerRef.current = null
            }
            queueMicrotask(closeConfirmToForm)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (confirmTimerRef.current) {
        clearInterval(confirmTimerRef.current)
        confirmTimerRef.current = null
      }
      setCountdown(0)
    }

    return () => {
      if (confirmTimerRef.current) {
        clearInterval(confirmTimerRef.current)
        confirmTimerRef.current = null
      }
    }
  }, [step, closeConfirmToForm])

  useEffect(() => {
    if (step === "success") {
      setSuccessCountdown(30)
      successTimerRef.current = window.setInterval(() => {
        setSuccessCountdown((prev) => {
          if (prev <= 1) {
            if (successTimerRef.current) {
              clearInterval(successTimerRef.current)
              successTimerRef.current = null
            }
            queueMicrotask(dismissOutcomeDialogToForm)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (successTimerRef.current) {
        clearInterval(successTimerRef.current)
        successTimerRef.current = null
      }
      setSuccessCountdown(0)
    }

    return () => {
      if (successTimerRef.current) {
        clearInterval(successTimerRef.current)
        successTimerRef.current = null
      }
    }
  }, [step, dismissOutcomeDialogToForm])

  useEffect(() => {
    if (step === "processing" && currentOrder) {
      setProcessingRedirectCountdown(30)
      processingRedirectTimerRef.current = window.setInterval(() => {
        setProcessingRedirectCountdown((prev) => {
          if (prev <= 1) {
            if (processingRedirectTimerRef.current) {
              clearInterval(processingRedirectTimerRef.current)
              processingRedirectTimerRef.current = null
            }
            queueMicrotask(() => {
              stopPolling()
              setPollingOrder(false)
              setPollError(null)
              setCurrentOrder(null)
              setOrderStatusSnapshot(null)
              setCorrelationId("")
              setNewWalletBalance(null)
              setDeliveryTracker(null)
              setSelectedPlan(null)
              setError("")
              setStep("form")
              router.push("/dashboard#system-activity")
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (processingRedirectTimerRef.current) {
        clearInterval(processingRedirectTimerRef.current)
        processingRedirectTimerRef.current = null
      }
      setProcessingRedirectCountdown(0)
    }

    return () => {
      if (processingRedirectTimerRef.current) {
        clearInterval(processingRedirectTimerRef.current)
        processingRedirectTimerRef.current = null
      }
    }
  }, [step, currentOrder, stopPolling, router])

  const fetchAvailability = useCallback(async () => {
    setAvailabilityLoading(true)
    try {
      const res = await fetch("/api/purchases/plans/availability", { credentials: "include" })
      const json = await res.json()
      if (json.success && json.data) setPlanAvailability(json.data)
    } catch {
    } finally {
      setAvailabilityLoading(false)
    }
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
        setPlansProviderError(json.providerError || "")
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
    fetchAvailability()
  }, [fetchPlans, fetchAvailability])

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

  const NETWORK_TO_DATAMART: Record<string, string> = {
    mtn: "YELLO", MTN: "YELLO",
    vodafone: "TELECEL", telecel: "TELECEL", Telecel: "TELECEL",
    airteltigo: "AT_PREMIUM", AirtelTigo: "AT_PREMIUM", "airtel-tigo": "AT_PREMIUM", at: "AT_PREMIUM",
  }

  const getPlanAvailability = (plan: DatamartPlan): boolean | undefined => {
    if (Object.keys(planAvailability).length === 0) return undefined
    const networkKey = plan.network ?? ""
    const dmNetwork = NETWORK_TO_DATAMART[networkKey] ?? NETWORK_TO_DATAMART[networkKey.toLowerCase()] ?? null
    if (!dmNetwork || !plan.datamartPlanId) return undefined
    const capacity = String(plan.datamartPlanId).replace(/[^0-9]/g, "")
    if (!capacity) return undefined
    const key = `${dmNetwork}_${capacity}`
    return key in planAvailability ? planAvailability[key] : undefined
  }

  const validateForm = () => {
    if (!selectedNetwork) { setError("Please select a network provider."); return false }
    if (!phone || !/^0\d{9}$/.test(phone)) { setError("Please enter a valid 10-digit phone number starting with 0."); return false }
    if (!selectedPlan) { setError("Please select a data bundle plan."); return false }
    const price = selectedPlan.effectivePrice
    if (paymentMethod === "wallet") {
      if (!authUser || price > authUser.walletBalance) {
        setError("Insufficient wallet balance. Switch to Paystack or fund your wallet.")
        return false
      }
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

  const loadDeliveryTracker = useCallback(async () => {
    try {
      const res = await fetch("/api/datamart/delivery-tracker", { cache: "no-store" })
      const json = await res.json()
      if (json.success) {
        setDeliveryTracker(json.data as DatamartDeliveryTrackerPayload)
      } else {
        setDeliveryTracker(null)
      }
    } catch {
      setDeliveryTracker(null)
    }
  }, [])

  const finalizeOrderStatus = useCallback(
    async (status: string, order: DatamartOrderRow, snapshot?: DatamartOrderStatusSnapshot | null) => {
      stopPolling()
      setPollingOrder(false)
      const lowered = status.toLowerCase()
      if (lowered === "completed") {
        setStep("success")
        const localPhone = normalizeProviderPhone(pendingPhoneRef.current || order.phone_number || "")
        if (localPhone) {
          const networkId = pendingNetworkIdRef.current || normalizeNetworkId(order.network, selectedNetwork?.id)
          addRecentRecipient(localPhone, networkId || "mtn")
          setRecentRecipients(getRecentRecipients())
        }
        await refreshUser()
        await loadDeliveryTracker()
      } else {
        const message = snapshot?.orderStatus || order.status || "Transaction declined by provider."
        setError(message)
        setStep("failed")
        await refreshUser()
      }
    },
    [loadDeliveryTracker, refreshUser, selectedNetwork?.id, stopPolling]
  )

  const handleConfirm = async () => {
    if (!validateForm()) return
    stopPolling()
    setPollError(null)
    setDeliveryTracker(null)
    setCurrentOrder(null)
    setOrderStatusSnapshot(null)
    setCorrelationId("")
    setNewWalletBalance(null)

    const idempotencyKey = crypto.randomUUID()
    setCurrentIdempotencyKey(idempotencyKey)
    pendingPhoneRef.current = phone
    pendingNetworkIdRef.current = selectedNetwork?.id || null

    const networkCode = resolveDatamartNetworkCode(selectedPlan?.network, selectedNetwork?.id, selectedNetwork?.name)
    if (!networkCode) {
      setError("Selected network is temporarily unavailable.")
      setStep("failed")
      return
    }

    const capacity = extractPlanCapacity(selectedPlan)
    if (!capacity) {
      setError("Unable to determine the selected bundle capacity.")
      setStep("failed")
      return
    }

    setStep("processing")

    try {
      if (paymentMethod === "paystack") {
        const response = await fetch("/api/datamart/purchase/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-idempotency-key": idempotencyKey },
          credentials: "include",
          body: JSON.stringify({
            phoneNumber: phone,
            network: networkCode,
            capacity,
            idempotencyKey,
            effectivePrice: selectedPlan?.effectivePrice,
          }),
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
          const message = result?.error || "Could not start Paystack checkout."
          setError(message)
          setStep("failed")
          return
        }
        const authUrl = result.data?.authorization_url as string | undefined
        if (!authUrl) {
          setError("Checkout URL missing. Please try again.")
          setStep("failed")
          return
        }
        setCorrelationId(result.data?.correlation_id || result.correlationId || "")
        window.location.href = authUrl
        return
      }

      const response = await fetch("/api/datamart/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": idempotencyKey },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: phone,
          network: networkCode,
          capacity,
          idempotencyKey,
          effectivePrice: selectedPlan?.effectivePrice,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        const message = result?.error || "Transaction declined by provider."
        setError(message)
        setStep("failed")
        return
      }

      setCorrelationId(result.correlationId || "")
      if (typeof result.newBalance === "number") setNewWalletBalance(result.newBalance)
      if (paymentMethod === "wallet" && result.reference) {
        try {
          trackAdsPurchase(result.reference, {
            value: selectedPlan?.effectivePrice ?? 0,
            currency: "GHS",
          })
        } catch {}
      }
      const order = result.data as DatamartOrderRow | null
      if (!order) {
        setError("Provider did not return order details. Please try again.")
        setStep("failed")
        return
      }

      setCurrentOrder(order)
      const snapshot: DatamartOrderStatusSnapshot = {
        orderStatus: order.status,
        orderReference: order.order_reference || undefined,
        transactionReference: order.transaction_reference || undefined,
        purchaseId: order.purchase_id || undefined,
        price: typeof order.price === "number" ? order.price : Number(order.price || 0) || undefined,
        balanceBefore: typeof order.balance_before === "number" ? order.balance_before : Number(order.balance_before || 0) || undefined,
        balanceAfter: typeof order.balance_after === "number" ? order.balance_after : Number(order.balance_after || 0) || undefined,
        processingMethod: order.processing_method || undefined,
        updatedAt: order.updated_at,
      }
      setOrderStatusSnapshot(snapshot)

      const normalizedStatus = (order.status || "").toLowerCase()
      if (normalizedStatus && FINAL_ORDER_STATUSES.has(normalizedStatus)) {
        await finalizeOrderStatus(normalizedStatus, order, snapshot)
      } else if (order.order_reference) {
        setPollingOrder(true)
      } else {
        setPollingOrder(false)
      }
    } catch (err) {
      console.error(err)
      setError(
        paymentMethod === "paystack"
          ? "Connectivity issue. Try again or use wallet balance."
          : "Connectivity issue. Your balance remains unchanged."
      )
      setStep("failed")
      await refreshUser()
    }
  }

  useEffect(() => {
    if (!pollingOrder || !currentOrder?.order_reference) {
      return
    }

    let isMounted = true

    const poll = async (refresh: boolean) => {
      try {
        const res = await fetch(`/api/datamart/orders/${currentOrder.order_reference}?refresh=${refresh ? "true" : "false"}`, {
          cache: "no-store",
        })
        const json = await res.json()
        if (!isMounted) return

        if (!json.success) {
          setPollError(json.error || "Unable to refresh order status. We will try again shortly.")
          return
        }

        setPollError(null)
        if (json.correlationId) setCorrelationId(json.correlationId)
        const order = json.data?.order as DatamartOrderRow | null
        const statusPayload = json.data?.status as DatamartOrderStatusSnapshot | null
        if (order) {
          setCurrentOrder(order)
        }
        if (statusPayload) {
          setOrderStatusSnapshot(statusPayload)
        }
        const nextStatus = (statusPayload?.orderStatus || order?.status || "").toLowerCase()
        if (nextStatus && FINAL_ORDER_STATUSES.has(nextStatus) && order) {
          await finalizeOrderStatus(nextStatus, order, statusPayload)
        }
      } catch {
        if (!isMounted) return
        setPollError("Unable to refresh order status. We will try again shortly.")
      }
    }

    poll(true)
    const timer = window.setInterval(() => {
      poll(false)
    }, POLL_INTERVAL_MS)
    pollTimerRef.current = timer

    return () => {
      isMounted = false
      if (timer) window.clearInterval(timer)
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [currentOrder?.order_reference, finalizeOrderStatus, pollingOrder])

  useEffect(() => {
    const paystackOk = searchParams.get("paystack_ok")
    const oref = searchParams.get("oref")
    if (paystackOk !== "1" || !oref) return

    const idc = searchParams.get("idc") || ""
    const stripResumeParams = () => {
      const p = new URLSearchParams(searchParams.toString())
      p.delete("paystack_ok")
      p.delete("oref")
      p.delete("idc")
      const qs = p.toString()
      router.replace(qs ? `/dashboard/data?${qs}` : "/dashboard/data")
    }

    if (typeof window !== "undefined") {
      const consumedKey = `datamart_ps_resume:${oref}:${idc}`
      if (sessionStorage.getItem(consumedKey)) {
        stripResumeParams()
        return
      }
      sessionStorage.setItem(consumedKey, "1")
    }

    void (async () => {
      stopPolling()
      setPollError(null)
      setDeliveryTracker(null)
      setNewWalletBalance(null)
      setPaymentMethod("paystack")
      setCorrelationId("")
      if (idc) setCurrentIdempotencyKey(idc)
      setStep("processing")

      try {
        const res = await fetch(`/api/datamart/orders/${encodeURIComponent(oref)}?refresh=true`, { cache: "no-store" })
        const json = await res.json()
        if (!json.success) {
          setError(json.error || "Could not load order status.")
          setStep("failed")
          stripResumeParams()
          return
        }
        if (typeof json.correlationId === "string" && json.correlationId) setCorrelationId(json.correlationId)
        const order = json.data?.order as DatamartOrderRow | null
        const statusPayload = json.data?.status as DatamartOrderStatusSnapshot | null
        if (!order) {
          setError("Order not found.")
          setStep("failed")
          stripResumeParams()
          return
        }
        const digits = normalizeProviderPhone(order.phone_number || "")
        if (digits) setPhone(digits)
        pendingPhoneRef.current = digits || pendingPhoneRef.current
        pendingNetworkIdRef.current = normalizeNetworkId(String(order.network || ""), pendingNetworkIdRef.current || undefined)
        setCurrentOrder(order)
        const snapshot: DatamartOrderStatusSnapshot =
          statusPayload && (statusPayload.orderStatus || statusPayload.orderReference)
            ? statusPayload
            : {
                orderStatus: order.status,
                orderReference: order.order_reference || undefined,
                transactionReference: order.transaction_reference || undefined,
                purchaseId: order.purchase_id || undefined,
                price: typeof order.price === "number" ? order.price : Number(order.price || 0) || undefined,
                balanceBefore: typeof order.balance_before === "number" ? order.balance_before : Number(order.balance_before || 0) || undefined,
                balanceAfter: typeof order.balance_after === "number" ? order.balance_after : Number(order.balance_after || 0) || undefined,
                processingMethod: order.processing_method || undefined,
                updatedAt: order.updated_at,
              }
        setOrderStatusSnapshot(snapshot)
        const normalizedStatus = (snapshot.orderStatus || order.status || "").toLowerCase()
        if (normalizedStatus && FINAL_ORDER_STATUSES.has(normalizedStatus)) {
          await finalizeOrderStatus(normalizedStatus, order, snapshot)
        } else if (order.order_reference) {
          setPollingOrder(true)
        } else {
          setPollingOrder(false)
        }
      } catch {
        setError("Unable to resume purchase.")
        setStep("failed")
      }
      stripResumeParams()
    })()
  }, [searchParams, router, stopPolling, finalizeOrderStatus])

  const planPrice = selectedPlan ? selectedPlan.effectivePrice : 0
  const planPaystackFee = Number((planPrice * PAYSTACK_DATA_SURCHARGE).toFixed(2))
  const planPaystackTotal = Number((planPrice + planPaystackFee).toFixed(2))

  return (
    <ServiceGuard serviceKey="data">
    <DataServiceSchema />
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
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Review Purchase</h2>
                    <p className="text-primary-foreground/80">Please verify the details below</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeConfirmToForm}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/60 hover:bg-white/70 transition-colors cursor-pointer border border-white/50"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-neutral-900" />
                  </button>
                  {countdown > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                      <Clock className="w-4 h-4 text-white" />
                      <span className="text-sm font-medium text-white">{countdown}s</span>
                    </div>
                  )}
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
                <div className="col-span-2 bg-white/10 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Bundle</p>
                      <p className="text-2xl font-bold mt-1">{selectedPlan?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Pay with</p>
                      <p className="text-lg font-bold mt-1">{paymentMethod === "wallet" ? "Wallet" : "Paystack"}</p>
                    </div>
                  </div>
                  {paymentMethod === "paystack" ? (
                    <div className="flex flex-col items-end gap-0.5 text-sm border-t border-white/20 pt-3 text-white/95">
                      <div className="flex justify-between w-full max-w-[240px] gap-4">
                        <span className="text-white/70">Bundle price</span>
                        <span>GH₵ {planPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-full max-w-[240px] gap-4">
                        <span className="text-white/70">Fee (4%)</span>
                        <span>GH₵ {planPaystackFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-full max-w-[240px] gap-4 font-bold text-green-300 text-lg mt-1">
                        <span>Total</span>
                        <span>GH₵ {planPaystackTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-end border-t border-white/20 pt-3">
                      <span className="text-sm font-medium text-white/70 uppercase tracking-wider">You pay</span>
                      <p className="text-2xl font-bold text-green-300">GH₵ {planPrice.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 bg-card space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Payment method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("wallet")
                      setError("")
                    }}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all",
                      paymentMethod === "wallet" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="font-semibold text-sm">Wallet</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Bal: GH₵ {authUser ? authUser.walletBalance.toFixed(2) : "0.00"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("paystack")
                      setError("")
                    }}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all",
                      paymentMethod === "paystack" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="font-semibold text-sm">Paystack</p>
                    </div>
                    <p className="text-xs text-muted-foreground">+4% processing fee</p>
                  </button>
                </div>
              </div>

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
                  onClick={closeConfirmToForm} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  size="lg"
                  onClick={() => {
                    if (confirmTimerRef.current) {
                      clearInterval(confirmTimerRef.current)
                      confirmTimerRef.current = null
                    }
                    handleConfirm()
                  }} 
                  className="flex-1"
                  disabled={paymentMethod === "wallet" && (!authUser || planPrice > authUser.walletBalance)}
                >
                  {paymentMethod === "paystack" ? (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Pay GH₵ {planPaystackTotal.toFixed(2)}
                    </>
                  ) : (
                    <>
                      Confirm & pay GH₵ {planPrice.toFixed(2)}
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </>
                  )}
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
                  <div className="flex items-center gap-2">
                    {plansStale && !plansLoading && plans.length > 0 && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-500 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Cached data
                      </span>
                    )}
                    {selectedNetwork && !plansLoading && plans.length > 0 && (
                      <span className="text-sm font-medium text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                        {filteredPlans.length} available
                      </span>
                    )}
                    {!plansLoading && plans.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => fetchPlans()}
                        className="h-7 px-2 text-xs"
                        title="Refresh plans"
                      >
                        <Database className="w-3.5 h-3.5 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
                {plansStale && plansFetchedAt && plansProviderError && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                    Showing cached plans from {new Date(plansFetchedAt).toLocaleDateString()}.
                  </p>
                )}
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
                              category: "other",
                              isPopular: plan.isPopular,
                              description: plan.datamartPlanType ? `Type: ${PLAN_TYPE_LABELS[plan.datamartPlanType] || plan.datamartPlanType}` : undefined,
                            }}
                            onPurchase={() => setSelectedPlan(plan)}
                            inStock={getPlanAvailability(plan)}
                            availabilityLoading={availabilityLoading}
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

                <div className="pt-4 border-t border-dashed space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Payment method</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("wallet")
                          setError("")
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          paymentMethod === "wallet" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                          <p className="font-semibold text-sm">Wallet</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          GH₵ {authUser ? authUser.walletBalance.toFixed(2) : "0.00"}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("paystack")
                          setError("")
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          paymentMethod === "paystack" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                          <p className="font-semibold text-sm">Paystack</p>
                        </div>
                        <p className="text-xs text-muted-foreground">+4% fee</p>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === "paystack" ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Bundle price</span>
                        <span className="font-medium">GH₵ {planPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Fee (4%)</span>
                        <span className="font-medium">GH₵ {planPaystackFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-1">
                        <span className="text-sm font-medium text-muted-foreground">Total charge</span>
                        <span className="text-3xl font-bold tracking-tight text-primary">GH₵ {planPaystackTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-muted-foreground">Total to Pay</span>
                      <span className="text-3xl font-bold tracking-tight">GH₵ {planPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-muted-foreground">Wallet Balance</span>
                    <span
                      className={cn(
                        "font-medium",
                        paymentMethod === "wallet" && authUser && planPrice > authUser.walletBalance
                          ? "text-destructive"
                          : "text-green-600"
                      )}
                    >
                      GH₵ {authUser ? authUser.walletBalance.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    size="lg"
                    className="w-full h-14 text-base font-bold shadow-lg transition-transform hover:scale-[1.02]"
                    onClick={handleProceed}
                    disabled={
                      !selectedNetwork ||
                      phone.length < 9 ||
                      !selectedPlan ||
                      plansLoading ||
                      (paymentMethod === "wallet" && (!authUser || planPrice > authUser.walletBalance))
                    }
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
        if (!open) {
          dismissOutcomeDialogToForm()
        }
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
                {step === "processing" && (currentOrder ? "Order Confirmation" : "Processing")}
                {step === "success" && "Transaction Successful"}
                {step === "failed" && "Transaction Failed"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {step === "processing" && (
                  currentOrder
                    ? `Your order has been confirmed. Status: ${(orderStatusSnapshot?.orderStatus || currentOrder.status || "pending").toLowerCase().replace(/_/g, " ")}`
                    : "Please wait while we secure your transaction."
                )}
                {step === "success" && (orderStatusSnapshot?.orderStatus ? `${orderStatusSnapshot.orderStatus.toLowerCase().replace(/_/g, " ")}. Data delivered to ${normalizeProviderPhone(pendingPhoneRef.current || phone)}.` : `${selectedPlan?.name} delivered.`)}
                {step === "failed" && (error || "Your transaction could not be completed.")}
              </DialogDescription>
            </div>

              {currentOrder && (
              <div className="w-full space-y-3 rounded-xl border border-muted/60 p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    (orderStatusSnapshot?.orderStatus || currentOrder.status || "pending").toLowerCase() === "completed" || (orderStatusSnapshot?.orderStatus || currentOrder.status || "pending").toLowerCase() === "delivered"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : (orderStatusSnapshot?.orderStatus || currentOrder.status || "pending").toLowerCase() === "failed" || (orderStatusSnapshot?.orderStatus || currentOrder.status || "pending").toLowerCase() === "refunded"
                      ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    {(orderStatusSnapshot?.orderStatus || currentOrder.status || "pending").toLowerCase().replace(/_/g, " ")}
                  </span>
                </div>
                {currentOrder.order_reference && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Order Ref</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(currentOrder.order_reference || "")
                          toast.success("Order reference copied")
                        } catch {
                          toast.error("Unable to copy reference")
                        }
                      }}
                      className="font-mono text-primary underline-offset-2 hover:underline"
                    >
                      {currentOrder.order_reference}
                    </button>
                  </div>
                )}
                {orderStatusSnapshot?.transactionReference && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Transaction Ref</span>
                    <span className="font-mono">{orderStatusSnapshot.transactionReference}</span>
                  </div>
                )}
                {pollingOrder && (
                  <div className="text-xs text-muted-foreground">Refreshing provider status automatically…</div>
                )}
                {step === "processing" && processingRedirectCountdown > 0 && (
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    Redirecting to dashboard in {processingRedirectCountdown}s…
                  </div>
                )}
                {!pollingOrder && step === "processing" && !currentOrder.order_reference && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 mt-1">
                    Your order is queued with the provider. Data delivery may take 2–15 minutes. Check your dashboard for updates.
                  </div>
                )}
                {pollError && (
                  <div className="text-xs text-destructive">{pollError}</div>
                )}
              </div>
            )}

            {step === "processing" && currentOrder && !pollingOrder && !currentOrder.order_reference && (
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  dismissOutcomeDialogToForm()
                  router.push("/dashboard")
                }}
              >
                View Dashboard
              </Button>
            )}

            {step === "success" && (
              <div className="flex flex-col gap-3 w-full mt-4">
                {newWalletBalance !== null && (
                  <div className="w-full rounded-xl border border-green-200 bg-green-50 p-4 text-left">
                    <p className="text-sm font-semibold text-green-700 mb-1">Wallet Balance</p>
                    <p className="text-2xl font-bold text-green-700">GH₵ {newWalletBalance.toFixed(2)}</p>
                  </div>
                )}
                {deliveryTracker && (
                  <div className="w-full rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
                    <p className="text-sm font-semibold text-primary mb-3">Delivery Snapshot</p>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                        <p className="text-[11px] uppercase text-muted-foreground">Delivered</p>
                        <p className="text-lg font-bold">{deliveryTracker.stats?.delivered ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                        <p className="text-[11px] uppercase text-muted-foreground">Pending</p>
                        <p className="text-lg font-bold">{deliveryTracker.stats?.pending ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                        <p className="text-[11px] uppercase text-muted-foreground">Failed</p>
                        <p className="text-lg font-bold">{deliveryTracker.stats?.failed ?? 0}</p>
                      </div>
                    </div>
                    {deliveryTracker.message && (
                      <p className="mt-3 text-xs text-muted-foreground">{deliveryTracker.message}</p>
                    )}
                  </div>
                )}
                <Button onClick={() => {
                  dismissOutcomeDialogToForm()
                }} variant="outline" className="w-full h-12">
                  Buy Another
                </Button>
                <Button onClick={() => {
                  dismissOutcomeDialogToForm()
                  router.push("/dashboard")
                }} className="w-full h-12">
                  Return to Dashboard
                </Button>
                {successCountdown > 0 && (
                  <p className="text-xs text-muted-foreground text-center">Auto-closing in {successCountdown}s…</p>
                )}
              </div>
            )}
            
            {step === "failed" && (
              <Button onClick={() => { dismissOutcomeDialogToForm() }} className="w-full h-12">
                Try Again
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ServiceGuard>
  )
}

