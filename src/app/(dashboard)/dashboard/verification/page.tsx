"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import { ServiceGuard } from "@/components/service-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  MessageCircle,
  CreditCard,
  Briefcase,
  Play,
  Clock,
  Loader2,
  Shield,
  AlertCircle,
  X,
  Check,
  RefreshCw,
  Copy,
  Wallet,
  ExternalLink,
  History,
  Settings,
  Save,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowUpDown,
  Globe,
  Filter,
  Search,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = [
  { id: "social_media", name: "Social Media", shortName: "Social", icon: MessageCircle, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial", shortName: "E-Commerce", icon: CreditCard, color: "text-green-600 bg-green-50 dark:bg-green-950/40" },
  { id: "professional_tools", name: "Professional Tools", shortName: "Professional", icon: Briefcase, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment", shortName: "Streaming", icon: Play, color: "text-red-600 bg-red-50 dark:bg-red-950/40" },
]

const LTR_OPTIONS = [
  { days: 3, label: "3 Days" },
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
]



interface Service {
  id: string
  pvadeals_service_id: string
  name: string
  category: string
  picture_url?: string
  country?: string
  str_price: number
  ltr3_price: number
  ltr7_price: number
  ltr14_price: number
  ltr30_price: number
  markup_percentage?: number
}

interface ActiveNumber {
  id: string
  number: string
  service_name: string
  service_category: string
  type: "STR" | "LTR"
  status: string
  time_remaining_formatted: string
  is_expired: boolean
  sms_count: number
  allow_reuse: boolean
  allow_flag: boolean
  auto_renew: boolean
  ltr_duration_days?: number
}

interface PurchaseModal {
  service: Service | null
  type: "STR" | "LTR"
  ltrDays: number
  areaCode: string
  paymentMethod: "wallet" | "paystack"
  purchasing: boolean
  result: { number: string; expires_at: string; price: number } | null
  error: string | null
}

function getLtrPrice(svc: Service, days: number): number {
  if (days <= 3) return svc.ltr3_price
  if (days <= 7) return svc.ltr7_price
  if (days <= 14) return svc.ltr14_price
  return svc.ltr30_price
}

export default function VerificationPage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const isAdmin = (user as any)?.role === 'admin'
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [activeNumbers, setActiveNumbers] = useState<ActiveNumber[]>([])
  const [selectedCategory, setSelectedCategory] = useState("social_media")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc">("name")
  const [countryFilter, setCountryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "str" | "ltr">("all")

  // Admin pricing panel state
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [adminServices, setAdminServices] = useState<(Service & { is_active: boolean; purchase_count?: number })[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminEdits, setAdminEdits] = useState<Record<string, { markup_percentage?: number; is_active?: boolean }>>({})
  const [adminSaving, setAdminSaving] = useState<string | null>(null)
  const [adminSyncing, setAdminSyncing] = useState(false)
  const [modal, setModal] = useState<PurchaseModal>({
    service: null,
    type: "STR",
    ltrDays: 3,
    areaCode: "",
    paymentMethod: "wallet",
    purchasing: false,
    result: null,
    error: null,
  })
  const [areaCodesLoading, setAreaCodesLoading] = useState(false)
  const [areaCodes, setAreaCodes] = useState<{ code: string; state: string }[]>([])
  const [areaCodeFallback, setAreaCodeFallback] = useState(false)
  const [globalAreaCodes, setGlobalAreaCodes] = useState<{ code: string; state: string }[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  
  // Global pricing settings
  const [exchangeRate, setExchangeRate] = useState(15.5)

  // Fetch global area codes on mount
  useEffect(() => {
    const fetchGlobalAreaCodes = async () => {
      try {
        console.log("Fetching global area codes from API");
        const res = await fetch("/api/verification/area-codes")
        let data: any = null
        try { data = await res.json() } catch { /* non-JSON response */ }
        console.log("Global area codes response:", data);
        if (data?.success && data?.data?.areaCodes?.length > 0) {
          setGlobalAreaCodes(data.data.areaCodes)
          console.log(`Set ${data.data.areaCodes.length} global area codes`);
          setApiError(null)
        } else {
          console.log("No global area codes found in response, message:", data?.message);
          setApiError(data?.message || "No area codes available")
        }
      } catch (error) {
        console.error("Failed to fetch global area codes:", error);
        setApiError(error instanceof Error ? error.message : "Failed to fetch area codes")
      }
    }
    fetchGlobalAreaCodes()
  }, [])

  // Fetch area codes when modal opens with a service
  useEffect(() => {
    if (!modal.service) return

    const fetchAreaCodes = async () => {
      setAreaCodesLoading(true)
      setAreaCodeFallback(false)

      try {
        console.log(`Fetching area codes for service: ${modal.service?.pvadeals_service_id}`);
        const res = await fetch(`/api/verification/area-codes/${modal.service?.pvadeals_service_id}`)
        let data: any = null
        try { data = await res.json() } catch { /* non-JSON response */ }
        console.log(`Area codes response:`, data);

        if (data?.success && data?.data?.areaCodes?.length > 0) {
          setAreaCodes(data?.data?.areaCodes || [])
          setAreaCodeFallback(data?.fallback || false)
          console.log(`Set ${data?.data?.areaCodes?.length || 0} area codes for service`);
        } else if (globalAreaCodes.length > 0) {
          setAreaCodes(globalAreaCodes)
          setAreaCodeFallback(true)
          console.log(`Using ${globalAreaCodes.length} global area codes as fallback`);
        } else {
          setAreaCodes([])
          setAreaCodeFallback(true)
          console.log("No area codes available - user can leave field empty");
        }
      } catch (error) {
        console.error("Error fetching area codes:", error);
        if (globalAreaCodes.length > 0) {
          setAreaCodes(globalAreaCodes)
          setAreaCodeFallback(true)
          console.log(`Using ${globalAreaCodes.length} global area codes as fallback after error`);
        } else {
          setAreaCodes([])
          setAreaCodeFallback(true)
          console.log("No area codes available after error - user can leave field empty");
        }
      } finally {
        setAreaCodesLoading(false)
      }
    }

    fetchAreaCodes()
  }, [modal.service, globalAreaCodes])

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/services")
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success) {
        setServices(data?.data?.services || [])
        if (data?.data?.exchange_rate) {
          setExchangeRate(data.data.exchange_rate)
        }
        setError(null)
      } else {
        const errorMsg = data?.error || (res.status === 401 ? "Please sign in to view services" : "Failed to load services")
        setError(errorMsg)
      }
    } catch {
      setError("Failed to load services. Check your connection and try again.")
    }
  }, [])

  const fetchAdminServices = useCallback(async () => {
    if (!isAdmin) return
    setAdminLoading(true)
    try {
      const res = await fetch("/api/admin/verification/services")
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success) setAdminServices(data?.data?.services)
    } catch {}
    finally { setAdminLoading(false) }
  }, [isAdmin])

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verification/settings")
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success && data?.data?.exchangeRate) {
        setExchangeRate(data.data.exchangeRate)
      }
    } catch { /* ignore - use default */ }
  }, [])

  const handleAdminSave = async (serviceId: string) => {
    const edit = adminEdits[serviceId]
    if (!edit) return
    setAdminSaving(serviceId)
    try {
      const res = await fetch("/api/admin/verification/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, ...edit }),
      })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success) {
        toast({ title: "Saved", description: "Service updated successfully" })
        setAdminEdits(prev => { const u = { ...prev }; delete u[serviceId]; return u })
        fetchAdminServices()
        fetchServices()
      } else {
        toast({ title: "Error", description: data?.error || "Failed to save", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" })
    } finally { setAdminSaving(null) }
  }

  const handleAdminSync = async () => {
    setAdminSyncing(true)
    try {
      const res = await fetch("/api/admin/verification/sync", { method: "POST" })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success) {
        toast({ title: "Synced", description: data?.data?.message || "Services synced from PVADeals" })
        fetchAdminServices()
        fetchServices()
      } else {
        toast({ title: "Sync failed", description: data?.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Sync request failed", variant: "destructive" })
    } finally { setAdminSyncing(false) }
  }

  const fetchActiveNumbers = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/numbers?status=active")
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success) setActiveNumbers(data?.data?.numbers || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refreshUser()
    fetchServices()
    fetchActiveNumbers()
    fetchGlobalSettings()
  }, [fetchServices, fetchActiveNumbers, refreshUser, fetchGlobalSettings])

  useEffect(() => {
    if (isAdmin && adminPanelOpen && adminServices.length === 0) {
      fetchAdminServices()
    }
  }, [isAdmin, adminPanelOpen, adminServices.length, fetchAdminServices])

  const openModal = (service: Service) => {
    setModal({ service, type: "STR", ltrDays: 3, areaCode: "", paymentMethod: "wallet", purchasing: false, result: null, error: null })
  }

  const closeModal = () => {
    setModal(m => ({ ...m, service: null, result: null, error: null }))
  }

  const handlePurchase = async () => {
    if (!modal.service) return

    if (modal.paymentMethod === "paystack") {
      setModal(m => ({ ...m, purchasing: true, error: null }))
      try {
        const res = await fetch("/api/verification/purchase/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pvadealsServiceId: modal.service!.pvadeals_service_id,
            type: modal.type,
            ltrDays: modal.ltrDays,
            areaCode: modal.areaCode || undefined,
          }),
        })
        let data: any = null
        try { data = await res.json() } catch { /* non-JSON response */ }
        if (data?.success && data?.data?.authorization_url) {
          window.location.href = data.data.authorization_url
        } else {
          setModal(m => ({ ...m, purchasing: false, error: data?.error || "Failed to initialize payment" }))
        }
      } catch {
        setModal(m => ({ ...m, purchasing: false, error: "Network error. Please try again." }))
      }
      return
    }

    setModal(m => ({ ...m, purchasing: true, error: null }))
    try {
      const res = await fetch("/api/verification/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pvadealsServiceId: modal.service.pvadeals_service_id,
          type: modal.type,
          ltrDays: modal.ltrDays,
          areaCode: modal.areaCode || undefined,
        }),
      })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (data?.success) {
        setModal(m => ({
          ...m,
          purchasing: false,
          result: { number: data?.data?.number, expires_at: data?.data?.expires_at, price: data?.data?.price },
        }))
        fetchActiveNumbers()
      } else {
        // Map structured error codes to user-friendly messages
        let errorMsg = data?.error || "Purchase failed"
        if (res.status === 502) {
          if (data?.code === "PROVIDER_SERVICES") {
            errorMsg = "Verification provider unavailable — check API configuration or try again later"
          } else if (data?.code === "PROVIDER_PURCHASE") {
            errorMsg = data?.error || "Provider purchase failed — please try again shortly"
          } else if (data?.code === "INSUFFICIENT_CREDITS") {
            errorMsg = data?.error || "Provider temporarily out of credits — try again in a few minutes"
          }
        }
        setModal(m => ({ ...m, purchasing: false, error: errorMsg }))
      }
    } catch {
      setModal(m => ({ ...m, purchasing: false, error: "Network error. Please try again." }))
    }
  }

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num).then(() => {
      setCopied(num)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const searchActive = searchQuery.trim().length > 0

  // Get unique countries for filter
  const availableCountries = Array.from(new Set(services.map(s => s.country || "US").filter(Boolean)))

  // Apply all filters and sorting
  const filteredServices = services
    .filter(s => {
      // Category filter (when not searching)
      if (!searchActive && s.category !== selectedCategory) return false
      // Search filter
      if (searchActive && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      // Country filter
      if (countryFilter !== "all" && (s.country || "US") !== countryFilter) return false
      // Type filter (price-based)
      if (typeFilter === "str" && s.str_price === 0) return false
      if (typeFilter === "ltr" && s.ltr3_price === 0) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price_asc":
          return a.str_price - b.str_price
        case "price_desc":
          return b.str_price - a.str_price
        default:
          return 0
      }
    })

  const getCatMeta = (id: string) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
  const hasActiveFilters = countryFilter !== "all" || typeFilter !== "all" || sortBy !== "name"
  const activeFilterCount = (countryFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (sortBy !== "name" ? 1 : 0)

  const selectedPrice = modal.service
    ? modal.type === "STR"
      ? modal.service.str_price
      : getLtrPrice(modal.service, modal.ltrDays)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ServiceGuard serviceKey="verification">
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Number Verification</h1>
          <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm leading-relaxed">
            Get temporary US phone numbers for SMS verification on any app or website.
          </p>
        </div>
        <Link href="/dashboard/verification/history" className="shrink-0 self-start">
          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
            <History className="h-3.5 w-3.5" />
            <span className="hidden min-[480px]:inline">View History</span>
          </Button>
        </Link>
      </div>

      {/* Admin Pricing Panel */}
      {isAdmin && (
        <Card className="border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10">
          <CardContent className="p-0">
            <button
              onClick={() => setAdminPanelOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/40 dark:hover:bg-amber-900/10 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Admin: Pricing &amp; Services</span>
                <Badge variant="outline" className="text-[10px] h-4 border-amber-300 text-amber-700 bg-amber-50">Admin Only</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/verification/pricing" onClick={e => e.stopPropagation()}>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline">
                    Full Editor <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
                {adminPanelOpen ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
              </div>
            </button>

            {adminPanelOpen && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Edit markup percentages and toggle service availability. Changes reflect immediately for all users.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 border-amber-300"
                      onClick={handleAdminSync}
                      disabled={adminSyncing}
                    >
                      {adminSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Sync from PVADeals
                    </Button>
                    <Link href="/admin/verification/pricing">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-amber-300">
                        <Settings className="h-3.5 w-3.5" />
                        Full Pricing Editor
                      </Button>
                    </Link>
                  </div>
                </div>

                {adminLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  </div>
                ) : adminServices.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No services found. Sync from PVADeals to populate.</p>
                  </div>
                ) : (
                  <>
                  <div className="space-y-3 sm:hidden">
                    {adminServices.map((svc) => {
                      const markup = adminEdits[svc.id]?.markup_percentage ?? svc.markup_percentage
                      const isActive = adminEdits[svc.id]?.is_active ?? svc.is_active
                      const isDirty = !!adminEdits[svc.id]
                      const isSaving = adminSaving === svc.id
                      const strGhs = svc.str_price ? (svc.str_price * exchangeRate * (1 + (markup || 0) / 100)).toFixed(2) : "---"
                      return (
                        <Card key={svc.id} className={isDirty ? "border-amber-300/60 bg-amber-50/40" : ""}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                {svc.picture_url && (
                                  <img src={svc.picture_url} alt={svc.name} className="h-8 w-8 rounded object-contain" />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{svc.name}</p>
                                  <p className="text-xs capitalize text-muted-foreground">{svc.category.replace(/_/g, " ")}</p>
                                </div>
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(val) =>
                                  setAdminEdits((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], is_active: val } }))
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Markup %</p>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={markup}
                                  onChange={(e) =>
                                    setAdminEdits((prev) => ({
                                      ...prev,
                                      [svc.id]: { ...prev[svc.id], markup_percentage: parseFloat(e.target.value) || 0 },
                                    }))
                                  }
                                  className="mt-1 h-9"
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground">STR (GHS)</p>
                                <p className="mt-1 font-mono font-medium">GH₵{strGhs}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={isDirty ? "default" : "outline"}
                              className="inline-flex w-full justify-center gap-2"
                              disabled={!isDirty || isSaving}
                              onClick={() => handleAdminSave(svc.id)}
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              Save
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  <div className="-mx-4 hidden overflow-hidden rounded-lg border sm:mx-0 sm:block">
                    <div className="overflow-x-auto max-w-[calc(100vw-2rem)]">
                      <table className="w-full min-w-[540px] text-[10px] sm:min-w-0 sm:text-xs">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                          <th className="px-2 sm:px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-medium text-muted-foreground">Active</th>
                          <th className="px-2 sm:px-3 py-2 text-right font-medium text-muted-foreground">Markup %</th>
                          <th className="px-2 sm:px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">STR (GHS)</th>
                          <th className="px-2 sm:px-3 py-2 text-right font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {adminServices.map(svc => {
                          const markup = adminEdits[svc.id]?.markup_percentage ?? svc.markup_percentage
                          const isActive = adminEdits[svc.id]?.is_active ?? svc.is_active
                          const isDirty = !!adminEdits[svc.id]
                          const isSaving = adminSaving === svc.id
                          const strGhs = svc.str_price ? (svc.str_price * exchangeRate * (1 + (markup || 0) / 100)).toFixed(2) : '---'
                          return (
                            <tr key={svc.id} className={isDirty ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-background"}>
                              <td className="px-2 sm:px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {svc.picture_url && (
                                    <img src={svc.picture_url} alt={svc.name} className="h-4 w-4 sm:h-5 sm:w-5 rounded object-contain" />
                                  )}
                                  <span className="font-medium truncate max-w-[80px] sm:max-w-[120px]">{svc.name}</span>
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 hidden sm:table-cell text-muted-foreground capitalize">
                                {svc.category.replace(/_/g, ' ')}
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-center">
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={val => setAdminEdits(prev => ({ ...prev, [svc.id]: { ...prev[svc.id], is_active: val } }))}
                                  className="scale-75"
                                />
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={markup}
                                  onChange={e => setAdminEdits(prev => ({ ...prev, [svc.id]: { ...prev[svc.id], markup_percentage: parseFloat(e.target.value) || 0 } }))}
                                  className="h-6 w-12 sm:w-16 text-[10px] sm:text-xs text-right ml-auto"
                                />
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-right font-mono text-muted-foreground hidden sm:table-cell">GH₵{strGhs}</td>
                              <td className="px-2 sm:px-3 py-2 text-right">
                                <Button
                                  size="sm"
                                  variant={isDirty ? "default" : "ghost"}
                                  className="h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                                  disabled={!isDirty || isSaving}
                                  onClick={() => handleAdminSave(svc.id)}
                                >
                                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      </table>
                    </div>
                  </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Numbers */}
      {activeNumbers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-600" />
              Active Numbers ({activeNumbers.length})
            </CardTitle>
            <CardDescription>Your currently active verification numbers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {activeNumbers.map((num) => (
                <Card key={num.id} className="border bg-background">
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={num.type === "LTR" ? "default" : "secondary"} className="text-xs">
                        {num.type === "LTR" ? `LTR ${num.ltr_duration_days}d` : "STR 20min"}
                      </Badge>
                      {!num.is_expired && (
                        <span className="text-xs font-mono text-orange-600">{num.time_remaining_formatted}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm sm:text-base font-semibold flex-1 break-all">{num.number}</p>
                      <button
                        onClick={() => copyNumber(num.number)}
                        className="p-2 rounded hover:bg-muted transition-colors shrink-0 sm:p-1"
                      >
                        {copied === num.number ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{num.service_name}</p>
                    <div className="flex flex-wrap gap-1">
                      {num.sms_count > 0 && (
                        <Badge variant="outline" className="text-xs">{num.sms_count} SMS</Badge>
                      )}
                      {num.allow_reuse && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Reusable</Badge>
                      )}
                      {num.auto_renew && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          <RefreshCw className="h-2.5 w-2.5 mr-1" />Auto-renew
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services… (e.g. WhatsApp, Netflix)"
            className="pl-9 pr-9"
          />
          {searchActive && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-9 text-xs sm:h-8 sm:w-[140px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="h-9 text-xs sm:h-8 sm:w-[110px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="str">STR Only</SelectItem>
                <SelectItem value="ltr">LTR Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Country Filter */}
            {availableCountries.length > 1 && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="h-9 text-xs sm:h-8 sm:w-[110px]">
                  <Globe className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 px-3 text-xs sm:h-8 sm:w-auto col-span-1"
              onClick={() => {
                fetchServices()
                fetchActiveNumbers()
                toast({ title: "Refreshed", description: "Services updated" })
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground sm:h-8 sm:w-auto"
                onClick={() => {
                  setSortBy("name")
                  setCountryFilter("all")
                  setTypeFilter("all")
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            )}
          </div>
          <span className="block text-xs text-muted-foreground">
            {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Service Tabs */}
      {searchActive ? (
        <div>
          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters ? "No services match your filters" : `No services match "${searchQuery}"`}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSortBy("name")
                    setCountryFilter("all")
                    setTypeFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:gap-4 lg:gap-5 grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredServices.map((svc) => {
                  const catMeta = getCatMeta(svc.category)
                  const CatIcon = catMeta.icon
                  return (
                    <motion.div key={svc.id} whileHover={{ y: -2 }} className="group cursor-pointer" onClick={() => openModal(svc)}>
                      <Card className="h-full hover:border-primary/40 transition-all hover:shadow-sm">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            {svc.picture_url ? (
                              <img
                                src={svc.picture_url}
                                alt={svc.name}
                                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain bg-muted p-1"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                              />
                            ) : (
                              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${catMeta.color}`}>
                                <CatIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs sm:text-sm truncate">{svc.name}</h3>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{svc.country ?? "US"}</p>
                            </div>
                          </div>
                          <div className="space-y-1.5 text-xs w-full">
                            <div className="flex items-center justify-between py-1 border-b border-border/50">
                              <span className="text-muted-foreground font-medium">STR <span className="font-normal">(20 min)</span></span>
                              <span className="font-semibold text-primary">{formatCurrency(svc.str_price)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">LTR from</span>
                              <span className="font-medium">{formatCurrency(svc.ltr3_price)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      ) : (
      <Tabs defaultValue="social_media" onValueChange={setSelectedCategory}>
        <TabsList className="flex w-full overflow-x-auto h-auto gap-0.5 p-1 scrollbar-hide snap-x snap-mandatory">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="flex flex-1 shrink-0 snap-start items-center justify-center gap-1 py-2 px-1.5 sm:px-3 min-w-0">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] min-[480px]:text-xs whitespace-nowrap truncate">{cat.shortName}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  {hasActiveFilters ? "No services match your filters in this category" : "No services available in this category"}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSortBy("name")
                      setCountryFilter("all")
                      setTypeFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-4 lg:gap-5 grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredServices.map((svc) => {
                  const catMeta = getCatMeta(svc.category)
                  const CatIcon = catMeta.icon
                  return (
                    <motion.div key={svc.id} whileHover={{ y: -2 }} className="group cursor-pointer" onClick={() => openModal(svc)}>
                      <Card className="h-full hover:border-primary/40 transition-all hover:shadow-sm">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            {svc.picture_url ? (
                              <img
                                src={svc.picture_url}
                                alt={svc.name}
                                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain bg-muted p-1"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                              />
                            ) : (
                              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${catMeta.color}`}>
                                <CatIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs sm:text-sm truncate">{svc.name}</h3>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{svc.country ?? "US"}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs w-full">
                            <div className="flex items-center justify-between py-1 border-b border-border/50">
                              <span className="text-muted-foreground font-medium">STR <span className="font-normal">(20 min)</span></span>
                              <span className="font-semibold text-primary">{formatCurrency(svc.str_price)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">LTR from</span>
                              <span className="font-medium">{formatCurrency(svc.ltr3_price)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      )}

      {/* How it works */}
      <Card className="bg-muted/30 mb-8">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm mb-1.5">How it works</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Select a service and choose <strong>STR</strong> (20-min) or <strong>LTR</strong> (3–30 days)</li>
                <li>• STR: Perfect for quick one-time verifications</li>
                <li>• LTR: Ideal for ongoing access — receive multiple SMS over days</li>
                <li>• Payment deducted from your wallet balance</li>
                <li>• Copy the number and use it on the target platform</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Modal */}
      <AnimatePresence>
        {modal.service && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="mx-auto flex max-h-[90dvh] w-full flex-col rounded-xl border bg-background shadow-xl sm:max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b p-4 sm:p-5">
                <div className="min-w-0 mr-2">
                  <h2 className="font-semibold text-sm sm:text-base truncate">{modal.service.name}</h2>
                  <p className="text-xs text-muted-foreground">Select purchase type</p>
                </div>
                <button onClick={closeModal} className="p-2 rounded hover:bg-muted transition-colors shrink-0 sm:p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modal.result ? (
                <>
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5 shrink-0" />
                    <span className="font-semibold text-sm">Number purchased!</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-lg sm:text-xl font-bold flex-1 break-all">{modal.result.number}</p>
                      <button onClick={() => copyNumber(modal.result!.number)} className="p-1.5 rounded hover:bg-background transition-colors shrink-0">
                        {copied === modal.result.number ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(modal.result.expires_at).toLocaleString()}
                    </p>
                    <p className="text-xs font-medium">Charged: {formatCurrency(modal.result.price)}</p>
                  </div>
                </div>
                <div className="shrink-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
                  <Button className="w-full" onClick={closeModal}>Done</Button>
                </div>
                </>
              ) : (
                <>
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Type selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {(["STR", "LTR"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setModal(m => ({ ...m, type: t, error: null }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          modal.type === t
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-semibold text-sm">{t}</p>
                        <p className="text-xs text-muted-foreground">
                          {t === "STR" ? "20 minutes" : "Multi-day rental"}
                        </p>
                        <p className="text-sm font-bold text-primary mt-1">
                          {t === "STR"
                            ? formatCurrency(modal.service!.str_price)
                            : `from ${formatCurrency(modal.service!.ltr3_price)}`}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* LTR duration selector */}
                  {modal.type === "LTR" && (
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Duration</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {LTR_OPTIONS.map((opt) => (
                          <button
                            key={opt.days}
                            onClick={() => setModal(m => ({ ...m, ltrDays: opt.days }))}
                            className={`py-2 px-1 rounded border text-center transition-all ${
                              modal.ltrDays === opt.days
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <p className="text-xs font-semibold">{opt.label}</p>
                            <p className="text-[10px] sm:text-xs text-primary font-medium mt-0.5">
                              {formatCurrency(getLtrPrice(modal.service!, opt.days))}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* State / area code picker */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      State / Area code <span className="font-normal">(optional)</span>
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={areaCodesLoading}
                          className="h-9 text-sm w-full justify-between font-normal"
                        >
                          {areaCodesLoading ? (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Loading area codes...
                            </span>
                          ) : modal.areaCode ? (
                            <span className="truncate">
                              {areaCodes.find((s) => s.code === modal.areaCode)?.state || "Unknown"} ({modal.areaCode})
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Any state / area code</span>
                          )}
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[min(calc(100vw-2rem),320px)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search state or code..." className="h-9" />
                          <CommandList className="max-h-48 sm:max-h-64">
                            <CommandEmpty>No area code found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                key="any"
                                value="any"
                                onSelect={() => {
                                  setModal(m => ({ ...m, areaCode: "", error: null }))
                                }}
                              >
                                <span className="font-medium">Any state</span>
                                <span className="text-muted-foreground ml-2 text-xs">(No preference)</span>
                                {modal.areaCode === "" && (
                                  <Check className="ml-auto h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                              {areaCodes.map((s) => (
                                <CommandItem
                                  key={`${s.code}-${s.state}`}
                                  value={`${s.state} ${s.code}`}
                                  onSelect={() => {
                                    setModal(m => ({ ...m, areaCode: s.code, error: null }))
                                  }}
                                >
                                  <span className="font-medium">{s.state}</span>
                                  <span className="text-muted-foreground ml-2">({s.code})</span>
                                  {modal.areaCode === s.code && (
                                    <Check className="ml-auto h-4 w-4 text-primary" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-[10px] text-muted-foreground">
                      Select a state to get a number from that area code
                    </p>
                    {areaCodeFallback && areaCodes.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70 bg-muted px-2 py-1 rounded">
                        Using standard area codes — select any or leave empty for random assignment
                      </p>
                    )}
                    {areaCodeFallback && areaCodes.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/70 bg-muted px-2 py-1 rounded">
                        No area codes available — leave empty for random assignment
                      </p>
                    )}
                    {apiError && (
                      <p className="text-[10px] text-red-500/70 bg-red-500/10 px-2 py-1 rounded">
                        API Error: {apiError}
                      </p>
                    )}
                  </div>

                  {/* Payment method */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Payment method</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setModal(m => ({ ...m, paymentMethod: "wallet", error: null }))}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          modal.paymentMethod === "wallet"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                          <p className="font-semibold text-sm">Wallet</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Bal: {formatCurrency(user?.walletBalance ?? 0)}
                        </p>
                      </button>
                      <button
                        onClick={() => setModal(m => ({ ...m, paymentMethod: "paystack", error: null }))}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          modal.paymentMethod === "paystack"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                          <p className="font-semibold text-sm">Paystack</p>
                        </div>
                        <p className="text-xs text-muted-foreground">+4% fee</p>
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {modal.error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="text-xs">{modal.error}</p>
                    </div>
                  )}
                </div>

                {/* Sticky footer with summary + purchase button */}
                <div className="shrink-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 space-y-3">
                  <div className="space-y-1">
                    {modal.paymentMethod === "wallet" ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Wallet balance</span>
                        <span className={`font-medium ${(user?.walletBalance ?? 0) < selectedPrice ? "text-red-500" : ""}`}>
                          {formatCurrency(user?.walletBalance ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Price</span>
                          <span>{formatCurrency(selectedPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Fee (4%)</span>
                          <span>{formatCurrency(Number((selectedPrice * 0.04).toFixed(2)))}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(Number((selectedPrice * 1.04).toFixed(2)))}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    className="w-full whitespace-nowrap"
                    onClick={handlePurchase}
                    disabled={
                      modal.purchasing ||
                      (modal.paymentMethod === "wallet" && (user?.walletBalance ?? 0) < selectedPrice)
                    }
                  >
                    {modal.purchasing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />{modal.paymentMethod === "paystack" ? "Redirecting…" : "Purchasing…"}</>
                    ) : modal.paymentMethod === "paystack" ? (
                      <><ExternalLink className="h-4 w-4 mr-2" />Pay {formatCurrency(Number((selectedPrice * 1.04).toFixed(2)))}</>
                    ) : (
                      <>Purchase for {formatCurrency(selectedPrice)}</>
                    )}
                  </Button>
                </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ServiceGuard>
  )
}
