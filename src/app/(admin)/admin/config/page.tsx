"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate } from "@/lib/admin-fetcher"
import { AdminPageShell, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ServerCog, RefreshCw, Save, Database, Cpu, Globe, ShieldCheck } from "lucide-react"

interface SeoSettings {
  site_title?: string
  site_description?: string
  og_image_url?: string
  canonical_url?: string
}

interface SeoResponse {
  success: boolean
  settings?: SeoSettings
  data?: SeoSettings
}

interface StatsResponse {
  success: boolean
  stats?: {
    totalUsers?: number
    activeUsers?: number
    totalTransactions?: number
    totalRevenue?: number
    pendingOrders?: number
    todayOrders?: number
  }
}

interface HealthResponse {
  success: boolean
  health?: {
    database?: string
    apis?: Record<string, string>
    uptime?: number
    version?: string
  }
}

export default function AdminConfigPage() {
  const [seoForm, setSeoForm] = useState<SeoSettings>({})
  const [savingSeo, setSavingSeo] = useState(false)
  const [seoLoaded, setSeoLoaded] = useState(false)

  const { data: seoData, mutate: mutateSeo } = useSWR<SeoResponse>("/api/admin/seo-settings", adminFetcher, {
    onSuccess: (d) => {
      if (!seoLoaded) {
        setSeoForm(d?.settings || d?.data || {})
        setSeoLoaded(true)
      }
    },
  })
  const { data: statsData, isLoading: statsLoading, mutate: mutateStats } = useSWR<StatsResponse>("/api/admin/stats", adminFetcher)
  const { data: healthData, isLoading: healthLoading, mutate: mutateHealth } = useSWR<HealthResponse>("/api/admin/health", adminFetcher)

  const stats = statsData?.stats || {}
  const health = healthData?.health || {}

  const handleSaveSeo = async () => {
    setSavingSeo(true)
    try {
      const res = await adminMutate("/api/admin/seo-settings", "POST", seoForm)
      if (res.success) { toast.success("SEO settings saved"); mutateSeo() }
      else toast.error(res.error || "Failed")
    } catch { toast.error("Something went wrong") }
    finally { setSavingSeo(false) }
  }

  const handleRefreshAll = () => {
    mutateStats()
    mutateHealth()
    mutateSeo()
    toast.success("Refreshed")
  }

  return (
    <AdminPageShell
      title="System Configuration"
      description="Platform-wide settings, SEO configuration, and system health."
      icon={ServerCog}
      actions={
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh All
        </Button>
      }
    >
      {/* System Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live System Metrics</h2>
        </div>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Users" value={stats.totalUsers?.toLocaleString() ?? "—"} icon={Globe} />
            <StatCard label="Active Users" value={stats.activeUsers?.toLocaleString() ?? "—"} icon={Globe} accent />
            <StatCard label="Transactions" value={stats.totalTransactions?.toLocaleString() ?? "—"} icon={Database} />
            <StatCard label="Pending Orders" value={stats.pendingOrders?.toLocaleString() ?? "—"} icon={ServerCog} />
            <StatCard label="Today Orders" value={stats.todayOrders?.toLocaleString() ?? "—"} icon={Cpu} />
            <StatCard label="Revenue" value={stats.totalRevenue != null ? `GH₵ ${Number(stats.totalRevenue).toFixed(0)}` : "—"} icon={Globe} />
          </div>
        )}
      </div>

      <Separator />

      {/* System Health */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">System Health</h2>
        </div>
        {healthLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : health ? (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Database</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${health.database === "connected" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-medium capitalize">{health.database || "Unknown"}</span>
                </div>
              </div>
              {health.version && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Version</p>
                  <p className="text-sm font-medium mt-1">{health.version}</p>
                </div>
              )}
              {health.uptime != null && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uptime</p>
                  <p className="text-sm font-medium mt-1">{Math.floor(health.uptime / 60)}m</p>
                </div>
              )}
              {health.apis && Object.entries(health.apis).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{key} API</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${val === "configured" || val === "connected" ? "bg-green-500" : "bg-amber-500"}`} />
                    <span className="text-sm font-medium capitalize">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={ShieldCheck} title="Health data unavailable" />
        )}
      </div>

      <Separator />

      {/* SEO Settings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">SEO & Metadata</h2>
          </div>
          <Button size="sm" onClick={handleSaveSeo} disabled={savingSeo}>
            <Save className="w-4 h-4 mr-1.5" />{savingSeo ? "Saving..." : "Save SEO"}
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Site Title</Label>
              <Input value={seoForm.site_title || ""} onChange={(e) => setSeoForm((f) => ({ ...f, site_title: e.target.value }))} placeholder="Topchart - Buy Data Online" />
            </div>
            <div className="space-y-1.5">
              <Label>Canonical URL</Label>
              <Input value={seoForm.canonical_url || ""} onChange={(e) => setSeoForm((f) => ({ ...f, canonical_url: e.target.value }))} placeholder="https://topchart.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Site Description</Label>
              <Input value={seoForm.site_description || ""} onChange={(e) => setSeoForm((f) => ({ ...f, site_description: e.target.value }))} placeholder="Buy affordable data bundles, airtime and more in Ghana." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>OG Image URL</Label>
              <Input value={seoForm.og_image_url || ""} onChange={(e) => setSeoForm((f) => ({ ...f, og_image_url: e.target.value }))} placeholder="https://topchart.com/og-image.png" />
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  )
}
