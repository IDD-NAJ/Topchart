"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/networks"
import { toast } from "sonner"
import { Loader2, Phone, DollarSign, TrendingUp, Users, Clock, RefreshCw, Wallet, Settings, Save, ArrowRight, Percent, MessageSquare, AlertTriangle } from "lucide-react"

interface Stats {
  summary: {
    total_purchases: string
    onetime_count: string
    rental_count: string
    total_revenue: string
    avg_price: string
  }
  activeNow: number
  serviceStats: Array<{
    name: string
    category: string
    purchase_count: string
    total_revenue: string
  }>
  dailyRevenue: Array<{
    date: string
    count: string
    revenue: string
    type: string
  }>
}

const DEFAULT_USD_TO_GHS = parseFloat(process.env.NEXT_PUBLIC_USD_TO_GHS_RATE ?? "15.5")

interface PricingService {
  id: string
  name: string
  category: string
  picture_url?: string
  is_active: boolean
  markup_percentage: number
  str_price: number
  purchase_count?: number
}

export default function AdminVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pvaBalance, setPvaBalance] = useState<number | null>(null)
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; message: string | null }>({
    loading: false,
    message: null,
  })

  // Pricing section state
  const [pricingServices, setPricingServices] = useState<PricingService[]>([])
  const [pricingLoading, setPricingLoading] = useState(false)
  const [globalMarkup, setGlobalMarkup] = useState(40)
  const [globalMarkupSaving, setGlobalMarkupSaving] = useState(false)
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_USD_TO_GHS)

  useEffect(() => {
    fetchStats()
    fetchPvaStatus()
    fetchPricingData()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/verification/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || "Failed to load stats")
      }
    } catch {
      setError("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  const fetchPvaStatus = async () => {
    try {
      const res = await fetch("/api/admin/verification/sync")
      const data = await res.json()
      if (data.success) setPvaBalance(data.data.pvadeals_balance)
    } catch {}
  }

  const fetchPricingData = async () => {
    setPricingLoading(true)
    try {
      const [svcRes, settingsRes] = await Promise.all([
        fetch("/api/admin/verification/services"),
        fetch("/api/admin/verification/settings"),
      ])
      const svcData = await svcRes.json()
      const settingsData = await settingsRes.json()
      if (svcData.success) setPricingServices(svcData.data.services)
      if (settingsData.success) {
        setGlobalMarkup(settingsData.data.defaultMarkup ?? 40)
        setExchangeRate(settingsData.data.exchangeRate ?? DEFAULT_USD_TO_GHS)
      }
    } catch {}
    finally { setPricingLoading(false) }
  }

  const handleSaveGlobalMarkup = async () => {
    setGlobalMarkupSaving(true)
    try {
      const res = await fetch("/api/admin/verification/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultMarkup: globalMarkup, exchangeRate }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Global markup saved")
        fetchPricingData()
      } else {
        toast.error(data.error || "Failed to save")
      }
    } catch { toast.error("Save failed") }
    finally { setGlobalMarkupSaving(false) }
  }

  const handleSync = async () => {
    setSyncStatus({ loading: true, message: null })
    try {
      const res = await fetch("/api/admin/verification/sync", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setSyncStatus({ loading: false, message: data.data.message })
        fetchPvaStatus()
      } else {
        setSyncStatus({ loading: false, message: `Sync failed: ${data.error}` })
      }
    } catch {
      setSyncStatus({ loading: false, message: "Sync request failed" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verification Services</h1>
          <p className="text-muted-foreground mt-1">
            PVADeals-powered phone number verification
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/verification/numbers">
            <Button variant="outline">View All Numbers</Button>
          </Link>
          <Link href="/admin/verification/pricing">
            <Button variant="outline">Pricing Settings</Button>
          </Link>
          <Button onClick={handleSync} disabled={syncStatus.loading}>
            {syncStatus.loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing…</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />Sync Services</>
            )}
          </Button>
        </div>
      </div>

      {/* PVADeals status bar */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border text-sm">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">PVADeals Balance:</span>
          <span className="font-semibold">
            {pvaBalance !== null ? `$${Number(pvaBalance).toFixed(2)} USD` : "—"}
          </span>
        </div>
        {syncStatus.message && (
          <span className="text-xs text-muted-foreground border-l pl-4">{syncStatus.message}</span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats.summary.total_revenue) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.summary.total_purchases} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Numbers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeNow}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">STR vs LTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.summary.onetime_count} / {stats.summary.rental_count}
            </div>
            <p className="text-xs text-muted-foreground">
              STR / LTR breakdown
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats.summary.avg_price) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per number
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Top Services by Usage</CardTitle>
          <CardDescription>Most popular verification services (30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.serviceStats.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-6">{index + 1}.</span>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {service.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{service.purchase_count} purchases</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(service.total_revenue) || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Pricing Panel ── */}
      <Card className="border-[#006994]/20 bg-[#EFF6FA]/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#006994]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#006994]" />
              </div>
              <div>
                <CardTitle className="text-base">Pricing &amp; Markup Settings</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {pricingServices.length} services · {pricingServices.filter(s => s.is_active).length} active
                  {pricingServices.length > 0 && (
                    <> · Avg {Math.round(pricingServices.reduce((a, s) => a + s.markup_percentage, 0) / pricingServices.length)}% markup</>
                  )}
                </CardDescription>
              </div>
            </div>
            <Link href="/admin/verification/pricing">
              <Button size="sm" className="gap-2 bg-[#006994] hover:bg-[#005a7d]">
                <Settings className="h-3.5 w-3.5" />
                Full Pricing Editor
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Quick global markup row */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
            <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Default Global Markup</p>
              <p className="text-xs text-muted-foreground">Applied to newly synced services</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="1"
                value={globalMarkup}
                onChange={e => setGlobalMarkup(parseFloat(e.target.value) || 0)}
                className="h-8 w-20 text-sm text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-[#006994] hover:bg-[#005a7d]"
                onClick={handleSaveGlobalMarkup}
                disabled={globalMarkupSaving}
              >
                {globalMarkupSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>

          {/* Top services pricing preview */}
          {pricingLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#006994]" />
            </div>
          ) : pricingServices.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Services — Current Prices</p>
                <Link href="/admin/verification/pricing" className="text-xs text-[#006994] hover:underline flex items-center gap-0.5">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Markup</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">STR (GHS)</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">30d Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-background">
                    {pricingServices.slice(0, 8).map(svc => {
                      const strGhs = svc.str_price
                        ? Number(svc.str_price * exchangeRate * (1 + svc.markup_percentage / 100)).toFixed(2)
                        : '—'
                      return (
                        <tr key={svc.id} className={!svc.is_active ? 'opacity-50' : ''}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {svc.picture_url && (
                                <img src={svc.picture_url} alt={svc.name} className="h-5 w-5 rounded object-contain" />
                              )}
                              <span className="font-medium truncate max-w-[140px]">{svc.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={svc.is_active ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
                              {svc.is_active ? 'Active' : 'Off'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{svc.markup_percentage}%</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-[#006994]">GH₵{strGhs}</td>
                          <td className="px-3 py-2 text-right hidden sm:table-cell text-muted-foreground">
                            {svc.purchase_count ?? 0}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {pricingServices.length > 8 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{pricingServices.length - 8} more services —{" "}
                  <Link href="/admin/verification/pricing" className="text-[#006994] hover:underline">view all</Link>
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No services yet.</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => fetch("/api/admin/verification/sync", { method: "POST" }).then(() => fetchPricingData())}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />Sync from PVADeals
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/verification/numbers">
          <Card className="hover:border-[#006994] transition-colors cursor-pointer">
            <CardContent className="p-6">
              <Phone className="h-8 w-8 mb-4 text-[#006994]" />
              <h3 className="font-semibold">Manage Numbers</h3>
              <p className="text-sm text-muted-foreground">
                View all active and completed verifications
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/verification/pricing">
          <Card className="hover:border-[#006994] border-[#006994]/30 bg-[#EFF6FA]/30 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 mb-4 text-[#006994]" />
              <h3 className="font-semibold">Full Pricing Editor</h3>
              <p className="text-sm text-muted-foreground">
                Bulk markup, category defaults, export CSV
              </p>
              <Badge className="mt-3 text-[10px] bg-[#006994]">Recommended</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/verification/sms">
          <Card className="hover:border-[#006994] transition-colors cursor-pointer">
            <CardContent className="p-6">
              <MessageSquare className="h-8 w-8 mb-4 text-[#006994]" />
              <h3 className="font-semibold">SMS Log</h3>
              <p className="text-sm text-muted-foreground">
                View received SMS messages
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
