"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Search,
  Wallet,
  ExternalLink,
  History,
  Settings,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = [
  { id: "social_media", name: "Social Media", icon: MessageCircle, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial", icon: CreditCard, color: "text-green-600 bg-green-50 dark:bg-green-950/40" },
  { id: "professional_tools", name: "Professional Tools", icon: Briefcase, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment", icon: Play, color: "text-red-600 bg-red-50 dark:bg-red-950/40" },
]

const LTR_OPTIONS = [
  { days: 3, label: "3 Days" },
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
]

const US_STATES = [
  { state: "Alabama", code: "205" },
  { state: "Alaska", code: "907" },
  { state: "Arizona", code: "480" },
  { state: "Arkansas", code: "501" },
  { state: "California", code: "213" },
  { state: "Colorado", code: "303" },
  { state: "Connecticut", code: "203" },
  { state: "Delaware", code: "302" },
  { state: "Florida", code: "305" },
  { state: "Georgia", code: "404" },
  { state: "Hawaii", code: "808" },
  { state: "Idaho", code: "208" },
  { state: "Illinois", code: "312" },
  { state: "Indiana", code: "317" },
  { state: "Iowa", code: "319" },
  { state: "Kansas", code: "316" },
  { state: "Kentucky", code: "502" },
  { state: "Louisiana", code: "504" },
  { state: "Maine", code: "207" },
  { state: "Maryland", code: "301" },
  { state: "Massachusetts", code: "617" },
  { state: "Michigan", code: "313" },
  { state: "Minnesota", code: "612" },
  { state: "Mississippi", code: "601" },
  { state: "Missouri", code: "314" },
  { state: "Montana", code: "406" },
  { state: "Nebraska", code: "402" },
  { state: "Nevada", code: "702" },
  { state: "New Hampshire", code: "603" },
  { state: "New Jersey", code: "201" },
  { state: "New Mexico", code: "505" },
  { state: "New York", code: "212" },
  { state: "North Carolina", code: "704" },
  { state: "North Dakota", code: "701" },
  { state: "Ohio", code: "216" },
  { state: "Oklahoma", code: "405" },
  { state: "Oregon", code: "503" },
  { state: "Pennsylvania", code: "215" },
  { state: "Rhode Island", code: "401" },
  { state: "South Carolina", code: "803" },
  { state: "South Dakota", code: "605" },
  { state: "Tennessee", code: "615" },
  { state: "Texas", code: "214" },
  { state: "Utah", code: "801" },
  { state: "Vermont", code: "802" },
  { state: "Virginia", code: "703" },
  { state: "Washington", code: "206" },
  { state: "West Virginia", code: "304" },
  { state: "Wisconsin", code: "414" },
  { state: "Wyoming", code: "307" },
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
  const [areaCodeSearch, setAreaCodeSearch] = useState("")

  // Fetch area codes when modal opens with a service
  useEffect(() => {
    if (!modal.service) return
    
    const fetchAreaCodes = async () => {
      setAreaCodesLoading(true)
      try {
        const res = await fetch(`/api/verification/area-codes/${modal.service?.pvadeals_service_id}`)
        const data = await res.json()
        
        if (data.success && data.data?.areaCodes?.length > 0) {
          setAreaCodes(data.data.areaCodes)
        } else {
          // Fall back to hardcoded list
          setAreaCodes(US_STATES)
        }
      } catch {
        setAreaCodes(US_STATES)
      } finally {
        setAreaCodesLoading(false)
      }
    }
    
    fetchAreaCodes()
  }, [modal.service])

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/services")
      const data = await res.json()
      if (data.success) {
        setServices(data.data.services)
        setError(null)
      } else {
        setError(data.error || "Failed to load services")
      }
    } catch {
      setError("Failed to load services")
    }
  }, [])

  const fetchAdminServices = useCallback(async () => {
    if (!isAdmin) return
    setAdminLoading(true)
    try {
      const res = await fetch("/api/admin/verification/services")
      const data = await res.json()
      if (data.success) setAdminServices(data.data.services)
    } catch {}
    finally { setAdminLoading(false) }
  }, [isAdmin])

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
      const data = await res.json()
      if (data.success) {
        toast({ title: "Saved", description: "Service updated successfully" })
        setAdminEdits(prev => { const u = { ...prev }; delete u[serviceId]; return u })
        fetchAdminServices()
        fetchServices()
      } else {
        toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" })
    } finally { setAdminSaving(null) }
  }

  const handleAdminSync = async () => {
    setAdminSyncing(true)
    try {
      const res = await fetch("/api/admin/verification/sync", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Synced", description: data.data?.message || "Services synced from PVADeals" })
        fetchAdminServices()
        fetchServices()
      } else {
        toast({ title: "Sync failed", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Sync request failed", variant: "destructive" })
    } finally { setAdminSyncing(false) }
  }

  const fetchActiveNumbers = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/numbers?status=active")
      const data = await res.json()
      if (data.success) setActiveNumbers(data.data.numbers)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refreshUser()
    fetchServices()
    fetchActiveNumbers()
  }, [fetchServices, fetchActiveNumbers, refreshUser])

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
        const data = await res.json()
        if (data.success && data.data?.authorization_url) {
          window.location.href = data.data.authorization_url
        } else {
          setModal(m => ({ ...m, purchasing: false, error: data.error || "Failed to initialize payment" }))
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
      const data = await res.json()
      if (data.success) {
        setModal(m => ({
          ...m,
          purchasing: false,
          result: { number: data.data.number, expires_at: data.data.expires_at, price: data.data.price },
        }))
        fetchActiveNumbers()
      } else {
        setModal(m => ({ ...m, purchasing: false, error: data.error || "Purchase failed" }))
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
  const filteredServices = searchActive
    ? services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : services.filter(s => s.category === selectedCategory)
  const getCatMeta = (id: string) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Number Verification</h1>
          <p className="text-muted-foreground mt-2">
            Get temporary US phone numbers for SMS verification on any app or website.
          </p>
        </div>
        <Link href="/dashboard/verification/history" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-2 mt-1">
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View History</span>
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    Edit markup percentages and toggle service availability. Changes reflect immediately for all users.
                  </p>
                  <div className="flex items-center gap-2">
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
                  <div className="rounded-lg border overflow-hidden overflow-x-auto">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Active</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Markup %</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">STR (GHS)</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {adminServices.map(svc => {
                          const markup = adminEdits[svc.id]?.markup_percentage ?? svc.markup_percentage
                          const isActive = adminEdits[svc.id]?.is_active ?? svc.is_active
                          const isDirty = !!adminEdits[svc.id]
                          const isSaving = adminSaving === svc.id
                          const strGhs = svc.str_price ? (svc.str_price * 15.5 * (1 + (markup || 0) / 100)).toFixed(2) : '---'
                          return (
                            <tr key={svc.id} className={isDirty ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-background"}>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {svc.picture_url && (
                                    <img src={svc.picture_url} alt={svc.name} className="h-5 w-5 rounded object-contain" />
                                  )}
                                  <span className="font-medium truncate max-w-[120px]">{svc.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground capitalize">
                                {svc.category.replace(/_/g, ' ')}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={val => setAdminEdits(prev => ({ ...prev, [svc.id]: { ...prev[svc.id], is_active: val } }))}
                                  className="scale-75"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={markup}
                                  onChange={e => setAdminEdits(prev => ({ ...prev, [svc.id]: { ...prev[svc.id], markup_percentage: parseFloat(e.target.value) || 0 } }))}
                                  className="h-6 w-16 text-xs text-right ml-auto"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-muted-foreground">GH₵{strGhs}</td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  size="sm"
                                  variant={isDirty ? "default" : "ghost"}
                                  className="h-6 px-2 text-xs"
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeNumbers.map((num) => (
                <Card key={num.id} className="border bg-background">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={num.type === "LTR" ? "default" : "secondary"} className="text-xs">
                        {num.type === "LTR" ? `LTR ${num.ltr_duration_days}d` : "STR 20min"}
                      </Badge>
                      {!num.is_expired && (
                        <span className="text-xs font-mono text-orange-600">{num.time_remaining_formatted}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-base font-semibold flex-1">{num.number}</p>
                      <button
                        onClick={() => copyNumber(num.number)}
                        className="p-1 rounded hover:bg-muted transition-colors"
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

      {/* Search */}
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

      {/* Service Tabs */}
      {searchActive ? (
        <div>
          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No services match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">{filteredServices.length} result{filteredServices.length !== 1 ? "s" : ""}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((svc) => {
                  const catMeta = getCatMeta(svc.category)
                  const CatIcon = catMeta.icon
                  return (
                    <motion.div key={svc.id} whileHover={{ y: -2 }} className="group cursor-pointer" onClick={() => openModal(svc)}>
                      <Card className="h-full hover:border-primary/40 transition-all hover:shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            {svc.picture_url ? (
                              <img
                                src={svc.picture_url}
                                alt={svc.name}
                                className="h-10 w-10 rounded-lg object-contain bg-muted p-1"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${catMeta.color}`}>
                                <CatIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{svc.name}</h3>
                              <p className="text-xs text-muted-foreground">{svc.country ?? "US"}</p>
                            </div>
                          </div>
                          <div className="space-y-1.5 text-xs">
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
        <TabsList className="flex w-full overflow-x-auto h-auto gap-1 p-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="flex shrink-0 items-center gap-1.5 py-2 px-3">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs whitespace-nowrap">{cat.name}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No services available in this category</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((svc) => {
                  const catMeta = getCatMeta(svc.category)
                  const CatIcon = catMeta.icon
                  return (
                    <motion.div key={svc.id} whileHover={{ y: -2 }} className="group cursor-pointer" onClick={() => openModal(svc)}>
                      <Card className="h-full hover:border-primary/40 transition-all hover:shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            {svc.picture_url ? (
                              <img
                                src={svc.picture_url}
                                alt={svc.name}
                                className="h-10 w-10 rounded-lg object-contain bg-muted p-1"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${catMeta.color}`}>
                                <CatIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{svc.name}</h3>
                              <p className="text-xs text-muted-foreground">{svc.country ?? "US"}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs">
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
      <Card className="bg-muted/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl border shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h2 className="font-semibold text-base">{modal.service.name}</h2>
                  <p className="text-xs text-muted-foreground">Select purchase type</p>
                </div>
                <button onClick={closeModal} className="p-1 rounded hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modal.result ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Number purchased!</span>
                  </div>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xl font-bold flex-1">{modal.result.number}</p>
                      <button onClick={() => copyNumber(modal.result!.number)} className="p-1.5 rounded hover:bg-background transition-colors">
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
                  <Button className="w-full" onClick={closeModal}>Done</Button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
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
                            <p className="text-xs text-primary font-medium mt-0.5">
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
                    <div className="relative">
                      <Select
                        value={modal.areaCode || "any"}
                        onValueChange={(v) => {
                          setModal(m => ({ ...m, areaCode: v === "any" ? "" : v, error: null }))
                          setAreaCodeSearch("")
                        }}
                        disabled={areaCodesLoading}
                      >
                        <SelectTrigger className="h-9 text-sm w-full">
                          {areaCodesLoading ? (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Loading area codes...
                            </span>
                          ) : (
                            <SelectValue placeholder="Any state / area code" />
                          )}
                        </SelectTrigger>
                        <SelectContent className="max-h-72 w-[280px] sm:w-[320px]">
                          {/* Search input */}
                          <div className="sticky top-0 bg-background p-2 border-b z-10">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                placeholder="Search state or code..."
                                value={areaCodeSearch}
                                onChange={(e) => setAreaCodeSearch(e.target.value)}
                                className="h-8 pl-7 text-sm"
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto">
                            <SelectItem value="any" className="text-sm">
                              <span className="font-medium">Any state</span>
                              <span className="text-muted-foreground ml-2 text-xs">(No preference)</span>
                            </SelectItem>
                            
                            {areaCodes
                              .filter((s) => {
                                if (!areaCodeSearch) return true
                                const search = areaCodeSearch.toLowerCase()
                                return (
                                  s.state.toLowerCase().includes(search) ||
                                  s.code.includes(search)
                                )
                              })
                              .map((s) => (
                                <SelectItem key={s.code} value={s.code} className="text-sm">
                                  <span className="font-medium">{s.state}</span>
                                  <span className="text-muted-foreground ml-2">({s.code})</span>
                                </SelectItem>
                              ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Select a state to get a number from that area code
                    </p>
                  </div>

                  {/* Payment method */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Payment method</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setModal(m => ({ ...m, paymentMethod: "wallet", error: null }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          modal.paymentMethod === "wallet"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Wallet className="h-3.5 w-3.5 text-primary" />
                          <p className="font-semibold text-sm">Wallet</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(user?.walletBalance ?? 0)}
                        </p>
                      </button>
                      <button
                        onClick={() => setModal(m => ({ ...m, paymentMethod: "paystack", error: null }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          modal.paymentMethod === "paystack"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                          <p className="font-semibold text-sm">Paystack</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Pay as you go (+4% fee)</p>
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

                  {/* Summary row */}
                  <div className="border-t pt-3 space-y-1">
                    {modal.paymentMethod === "wallet" ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Wallet balance</span>
                        <span className={`font-medium ${(user?.walletBalance ?? 0) < selectedPrice ? "text-red-500" : ""}`}>
                          {formatCurrency(user?.walletBalance ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Price</span>
                          <span>{formatCurrency(selectedPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Paystack fee (4%)</span>
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
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={
                      modal.purchasing ||
                      (modal.paymentMethod === "wallet" && (user?.walletBalance ?? 0) < selectedPrice)
                    }
                  >
                    {modal.purchasing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />{modal.paymentMethod === "paystack" ? "Redirecting…" : "Purchasing…"}</>
                    ) : modal.paymentMethod === "paystack" ? (
                      <><ExternalLink className="h-4 w-4 mr-2" />Pay {formatCurrency(Number((selectedPrice * 1.04).toFixed(2)))} with Paystack</>
                    ) : (
                      <>Purchase for {formatCurrency(selectedPrice)}</>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
