"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, StatCard, EmptyState } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Wifi, RefreshCw, Wallet, BarChart3, Zap, Link, Trash2, TestTube2,
  ArrowDownToLine, CheckCircle, XCircle, AlertCircle, Database, Settings,
  Activity,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────
interface BalanceData {
  balance: number
  currency: string
  user: { id: string; name: string; email: string }
  timestamp: string
}

interface UsageStats {
  today: { orders: number; spent: number }
  thisMonth: { orders: number; spent: number }
  allTime: { orders: number; spent: number }
  statusBreakdown: Record<string, number>
  networkBreakdown: Array<{ network: string; count: number; spent: number }>
  apiKey: { name: string; createdAt: string; lastUsed: string; expiresAt: string | null }
}

interface WebhookStatus {
  configured: boolean
  message: string
  url?: string
  events?: string[]
}

interface DataPackage {
  capacity: string
  mb: string
  price: string
  network: string
  inStock: boolean
}

interface SyncResult {
  inserted: number
  updated: number
  errors: number
  errorMessages?: string[]
}

// ── Balance Panel ──────────────────────────────────────────────────────────────
function BalancePanel() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: BalanceData }>(
    "/api/admin/datamart?q=balance",
    adminFetcher
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Datamart Wallet Balance</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mutate()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-48" />
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error.message || "Failed to load balance"}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-foreground">
                GH&#8373;{Number(data?.data?.balance ?? 0).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground mb-1">{data?.data?.currency ?? "GHS"}</span>
            </div>
            {data?.data?.user && (
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{data.data.user.name}</p>
                <p>{data.data.user.email}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Usage Stats Panel ──────────────────────────────────────────────────────────
function UsagePanel() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: UsageStats }>(
    "/api/admin/datamart?q=usage",
    adminFetcher
  )
  const stats = data?.data

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Usage Statistics</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mutate()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />{error.message}
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {([
                { label: "Today Orders", value: stats.today.orders, sub: `GH₵${Number(stats.today.spent).toFixed(2)}` },
                { label: "This Month", value: stats.thisMonth.orders, sub: `GH₵${Number(stats.thisMonth.spent).toFixed(2)}` },
                { label: "All Time", value: stats.allTime.orders, sub: `GH₵${Number(stats.allTime.spent).toFixed(2)}` },
              ] as const).map((item) => (
                <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-black">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>

            {stats.networkBreakdown?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Network Breakdown</p>
                <div className="space-y-1.5">
                  {stats.networkBreakdown.map((n) => (
                    <div key={n.network} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{n.network}</span>
                      <span className="text-muted-foreground">{n.count} orders &middot; GH&#8373;{Number(n.spent).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ── Data Packages Panel ────────────────────────────────────────────────────────
function DataPackagesPanel() {
  const [network, setNetwork] = useState("YELLO")
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: DataPackage[] }>(
    `/api/admin/datamart?q=packages&network=${network}`,
    adminFetcher,
    { revalidateOnFocus: false }
  )

  const packages = Array.isArray(data?.data)
    ? data!.data
    : (data?.data ? Object.values(data.data as Record<string, DataPackage[]>).flat() : [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await adminMutate("/api/admin/datamart/sync-data-packages", "POST", {})
      if (res.success) {
        setSyncResult(res.data)
        toast.success(`Sync complete: ${res.data?.inserted ?? 0} inserted, ${res.data?.updated ?? 0} updated`)
      } else {
        toast.error(res.error || "Sync failed")
      }
    } catch (err: any) {
      toast.error(err?.message || "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const NETWORK_OPTIONS = [
    { code: "YELLO", label: "MTN (YELLO)" },
    { code: "TELECEL", label: "Telecel" },
    { code: "AT_PREMIUM", label: "AirtelTigo" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {NETWORK_OPTIONS.map((n) => (
            <Button
              key={n.code}
              variant={network === n.code ? "default" : "outline"}
              size="sm"
              onClick={() => { setNetwork(n.code); mutate() }}
            >
              {n.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />}
            Sync to DB
          </Button>
        </div>
      </div>

      {syncResult && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm flex gap-4 flex-wrap">
          <span className="text-green-600 font-medium">{syncResult.inserted} inserted</span>
          <span className="text-blue-600 font-medium">{syncResult.updated} updated</span>
          {syncResult.errors > 0 && <span className="text-destructive font-medium">{syncResult.errors} errors</span>}
        </div>
      )}

      <AdminTableShell>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState icon={Database} title="Failed to load packages" description={error.message} />
        ) : packages.length === 0 ? (
          <EmptyState icon={Database} title="No packages" description="No data packages returned from Datamart for this network." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capacity</TableHead>
                  <TableHead>MB</TableHead>
                  <TableHead className="text-right">Provider Price</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{pkg.capacity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{pkg.mb}</TableCell>
                    <TableCell className="text-right font-mono text-sm">GH&#8373;{Number(pkg.price).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{pkg.network}</TableCell>
                    <TableCell>
                      {pkg.inStock ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" />In Stock</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3 w-3" />Out of Stock</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>
    </div>
  )
}

// ── Webhook Panel ──────────────────────────────────────────────────────────────
function WebhookPanel() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: WebhookStatus }>(
    "/api/admin/datamart?q=webhook",
    adminFetcher
  )
  const [webhookUrl, setWebhookUrl] = useState("")
  const [configuring, setConfiguring] = useState(false)
  const [testing, setTesting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = data?.data
  const appUrl = typeof window !== "undefined" ? window.location.origin : ""

  const handleConfigure = async () => {
    const url = webhookUrl || `${appUrl}/api/webhooks/datamart`
    if (!url) { toast.error("Please enter a webhook URL"); return }
    setConfiguring(true)
    try {
      const res = await adminMutate("/api/admin/datamart?action=configure-webhook", "POST", {
        url,
        events: ["order.completed", "order.failed", "order.processing"],
      })
      if (res.success) {
        toast.success("Webhook configured")
        mutate()
      } else {
        toast.error(res.error || "Failed to configure webhook")
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setConfiguring(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await adminMutate("/api/admin/datamart?action=test-webhook", "POST", {})
      if (res.success) toast.success("Test webhook sent")
      else toast.error(res.error || "Test failed")
    } catch (err: any) {
      toast.error(err?.message || "Test failed")
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await adminMutate("/api/admin/datamart?action=delete-webhook", "POST", {})
      if (res.success) { toast.success("Webhook removed"); mutate() }
      else toast.error(res.error || "Failed to remove webhook")
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove webhook")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Webhook Configuration</CardTitle>
            <CardDescription>Receive real-time notifications for order status updates.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mutate()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              {status?.configured ? (
                <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                  <CheckCircle className="h-3 w-3" />Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <XCircle className="h-3 w-3" />Not configured
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">{status?.message}</p>
            </div>

            {status?.url && (
              <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all">{status.url}</div>
            )}

            {status?.events && status.events.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {status.events.map((e) => (
                  <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={`${appUrl}/api/webhooks/datamart`}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={handleConfigure} disabled={configuring}>
                {configuring ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Link className="h-3.5 w-3.5 mr-1.5" />}
                {status?.configured ? "Update Webhook" : "Configure Webhook"}
              </Button>
              {status?.configured && (
                <>
                  <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                    {testing ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <TestTube2 className="h-3.5 w-3.5 mr-1.5" />}
                    Test
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                    Remove
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Connectivity Test ──────────────────────────────────────────────────────────
function ConnectivityPanel() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null)
  const [running, setRunning] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    const start = Date.now()
    try {
      const res = await adminFetcher("/api/admin/datamart/connectivity-test")
      setResult({ success: res.success, message: res.message || (res.success ? "Connected" : "Failed"), latency: Date.now() - start })
    } catch (err: any) {
      setResult({ success: false, message: err?.message || "Connectivity test failed" })
    } finally {
      setTesting(false)
    }
  }

  const handleMigration = async () => {
    setRunning(true)
    setMigrationResult(null)
    try {
      const res = await adminMutate("/api/admin/run-migration", "POST", {})
      setMigrationResult(res)
      if (res.success) {
        toast.success(`Migration complete: ${res.summary?.ok ?? 0} ok, ${res.summary?.errors ?? 0} errors`)
      } else {
        toast.error("Migration failed")
      }
    } catch (err: any) {
      toast.error(err?.message || "Migration failed")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">API Connectivity</CardTitle>
          <CardDescription>Verify the Datamart API is reachable and credentials are valid.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleTest} disabled={testing} variant="outline">
            {testing ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Wifi className="h-4 w-4 mr-1.5" />}
            Test Connection
          </Button>
          {result && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${result.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {result.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              <span>{result.message}</span>
              {result.latency && <span className="ml-auto text-xs opacity-70">{result.latency}ms</span>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Database Schema Setup</CardTitle>
          <CardDescription>Apply the latest database migrations to ensure all required columns exist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleMigration} disabled={running} variant="outline">
            {running ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Database className="h-4 w-4 mr-1.5" />}
            Run Schema Migration
          </Button>
          {migrationResult && (
            <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
              <div className="flex gap-4 text-sm font-medium">
                <span className="text-green-600">{migrationResult.summary?.ok ?? 0} ok</span>
                <span className="text-destructive">{migrationResult.summary?.errors ?? 0} errors</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {migrationResult.results?.map((r: any, i: number) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${r.status === "ok" ? "text-muted-foreground" : "text-destructive"}`}>
                    {r.status === "ok" ? <CheckCircle className="h-3 w-3 text-green-500 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
                    <span>{r.statement}</span>
                    {r.error && <span className="text-destructive/70 truncate">— {r.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminDatamartSetupPage() {
  const { data: balanceData } = useSWR<{ success: boolean; data: BalanceData }>(
    "/api/admin/datamart?q=balance",
    adminFetcher
  )
  const { data: usageData } = useSWR<{ success: boolean; data: UsageStats }>(
    "/api/admin/datamart?q=usage",
    adminFetcher
  )

  const balance = balanceData?.data?.balance ?? 0
  const todayOrders = usageData?.data?.today?.orders ?? 0
  const monthOrders = usageData?.data?.thisMonth?.orders ?? 0
  const monthSpent = usageData?.data?.thisMonth?.spent ?? 0

  return (
    <AdminPageShell
      title="Datamart Setup"
      description="Manage the Datamart API connection, data packages, webhooks, and network sync."
      icon={Zap}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh All
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Wallet Balance" value={`GH₵${Number(balance).toFixed(2)}`} icon={Wallet} accent />
        <StatCard label="Today Orders" value={todayOrders} icon={Activity} />
        <StatCard label="Month Orders" value={monthOrders} icon={BarChart3} />
        <StatCard label="Month Spent" value={`GH₵${Number(monthSpent).toFixed(2)}`} icon={Wallet} />
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">
            <Database className="h-3.5 w-3.5 mr-1.5" />Data Packages
          </TabsTrigger>
          <TabsTrigger value="balance">
            <Wallet className="h-3.5 w-3.5 mr-1.5" />Balance &amp; Usage
          </TabsTrigger>
          <TabsTrigger value="webhook">
            <Link className="h-3.5 w-3.5 mr-1.5" />Webhook
          </TabsTrigger>
          <TabsTrigger value="setup">
            <Settings className="h-3.5 w-3.5 mr-1.5" />Setup &amp; Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4">
          <DataPackagesPanel />
        </TabsContent>

        <TabsContent value="balance" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BalancePanel />
            <UsagePanel />
          </div>
        </TabsContent>

        <TabsContent value="webhook" className="mt-4">
          <WebhookPanel />
        </TabsContent>

        <TabsContent value="setup" className="mt-4">
          <ConnectivityPanel />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  )
}
