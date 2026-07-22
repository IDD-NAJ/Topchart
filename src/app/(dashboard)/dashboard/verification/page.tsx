"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
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
import { VerificationServiceSchema } from "./schema"
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
  MessageSquare,
  Flag,
} from "lucide-react"
import { SMSPVA_COUNTRIES } from "@/lib/smspva"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { trackAdsPurchase } from "@/lib/ads"

const CATEGORIES = [
  { id: "social_media", name: "Social Media", shortName: "Social", icon: MessageCircle, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial", shortName: "E-Commerce", icon: CreditCard, color: "text-green-600 bg-green-50 dark:bg-green-950/40" },
  { id: "professional_tools", name: "Professional Tools", shortName: "Professional", icon: Briefcase, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment", shortName: "Streaming", icon: Play, color: "text-red-600 bg-red-50 dark:bg-red-950/40" },
]

const AVATAR_COLORS = [
  "bg-blue-500 text-white",
  "bg-green-500 text-white",
  "bg-purple-500 text-white",
  "bg-red-500 text-white",
  "bg-amber-500 text-white",
  "bg-teal-500 text-white",
  "bg-pink-500 text-white",
  "bg-indigo-500 text-white",
  "bg-cyan-600 text-white",
  "bg-orange-500 text-white",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function ServiceIcon({ name, pictureUrl, fallbackIcon: FallbackIcon, fallbackColor, size = "md" }: {
  name: string
  pictureUrl?: string | null
  fallbackIcon: React.ComponentType<{ className?: string }>
  fallbackColor: string
  size?: "xs" | "sm" | "md"
}) {
  const [imgError, setImgError] = useState(false)
  const letter = name.charAt(0).toUpperCase()
  const avatarColor = getAvatarColor(name)

  const sizeClasses = {
    xs: "h-4 w-4 sm:h-5 sm:w-5",
    sm: "h-8 w-8",
    md: "h-8 w-8 sm:h-10 sm:w-10",
  }
  const fontClasses = {
    xs: "text-[8px] sm:text-[10px]",
    sm: "text-xs",
    md: "text-sm sm:text-base",
  }
  const containerClass = sizeClasses[size]
  const fontClass = fontClasses[size]

  if (pictureUrl && !imgError) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className={`${containerClass} rounded-lg object-contain bg-muted ${size === "md" ? "p-1" : "p-0.5"}`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className={`${containerClass} rounded-lg flex items-center justify-center ${avatarColor}`}>
      <span className={`${fontClass} font-bold`}>{letter}</span>
    </div>
  )
}

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
  service_icon?: string | null
}

interface PurchaseModal {
  service: Service | null
  type: "STR" | "LTR"
  ltrDays: number
  areaCode: string
  paymentMethod: "wallet" | "paystack"
  purchasing: boolean
  result: { number_id: string; number: string; expires_at: string; price: number } | null
  error: string | null
}

interface PurchaseModalSms {
  id: string
  from_number: string
  message: string
  received_at: string
}

function getLtrPrice(svc: Service, days: number): number {
  if (days <= 3) return svc.ltr3_price
  if (days <= 7) return svc.ltr7_price
  if (days <= 14) return svc.ltr14_price
  return svc.ltr30_price
}

function ActiveNumberSmsPanel({
  numberId,
  initialCount,
  isActive,
}: {
  numberId: string
  initialCount: number
  isActive: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sms, setSms] = useState<PurchaseModalSms[]>([])
  const [count, setCount] = useState(initialCount)
  const [fetched, setFetched] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  const fetchSMS = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    if (!silent) setExpanded(true)
    try {
      const res = await fetch(`/api/verification/sms/${numberId}`, {
        credentials: "include",
        cache: "no-store",
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON response */
      }
      if (data?.success) {
        const list = (data?.data?.sms || []) as PurchaseModalSms[]
        setSms(list)
        setCount(list.length)
        setFetched(true)
        setLastFetched(new Date())
      } else if (!silent) {
        toast({ title: "Could not load SMS", description: data?.error, variant: "destructive" })
        setExpanded(false)
      }
    } catch {
      if (!silent) {
        toast({ title: "Network error", description: "Failed to load SMS messages", variant: "destructive" })
        setExpanded(false)
      }
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }, [numberId, toast])

  useEffect(() => {
    if (!isActive) return
    const t = window.setTimeout(() => {
      void fetchSMS(true)
    }, 600)
    return () => clearTimeout(t)
  }, [isActive, numberId, fetchSMS])

  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => {
      void fetchSMS(true)
    }, 20000)
    return () => clearInterval(id)
  }, [isActive, fetchSMS])

  const toggle = () => {
    if (!expanded && !fetched) {
      void fetchSMS(false)
      return
    }
    setExpanded(e => !e)
  }

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    void fetchSMS(false)
    setFetched(false)
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageSquare className="h-3.5 w-3.5" />
          )}
          <span>{count} SMS message{count !== 1 ? "s" : ""}</span>
          {!loading && (expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        </button>
        {(fetched || isActive) && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-0.5 rounded hover:bg-muted transition-colors"
            title="Refresh SMS"
          >
            <RefreshCw className={cn("h-3 w-3 text-muted-foreground", refreshing && "animate-spin")} />
          </button>
        )}
        {lastFetched && (
          <span className="text-[10px] text-muted-foreground/60">
            Updated{" "}
            {lastFetched.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>
        )}
      </div>

      {expanded && !loading && (
        <div className="mt-2 space-y-2 pl-1">
          {sms.length === 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground italic">No SMS messages received yet.</p>
              {isActive && (
                <span className="text-[10px] text-muted-foreground/60">Auto-checks every 20s</span>
              )}
            </div>
          ) : (
            sms.map((msg) => (
              <div key={msg.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">From: {msg.from_number}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(msg.received_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </span>
                </div>
                <p className="text-sm font-mono break-all">{msg.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ActiveNumberCard({
  num,
  copied,
  onCopy,
  onRefreshList,
}: {
  num: ActiveNumber
  copied: boolean
  onCopy: (value: string) => void
  onRefreshList: () => Promise<void>
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { toast } = useToast()
  const cat = CATEGORIES.find(c => c.id === num.service_category)
  const FallbackIcon = cat?.icon ?? MessageCircle
  const statusNorm = String(num.status ?? "").trim().toLowerCase()
  const isActiveForSms = statusNorm === "active"
  const isActive = isActiveForSms && !num.is_expired

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/verification/cancel", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId: num.id }),
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON */
      }
      if (data?.success) {
        const { refunded, refund_amount } = data?.data ?? {}
        let description = `${num.number} has been cancelled.`
        if (refunded && refund_amount > 0) {
          description = `GH₵${Number(refund_amount).toFixed(2)} credited to your wallet balance`
        }
        toast({ title: "Number cancelled", description })
        await onRefreshList()
      } else {
        toast({ title: "Cancel failed", description: data?.error || "Could not cancel number", variant: "destructive" })
      }
    } catch {
      toast({ title: "Network error", description: "Failed to cancel number", variant: "destructive" })
    } finally {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  return (
    <Card className="border bg-background">
      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            <ServiceIcon
              name={num.service_name}
              pictureUrl={num.service_icon}
              fallbackIcon={FallbackIcon}
              fallbackColor={cat?.color ?? "text-blue-600 bg-blue-50 dark:bg-blue-950/40"}
              size="sm"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
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
                type="button"
                onClick={() => onCopy(num.number)}
                className="p-2 rounded hover:bg-muted transition-colors shrink-0 sm:p-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{num.service_name}</p>
            <div className="flex flex-wrap gap-1">
              {num.allow_reuse && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Reusable</Badge>
              )}
              {num.auto_renew && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  <RefreshCw className="h-2.5 w-2.5 mr-1" />
                  Auto-renew
                </Badge>
              )}
            </div>
            <ActiveNumberSmsPanel numberId={num.id} initialCount={num.sms_count} isActive={isActiveForSms} />
            {isActive && !confirmCancel && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors dark:bg-red-950/30 dark:border-red-900"
              >
                <Flag className="h-3 w-3" />
                Cancel number
              </button>
            )}
            {isActive && confirmCancel && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-red-600 font-medium">Confirm cancel?</span>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={cancelling}
                  className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {cancelling ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Yes, cancel"}
                </button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="px-2 py-1 rounded border hover:bg-muted">
                  Keep
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── UK Numbers Types ──────────────────────────────────────────────────────────
interface UkService {
  id: string
  pvadeals_service_id: string
  name: string
  picture_url: string | null
  category: string
  str_price: number
  ltr3_price: number
  ltr7_price: number
  ltr14_price: number
  ltr30_price: number
}

const UK_LTR_OPTIONS = [
  { days: 3, label: "3d" },
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
]

function getUkLtrPrice(svc: UkService, days: number): number {
  if (days === 3) return svc.ltr3_price
  if (days === 7) return svc.ltr7_price
  if (days === 14) return svc.ltr14_price
  return svc.ltr30_price
}

// ── UK Numbers Section ────────────────────────────────────────────────────────
function UkNumbersSection({ onPurchaseSuccess }: { onPurchaseSuccess: () => Promise<void> }) {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [services, setServices] = useState<UkService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [modal, setModal] = useState<{
    service: UkService | null
    type: "STR" | "LTR"
    ltrDays: number
    purchasing: boolean
    error: string | null
    result: { number: string; expires_at: string; price: number } | null
  }>({ service: null, type: "STR", ltrDays: 3, purchasing: false, error: null, result: null })

  const closeModal = () => setModal(m => ({ ...m, service: null, result: null, error: null }))

  useEffect(() => {
    const fetchUkServices = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/verification/uk-numbers")
        const data = await res.json()
        if (data.success) {
          setServices(data.data.services || [])
          setError(null)
        } else {
          setError(data.error || "Failed to load UK numbers")
        }
      } catch {
        setError("Failed to load UK numbers")
      } finally {
        setLoading(false)
      }
    }
    fetchUkServices()
  }, [])

  const handlePurchase = async () => {
    if (!modal.service) return
    setModal(m => ({ ...m, purchasing: true, error: null }))

    const price = modal.type === "STR"
      ? modal.service.str_price
      : getUkLtrPrice(modal.service, modal.ltrDays)

    try {
      const res = await fetch("/api/verification/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pvadealsServiceId: modal.service.pvadeals_service_id,
          type: modal.type,
          ltrDays: modal.type === "LTR" ? modal.ltrDays : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await refreshUser()
        await onPurchaseSuccess()
        setModal(m => ({
          ...m,
          purchasing: false,
          result: {
            number: data.data.number,
            expires_at: data.data.expires_at,
            price: data.data.price,
          },
        }))
        toast({ title: "UK number purchased!", description: `${data.data.number} — expires ${new Date(data.data.expires_at).toLocaleString()}` })
      } else {
        setModal(m => ({ ...m, purchasing: false, error: data.error || "Purchase failed" }))
      }
    } catch {
      setModal(m => ({ ...m, purchasing: false, error: "Network error — please try again" }))
    }
  }

  const ukCategories = [
    { id: "all", label: "All" },
    { id: "social_media", label: "Social" },
    { id: "ecommerce_financial", label: "Financial" },
    { id: "professional_tools", label: "Professional" },
    { id: "streaming_entertainment", label: "Streaming" },
  ]

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = selectedCategory === "all" || s.category === selectedCategory
    return matchSearch && matchCat
  })

  const selectedPrice = modal.type === "STR"
    ? (modal.service?.str_price ?? 0)
    : getUkLtrPrice(modal.service!, modal.ltrDays)

  return (
    <div className="mt-8 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
          <Globe className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            UK Numbers
            <span className="text-base leading-none" aria-label="UK flag">🇬🇧</span>
          </h2>
          <p className="text-xs text-muted-foreground">United Kingdom numbers via PVADEALS</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading UK services...</span>
        </div>
      ) : error ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">UK numbers unavailable</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No UK services currently available from the provider.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search UK services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar">
              {ukCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border transition-colors shrink-0",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/40 bg-background"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Grid */}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No UK services match your search.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {filtered.map(svc => {
                const cat = CATEGORIES.find(c => c.id === svc.category)
                const FallbackIcon = cat?.icon ?? Globe
                return (
                  <motion.div key={svc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Card
                      className="border bg-background hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => setModal({ service: svc, type: "STR", ltrDays: 3, purchasing: false, error: null, result: null })}
                    >
                      <CardContent className="p-3 sm:p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <ServiceIcon
                            name={svc.name}
                            pictureUrl={svc.picture_url}
                            fallbackIcon={FallbackIcon}
                            fallbackColor={cat?.color ?? "text-blue-600 bg-blue-50 dark:bg-blue-950/40"}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs sm:text-sm truncate">{svc.name}</h3>
                            <p className="text-[10px] text-muted-foreground">🇬🇧 UK</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between py-0.5 border-b border-border/50">
                            <span className="text-muted-foreground">STR 20min</span>
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
        </>
      )}

      {/* UK Purchase Modal */}
      <AnimatePresence>
        {modal.service && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget && !modal.purchasing) closeModal() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="mx-auto flex max-h-[90dvh] w-full flex-col rounded-xl border bg-background shadow-xl sm:max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b p-4 sm:p-5">
                <div className="min-w-0 mr-2">
                  <h2 className="font-semibold text-sm sm:text-base truncate">
                    {modal.service.name} <span className="text-base" aria-label="UK flag">🇬🇧</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">United Kingdom number</p>
                </div>
                <button onClick={closeModal} disabled={modal.purchasing} className="p-2 rounded hover:bg-muted transition-colors shrink-0 sm:p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modal.result ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5 shrink-0" />
                      <span className="font-semibold text-sm">UK number purchased!</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 sm:p-4 space-y-2">
                      <p className="font-mono text-lg sm:text-xl font-bold break-all">{modal.result.number}</p>
                      <p className="text-xs text-muted-foreground">Expires: {new Date(modal.result.expires_at).toLocaleString()}</p>
                      <p className="text-xs font-medium">Charged: {formatCurrency(modal.result.price)}</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2.5 flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        If no SMS received within 7 minutes, go to <strong>Verification History</strong> and cancel for a refund.
                      </p>
                    </div>
                  </div>
                  <div className="border-t p-4 sm:p-5 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                      <Link href="/dashboard/verification/history">
                        <History className="h-3.5 w-3.5" />
                        View History
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1" onClick={closeModal}>Done</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* Type selector */}
                    <div className="grid grid-cols-2 gap-2">
                      {(["STR", "LTR"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setModal(m => ({ ...m, type: t, error: null }))}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            modal.type === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          )}
                        >
                          <p className="font-semibold text-sm">{t}</p>
                          <p className="text-xs text-muted-foreground">{t === "STR" ? "20 minutes" : "Multi-day rental"}</p>
                          <p className="text-sm font-bold text-primary mt-1">
                            {t === "STR"
                              ? formatCurrency(modal.service!.str_price)
                              : `from ${formatCurrency(modal.service!.ltr3_price)}`}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* LTR duration */}
                    {modal.type === "LTR" && (
                      <div>
                        <p className="text-xs font-medium mb-2 text-muted-foreground">Duration</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {UK_LTR_OPTIONS.map(opt => (
                            <button
                              key={opt.days}
                              onClick={() => setModal(m => ({ ...m, ltrDays: opt.days }))}
                              className={cn(
                                "py-2 px-1 rounded border text-center transition-all",
                                modal.ltrDays === opt.days ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                              )}
                            >
                              <p className="text-xs font-semibold">{opt.label}</p>
                              <p className="text-[10px] sm:text-xs text-primary font-medium mt-0.5">
                                {formatCurrency(getUkLtrPrice(modal.service!, opt.days))}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Service</span>
                        <span className="text-xs font-medium">{modal.service?.name} (UK)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Type</span>
                        <span className="text-xs">{modal.type === "STR" ? "STR — 20 min" : `LTR — ${modal.ltrDays} days`}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-sm font-medium">Wallet balance</span>
                        <span className={cn("text-sm font-medium", (user?.walletBalance ?? 0) < selectedPrice ? "text-red-500" : "")}>
                          {formatCurrency(user?.walletBalance ?? 0)}
                        </span>
                      </div>
                    </div>

                    {modal.error && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs">{modal.error}</p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 border-t p-4 sm:p-5 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={closeModal} disabled={modal.purchasing}>
                      Cancel
                    </Button>
                    <Button
                      size="sm" className="flex-1"
                      onClick={handlePurchase}
                      disabled={modal.purchasing || (user?.walletBalance ?? 0) < selectedPrice}
                    >
                      {modal.purchasing ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Purchasing...</>
                      ) : (
                        <>Purchase {formatCurrency(selectedPrice)}</>
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
  )
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
  const [refreshingActiveNumbers, setRefreshingActiveNumbers] = useState(false)
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
  const [purchaseSms, setPurchaseSms] = useState<PurchaseModalSms[]>([])
  const [purchaseSmsLoading, setPurchaseSmsLoading] = useState(false)

  const [exchangeRate, setExchangeRate] = useState(15.5)

  // International numbers state (unified — mirrors PVADeals pattern)
  const [providerTab, setProviderTab] = useState<"usa" | "international">("usa")
  const [intlNumbers, setIntlNumbers] = useState<Array<{ code: string; name: string; category: string; ghsPrice: number; baseUsdPrice: number; count: number; available: boolean; countKnown?: boolean }>>([])
  const [intlCountries, setIntlCountries] = useState<Array<{ code: string; name: string; flag: string }>>(SMSPVA_COUNTRIES)
  const [selectedSmspvaCountry, setSelectedSmspvaCountry] = useState("ru")
  const [intlLoading, setIntlLoading] = useState(false)
  const [smspvaCountrySearch, setSmspvaCountrySearch] = useState("")
  const [smspvaModal, setSmspvaModal] = useState<{
    open: boolean
    serviceCode: string
    serviceName: string
    ghsPrice: number
    purchasing: boolean
    result: { number_id: string; number: string; expires_at: string; price: number } | null
    error: string | null
  }>({ open: false, serviceCode: "", serviceName: "", ghsPrice: 0, purchasing: false, result: null, error: null })

  // Fetch global area codes on mount
  useEffect(() => {
    const fetchGlobalAreaCodes = async () => {
      try {
        const res = await fetch("/api/verification/area-codes")
        let data: any = null
        try { data = await res.json() } catch { /* non-JSON response */ }
        if (data?.success && data?.data?.areaCodes?.length > 0) {
          setGlobalAreaCodes(data.data.areaCodes)
          setApiError(null)
        } else {
          setApiError(data?.message || "No area codes available")
        }
      } catch (error) {
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

  const fetchInternationalNumbers = useCallback(async (country: string) => {
    setIntlLoading(true)
    setIntlNumbers([])
    try {
      const res = await fetch(`/api/verification/smspva/numbers?country=${encodeURIComponent(country)}`)
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON */ }
      if (data?.success) {
        setIntlNumbers(data?.data?.services || [])
        if (data?.data?.countries?.length > 0) setIntlCountries(data.data.countries)
      }
    } catch {}
    finally { setIntlLoading(false) }
  }, [])

  const handleSmspvaPurchase = async () => {
    if (!smspvaModal.serviceCode) return
    setSmspvaModal(m => ({ ...m, purchasing: true, error: null }))
    try {
      const res = await fetch("/api/verification/smspva/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smspvaServiceCode: smspvaModal.serviceCode,
          countryCode: selectedSmspvaCountry,
          serviceName: smspvaModal.serviceName,
        }),
      })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON */ }
      if (data?.success) {
        setSmspvaModal(m => ({
          ...m,
          purchasing: false,
          result: {
            number_id: data.data.number_id,
            number: data.data.number,
            expires_at: data.data.expires_at,
            price: data.data.price,
          },
        }))
        fetchActiveNumbers()
        refreshUser()
      } else {
        setSmspvaModal(m => ({ ...m, purchasing: false, error: data?.error || "Purchase failed" }))
      }
    } catch {
      setSmspvaModal(m => ({ ...m, purchasing: false, error: "Network error. Please try again." }))
    }
  }

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
        toast({ title: "Synced", description: data?.data?.message || "Services synced successfully" })
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
    const stored = typeof window !== "undefined" ? localStorage.getItem("smspva_country") : null
    if (stored && /^[a-z]{2}$/.test(stored)) setSelectedSmspvaCountry(stored)
  }, [fetchServices, fetchActiveNumbers, refreshUser, fetchGlobalSettings])

  useEffect(() => {
    if (providerTab !== "international") return
    if (typeof window !== "undefined") localStorage.setItem("smspva_country", selectedSmspvaCountry)
    fetchInternationalNumbers(selectedSmspvaCountry)
  }, [selectedSmspvaCountry, providerTab, fetchInternationalNumbers])

  const handleProviderTabChange = (tab: "usa" | "international") => {
    setProviderTab(tab)
    if (tab === "international" && intlNumbers.length === 0) {
      fetchInternationalNumbers(selectedSmspvaCountry)
    }
  }

  useEffect(() => {
    if (isAdmin && adminPanelOpen && adminServices.length === 0) {
      fetchAdminServices()
    }
  }, [isAdmin, adminPanelOpen, adminServices.length, fetchAdminServices])

  const openModal = (service: Service) => {
    setModal({ service, type: "STR", ltrDays: 3, areaCode: "", paymentMethod: "wallet", purchasing: false, result: null, error: null })
  }

  const closeModal = () => {
    setPurchaseSms([])
    setPurchaseSmsLoading(false)
    setModal(m => ({ ...m, service: null, result: null, error: null }))
  }

  const fetchPurchaseSms = useCallback(async (silent: boolean) => {
    const numberId = modal.result?.number_id
    if (!numberId) return
    if (!silent) setPurchaseSmsLoading(true)
    try {
      const res = await fetch(`/api/verification/sms/${numberId}`, { credentials: "include", cache: "no-store" })
      let data: unknown = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON */
      }
      const d = data as { success?: boolean; data?: { sms?: PurchaseModalSms[] }; error?: string } | null
      if (d?.success) {
        setPurchaseSms(d?.data?.sms ?? [])
      } else if (!silent) {
        toast({
          title: "Could not load SMS",
          description: d?.error ?? "Try again in a moment.",
          variant: "destructive",
        })
      }
    } catch {
      if (!silent) {
        toast({ title: "Network error", description: "Failed to load SMS.", variant: "destructive" })
      }
    } finally {
      if (!silent) setPurchaseSmsLoading(false)
    }
  }, [modal.result?.number_id, toast])

  useEffect(() => {
    const numberId = modal.result?.number_id
    if (!numberId) {
      setPurchaseSms([])
      return
    }
    fetchPurchaseSms(false)
    const interval = setInterval(() => fetchPurchaseSms(true), 60000)
    return () => clearInterval(interval)
  }, [modal.result?.number_id, fetchPurchaseSms])

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
        try {
          trackAdsPurchase(data?.data?.reference, {
            value: data?.data?.price,
            currency: "GHS",
          })
        } catch {}
        setModal(m => ({
          ...m,
          purchasing: false,
          result: {
            number_id: data?.data?.number_id,
            number: data?.data?.number,
            expires_at: data?.data?.expires_at,
            price: data?.data?.price,
          },
        }))
        fetchActiveNumbers()
      } else {
        // Map structured error codes to user-friendly messages
        let errorMsg = data?.error || "Purchase failed"
        if (res.status === 502) {
          if (data?.code === "PROVIDER_SERVICES") {
            errorMsg = "Verification service temporarily unavailable — please try again later"
          } else if (data?.code === "PROVIDER_PURCHASE") {
            errorMsg = data?.error || "Purchase failed — please try again shortly"
          } else if (data?.code === "INSUFFICIENT_CREDITS") {
            errorMsg = data?.error || "Service temporarily unavailable — try again in a few minutes"
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
    <VerificationServiceSchema />
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Number Verification</h1>
          <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm leading-relaxed">
            Get temporary phone numbers for SMS verification — USA numbers (STR/LTR) and international numbers from 20+ countries.
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
                      Sync Services
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
                    <p className="text-sm text-muted-foreground">No services found. Use Sync Services to populate.</p>
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
                                <ServiceIcon name={svc.name} pictureUrl={svc.picture_url} fallbackIcon={MessageCircle} fallbackColor="text-blue-600 bg-blue-50" size="sm" />
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
                                  <ServiceIcon name={svc.name} pictureUrl={svc.picture_url} fallbackIcon={MessageCircle} fallbackColor="text-blue-600 bg-blue-50" size="xs" />
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Active Numbers ({activeNumbers.length})
                </CardTitle>
                <CardDescription>Your currently active Foreign Numbers</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-2 border-amber-300 bg-background hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950/40"
                disabled={refreshingActiveNumbers}
                onClick={() => {
                  void (async () => {
                    setRefreshingActiveNumbers(true)
                    try {
                      await fetchActiveNumbers()
                    } finally {
                      setRefreshingActiveNumbers(false)
                    }
                  })()
                }}
              >
                <RefreshCw className={cn("h-4 w-4", refreshingActiveNumbers && "animate-spin")} />
                Refresh list
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {activeNumbers.map((num) => (
                <ActiveNumberCard
                  key={num.id}
                  num={num}
                  copied={copied === num.number}
                  onCopy={copyNumber}
                  onRefreshList={async () => {
                    await refreshUser()
                    await fetchActiveNumbers()
                  }}
                />
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

      {/* Provider Tab */}
      <div className="flex gap-2 border rounded-xl p-1 bg-muted/40">
        <button
          type="button"
          onClick={() => handleProviderTabChange("usa")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
            providerTab === "usa" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          🇺🇸 <span>USA Numbers</span>
        </button>
        <button
          type="button"
          onClick={() => handleProviderTabChange("international")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
            providerTab === "international" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe className="h-4 w-4" /> <span>International</span>
        </button>
      </div>

      {providerTab === "international" && (
        <div className="space-y-4">
          {/* Country Selector */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex-1 w-full">
                <Select
                  value={selectedSmspvaCountry}
                  onValueChange={(val) => setSelectedSmspvaCountry(val)}
                >
                  <SelectTrigger className="h-11 text-sm font-medium">
                    <Globe className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <div className="px-2 pb-1 pt-1 sticky top-0 bg-popover z-10">
                      <Input
                        placeholder="Search country..."
                        value={smspvaCountrySearch}
                        onChange={(e) => setSmspvaCountrySearch(e.target.value)}
                        className="h-8 text-xs"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    {intlCountries
                      .filter((c) =>
                        smspvaCountrySearch === "" ||
                        c.name.toLowerCase().includes(smspvaCountrySearch.toLowerCase())
                      )
                      .map((c) => (
                        <SelectItem key={c.code} value={c.code} className="py-2">
                          <span className="flex items-center gap-2">
                            <span className="text-base leading-none">{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {intlLoading ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking availability…
                  </span>
                ) : intlNumbers.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {intlNumbers.filter(s => s.available).length} services available
                  </span>
                ) : null}
                <p className="text-xs text-muted-foreground hidden sm:block">STR 20-min · Wallet</p>
              </div>
            </div>
          </div>

          {intlLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div>
              {intlNumbers.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Globe className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">No services found</p>
                  <p className="text-sm text-muted-foreground">Try selecting a different country from the dropdown above.</p>
                </div>
              ) : (
                <div>
                  {CATEGORIES.map((cat) => {
                    const catSvcs = intlNumbers.filter(s => s.category === cat.id)
                    if (catSvcs.length === 0) return null
                    const CatIcon = cat.icon
                    return (
                      <div key={cat.id} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CatIcon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold">{cat.name}</h3>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">{catSvcs.length}</Badge>
                        </div>
                        <div className="grid gap-2 sm:gap-4 grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                          {catSvcs.map((svc) => (
                            <motion.div
                              key={svc.code}
                              whileHover={{ y: -2 }}
                              className={cn("group cursor-pointer", svc.count === 0 && svc.countKnown && "opacity-60")}
                              onClick={() => setSmspvaModal({ open: true, serviceCode: svc.code, serviceName: svc.name, ghsPrice: svc.ghsPrice, purchasing: false, result: null, error: null })}
                            >
                              <Card className={cn("h-full transition-all hover:border-primary/40 hover:shadow-sm", svc.count === 0 && svc.countKnown && "border-dashed")}>
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ServiceIcon name={svc.name} fallbackIcon={CatIcon} fallbackColor={cat.color} />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-xs sm:text-sm truncate">{svc.name}</h4>
                                      <p className="text-[10px] text-muted-foreground">STR 20min</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <p className="font-semibold text-xs text-primary">{formatCurrency(svc.ghsPrice)}</p>
                                    {svc.count > 0 ? (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                                        {svc.count > 99 ? "99+" : svc.count} avail.
                                      </Badge>
                                    ) : !svc.countKnown ? (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                                        Available
                                      </Badge>
                                    ) : null}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {providerTab === "usa" && (
      <>
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
                            <ServiceIcon name={svc.name} pictureUrl={svc.picture_url} fallbackIcon={CatIcon} fallbackColor={catMeta.color} />
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
                            <ServiceIcon name={svc.name} pictureUrl={svc.picture_url} fallbackIcon={CatIcon} fallbackColor={catMeta.color} />
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

      </>
      )}

      {/* ── UK Numbers Section ───────────────────────────────────────────────── */}
      <UkNumbersSection onPurchaseSuccess={fetchActiveNumbers} />

      {/* SMSPVA Purchase Modal */}
      <AnimatePresence>
        {smspvaModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !smspvaModal.purchasing) setSmspvaModal(m => ({ ...m, open: false })) }}
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
                  <h2 className="font-semibold text-sm sm:text-base truncate">{smspvaModal.serviceName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {intlCountries.find((c: any) => c.code === selectedSmspvaCountry)?.flag}{" "}
                    {intlCountries.find((c: any) => c.code === selectedSmspvaCountry)?.name} · STR 20-min
                  </p>
                </div>
                <button
                  onClick={() => { if (!smspvaModal.purchasing) setSmspvaModal(m => ({ ...m, open: false })) }}
                  className="p-2 rounded hover:bg-muted transition-colors shrink-0 sm:p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {smspvaModal.result ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5 shrink-0" />
                      <span className="font-semibold text-sm">Number purchased!</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg sm:text-xl font-bold flex-1 break-all">{smspvaModal.result.number}</p>
                        <button onClick={() => copyNumber(smspvaModal.result!.number)} className="p-1.5 rounded hover:bg-background transition-colors shrink-0">
                          {copied === smspvaModal.result.number ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Expires: {new Date(smspvaModal.result.expires_at).toLocaleString()}</p>
                      <p className="text-xs font-medium">Charged: {formatCurrency(smspvaModal.result.price)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Use this number on your target app. SMS messages will appear in your <strong>Active Numbers</strong> list above.</p>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Service</span>
                        <span className="font-semibold text-sm">{smspvaModal.serviceName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Country</span>
                        <span className="text-sm">{intlCountries.find((c: any) => c.code === selectedSmspvaCountry)?.flag} {intlCountries.find((c: any) => c.code === selectedSmspvaCountry)?.name}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-sm font-medium">Price</span>
                        <span className="font-bold text-primary">{formatCurrency(smspvaModal.ghsPrice)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Note:</strong> Availability varies by country and service. If no number is available, the purchase will fail and no charge will be applied.
                      </p>
                    </div>
                    {smspvaModal.error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3">
                        <p className="text-xs text-red-700 dark:text-red-400">{smspvaModal.error}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t p-4 sm:p-5 flex gap-2">
                {smspvaModal.result ? (
                  <>
                    <Link href="/dashboard/verification/history" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <History className="h-3.5 w-3.5" />
                        View History
                      </Button>
                    </Link>
                    <Button size="sm" className="flex-1" onClick={() => setSmspvaModal(m => ({ ...m, open: false, result: null }))}
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline" size="sm" className="flex-1"
                      onClick={() => setSmspvaModal(m => ({ ...m, open: false }))}
                      disabled={smspvaModal.purchasing}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm" className="flex-1"
                      onClick={() => void handleSmspvaPurchase()}
                      disabled={smspvaModal.purchasing}
                    >
                      {smspvaModal.purchasing ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Purchasing…</>
                      ) : (
                        <>Confirm · {formatCurrency(smspvaModal.ghsPrice)}</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        Incoming SMS
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchPurchaseSms(false)}
                        disabled={purchaseSmsLoading}
                        className="p-1 rounded-md hover:bg-background transition-colors disabled:opacity-50"
                        title="Refresh SMS"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", purchaseSmsLoading && "animate-spin")} />
                      </button>
                    </div>
                    {purchaseSmsLoading && purchaseSms.length === 0 ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Checking for messages…</span>
                      </div>
                    ) : purchaseSms.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No messages yet. Tap refresh or wait — auto-checks every 12s.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                        {purchaseSms.map((msg) => (
                          <div key={msg.id} className="rounded-md border bg-background/80 p-2 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-medium text-muted-foreground truncate">
                                From {msg.from_number}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                {new Date(msg.received_at).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <p className="text-xs font-mono break-all leading-snug">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 space-y-3">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2.5 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      If SMS is not received within <span className="font-semibold">7 minutes</span>, go to{" "}
                      <span className="font-semibold">Verification History</span> and click{" "}
                      <span className="font-semibold">Cancel</span> to get a refund.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="w-full sm:flex-1 gap-2" asChild>
                      <Link href="/dashboard/verification/history">
                        <History className="h-4 w-4" />
                        Verification History
                      </Link>
                    </Button>
                    <Button className="w-full sm:flex-1" onClick={closeModal}>
                      Done
                    </Button>
                  </div>
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
