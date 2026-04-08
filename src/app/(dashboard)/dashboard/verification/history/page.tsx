"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Search,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  RefreshCw,
  Inbox,
  PhoneCall,
  TrendingUp,
  Wallet,
  Calendar,
  Ban,
  Flag,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface VerificationRecord {
  id: string
  number: string
  type: "STR" | "LTR"
  status: "active" | "completed" | "expired" | "cancelled"
  purchase_price: number
  ltr_duration_days: number | null
  rental_duration_hours: number
  allow_flag: boolean
  allow_reuse: boolean
  auto_renew: boolean
  expires_at: string | null
  completed_at: string | null
  created_at: string
  service_id: string | null
  service_name: string | null
  service_category: string | null
  service_icon: string | null
  sms_count: number
  time_remaining_formatted: string
  is_expired: boolean
}

interface SMSMessage {
  id: string
  from_number: string
  message: string
  received_at: string
  is_read: boolean
}

type FilterType = "all" | "active" | "completed" | "expired" | "cancelled"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function formatCurrency(amount: number): string {
  return `GH₵${Number(amount).toFixed(2)}`
}

function StatusBadge({ status }: { status: VerificationRecord["status"] }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    active: {
      label: "Active",
      className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400",
      icon: <Clock className="h-3 w-3" />,
    },
    completed: {
      label: "Completed",
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    expired: {
      label: "Expired",
      className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400",
      icon: <XCircle className="h-3 w-3" />,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
      icon: <XCircle className="h-3 w-3" />,
    },
  }
  const c = config[status] ?? config.expired
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", c.className)}>
      {c.icon}
      {c.label}
    </span>
  )
}

function useCountdown(expiresAt: string | null, status: string): string {
  const [display, setDisplay] = useState("")

  useEffect(() => {
    if (status !== "active" || !expiresAt) { setDisplay(""); return }

    const calc = () => {
      const ms = new Date(expiresAt).getTime() - Date.now()
      if (ms <= 0) { setDisplay("Expired"); return }
      const totalSec = Math.floor(ms / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      if (h > 0) setDisplay(`${h}h ${m}m ${s}s`)
      else if (m > 0) setDisplay(`${m}m ${s}s`)
      else setDisplay(`${s}s`)
    }

    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [expiresAt, status])

  return display
}

function SMSPanel({
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
  const [sms, setSms] = useState<SMSMessage[]>([])
  const [count, setCount] = useState(initialCount)
  const [fetched, setFetched] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const { toast } = useToast()

  const fetchSMS = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    if (!silent) setExpanded(true)
    try {
      const res = await fetch(`/api/verification/sms/${numberId}`)
      const data = await res.json()
      if (data.success) {
        setSms(data.data.sms || [])
        setCount(data.data.sms?.length ?? count)
        setFetched(true)
        setLastFetched(new Date())
      } else if (!silent) {
        toast({ title: "Could not load SMS", description: data.error, variant: "destructive" })
        setExpanded(false)
      }
    } catch {
      if (!silent) {
        toast({ title: "Network error", description: "Failed to load SMS messages", variant: "destructive" })
        setExpanded(false)
      }
    } finally {
      if (!silent) setLoading(false); else setRefreshing(false)
    }
  }, [numberId, count, toast])

  // Auto-poll every 20 s for active numbers
  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => fetchSMS(true), 20000)
    return () => clearInterval(id)
  }, [isActive, fetchSMS])

  const toggle = () => {
    if (!expanded && !fetched) { fetchSMS(); return }
    setExpanded(e => !e)
  }

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    fetchSMS(false)
    setFetched(false)
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button
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
            Updated {lastFetched.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>
        )}
      </div>

      {expanded && !loading && (
        <div className="mt-2 space-y-2 pl-1">
          {sms.length === 0 ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground italic">No SMS messages received yet.</p>
              {isActive && (
                <span className="text-[10px] text-muted-foreground/60">Auto-checks every 20s</span>
              )}
            </div>
          ) : (
            sms.map((msg) => (
              <div key={msg.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">From: {msg.from_number}</span>
                  <span className="text-xs text-muted-foreground">
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

function HistoryRow({ record, onRefresh }: { record: VerificationRecord; onRefresh: () => void }) {
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { toast } = useToast()
  const countdown = useCountdown(record.expires_at, record.status)

  const copyNumber = () => {
    navigator.clipboard.writeText(record.number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/verification/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId: record.id }),
      })
      const data = await res.json()
      if (data.success) {
        const { refunded, refund_amount, refund_method } = data.data ?? {}
        let description = `${record.number} has been cancelled.`
        if (refunded && refund_amount > 0) {
          const methodLabel = refund_method === "paystack"
            ? "Paystack refund initiated (3–5 business days)"
            : `GH₵${Number(refund_amount).toFixed(2)} refunded to your wallet`
          description = methodLabel
        }
        toast({ title: "Number cancelled", description })
        onRefresh()
      } else {
        toast({ title: "Cancel failed", description: data.error || "Could not cancel number", variant: "destructive" })
      }
    } catch {
      toast({ title: "Network error", description: "Failed to cancel number", variant: "destructive" })
    } finally {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  const typeBadge = record.type === "LTR"
    ? `LTR ${record.ltr_duration_days ?? ""}d`
    : "STR 20min"

  const isActive = record.status === "active"

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors rounded-lg">
      <div className="flex items-start gap-3">
        {/* Service Icon */}
        <div className="h-10 w-10 rounded-lg border bg-background flex items-center justify-center shrink-0 overflow-hidden">
          {record.service_icon ? (
            <Image
              src={record.service_icon}
              alt={record.service_name || ""}
              width={32}
              height={32}
              className="h-8 w-8 object-contain rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          ) : (
            <PhoneCall className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{record.service_name || "Unknown Service"}</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono shrink-0">{typeBadge}</Badge>
            <StatusBadge status={record.status} />
            {record.auto_renew && (
              <span className="inline-flex items-center gap-0.5 text-xs text-green-600 border border-green-200 rounded-full px-1.5 py-0.5 bg-green-50 dark:bg-green-950/30">
                <RefreshCw className="h-2.5 w-2.5" /> Auto-renew
              </span>
            )}
          </div>

          {/* Number row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-sm font-semibold tracking-wider">{record.number}</span>
            </div>
            <button
              onClick={copyNumber}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors border",
                copied
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Copy number"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>

            {/* Active-only action buttons */}
            {isActive && record.allow_flag && (
              <>
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Flag & cancel this number"
                  >
                    <Flag className="h-3 w-3" />
                    Cancel
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="text-red-600 font-medium">Confirm cancel?</span>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-2 py-0.5 rounded bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                      {cancelling ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Yes, cancel"}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="px-2 py-0.5 rounded border text-xs hover:bg-muted transition-colors"
                    >
                      Keep
                    </button>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {formatCurrency(record.purchase_price)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(record.created_at)}
            </span>
            {isActive && countdown && (
              <span className={cn(
                "flex items-center gap-1 font-medium",
                countdown === "Expired" ? "text-red-500" : "text-orange-600"
              )}>
                <Timer className="h-3 w-3" />
                {countdown === "Expired" ? "Expired" : `${countdown} left`}
              </span>
            )}
            {!isActive && record.expires_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expired {formatDate(record.expires_at)}
              </span>
            )}
            {record.completed_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                Completed {formatDate(record.completed_at)}
              </span>
            )}
          </div>

          {/* SMS Panel */}
          <SMSPanel
            numberId={record.id}
            initialCount={record.sms_count}
            isActive={isActive}
          />
        </div>
      </div>
    </div>
  )
}

export default function VerificationHistoryPage() {
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/verification/numbers?include_expired=true", {
        credentials: "include",
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setRecords(data.data.numbers || [])
      } else {
        setError(data.error || "Failed to load verification history")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        r.number.includes(q) ||
        (r.service_name ?? "").toLowerCase().includes(q) ||
        (r.service_category ?? "").toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [records, filter, searchQuery])

  const grouped = useMemo(() => {
    const groups: Record<string, VerificationRecord[]> = {}
    filtered.forEach((r) => {
      const key = formatDateGroup(r.created_at)
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return groups
  }, [filtered])

  const stats = useMemo(() => {
    const total = records.length
    const totalSpent = records.reduce((acc, r) => acc + Number(r.purchase_price), 0)
    const completed = records.filter((r) => r.status === "completed").length
    const active = records.filter((r) => r.status === "active").length
    const expired = records.filter((r) => r.status === "expired").length
    return { total, totalSpent, completed, active, expired }
  }, [records])

  const filterCounts: Record<FilterType, number> = useMemo(() => ({
    all: records.length,
    active: records.filter((r) => r.status === "active").length,
    completed: records.filter((r) => r.status === "completed").length,
    expired: records.filter((r) => r.status === "expired").length,
    cancelled: records.filter((r) => r.status === "cancelled").length,
  }), [records])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/verification">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Verification History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All your temporary number purchases and received SMS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading} className="gap-2">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/dashboard/verification">
            <Button size="sm" className="gap-2 bg-[#006994] hover:bg-[#005a7d]">
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buy Number</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-[#006994]/15">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PhoneCall className="h-4 w-4 text-[#006994]" />
                <span className="text-xs text-muted-foreground font-medium">Total Purchases</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-[#006994]/15">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-[#006994]" />
                <span className="text-xs text-muted-foreground font-medium">Total Spent</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground font-medium">Active Now</span>
              </div>
              <p className="text-2xl font-bold">{stats.active}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full sm:w-auto">
          <TabsList className="h-9 flex-wrap">
            {(["all", "active", "completed", "expired", "cancelled"] as FilterType[]).map((f) => (
              <TabsTrigger key={f} value={f} className="text-xs capitalize gap-1.5">
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {filterCounts[f] > 0 && (
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0 text-[10px] font-medium">
                    {filterCounts[f]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by number or service…"
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />
          <p className="text-sm text-muted-foreground">Loading history…</p>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
              <Button variant="link" size="sm" className="h-auto p-0 text-red-600" onClick={fetchHistory}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {filter === "all" && !searchQuery ? "No purchases yet" : "No results found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "all" && !searchQuery
                  ? "Your verification number purchases will appear here."
                  : "Try adjusting your filters or search query."}
              </p>
            </div>
            {filter === "all" && !searchQuery && (
              <Link href="/dashboard/verification">
                <Button className="bg-[#006994] hover:bg-[#005a7d] gap-2">
                  <PhoneCall className="h-4 w-4" />
                  Buy Your First Number
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateGroup, groupRecords]) => (
            <div key={dateGroup}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dateGroup}</span>
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{groupRecords.length}</span>
              </div>
              <Card className="overflow-hidden">
                <CardContent className="p-0 divide-y">
                  {groupRecords.map((record) => (
                    <HistoryRow key={record.id} record={record} onRefresh={fetchHistory} />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
