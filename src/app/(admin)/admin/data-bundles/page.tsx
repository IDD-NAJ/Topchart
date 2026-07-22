"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Database, RefreshCw, Pencil, Search, Download, ArrowDownToLine, TrendingUp, CheckCircle } from "lucide-react"

interface Bundle {
  id: string
  networkId: string
  network?: string
  name: string
  sizeMb?: number | null
  validityHours?: number | null
  providerPrice: number
  priceOverride?: number | null
  markupPercent?: number | null
  effectivePrice: number
  isActive: boolean
  isPopular: boolean
  isFeatured: boolean
  stock?: number | null
  datamartPlanId?: string | null
  datamartPlanType?: string | null
  updatedAt?: string | null
}

interface BundlesResponse {
  success: boolean
  // API can return either key depending on version
  data?: Bundle[]
  bundles?: Bundle[]
  total?: number
}

function calcEffective(b: Bundle): number {
  if (b.priceOverride != null) return Number(b.priceOverride)
  if (b.markupPercent != null) {
    return Number(b.providerPrice) * (1 + Number(b.markupPercent) / 100)
  }
  return Number(b.providerPrice)
}

export default function AdminDataBundlesPage() {
  const [search, setSearch] = useState("")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [editBundle, setEditBundle] = useState<Bundle | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [bulkNetwork, setBulkNetwork] = useState("")
  const [bulkMode, setBulkMode] = useState<"percent" | "fixed" | "clear">("percent")
  const [bulkAmount, setBulkAmount] = useState("")
  const [bulkSaving, setBulkSaving] = useState(false)

  const params = new URLSearchParams()
  if (networkFilter !== "all") params.set("network", networkFilter)
  const url = `/api/admin/data-bundles-pricing?${params.toString()}`

  const { data, error, isLoading, mutate } = useSWR<BundlesResponse>(url, adminFetcher)

  // Handle both data.data and data.bundles keys
  const rawBundles: Bundle[] = (data?.data ?? data?.bundles ?? []) as Bundle[]
  const bundles = rawBundles.map((b) => ({ ...b, effectivePrice: calcEffective(b) }))

  const filtered = bundles.filter((b) =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.networkId ?? b.network ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = bundles.filter((b) => b.isActive).length
  const popularCount = bundles.filter((b) => b.isPopular).length
  const networks = Array.from(new Set(bundles.map((b) => b.networkId ?? b.network).filter(Boolean)))

  const handleSave = async () => {
    if (!editBundle) return
    setSaving(true)
    try {
      const res = await adminMutate(`/api/admin/data-bundles-pricing`, "PATCH", {
        id: editBundle.id,
        updates: {
          priceOverride: editBundle.priceOverride,
          markupPercent: editBundle.markupPercent,
          isActive: editBundle.isActive,
          isFeatured: editBundle.isFeatured,
          isPopular: editBundle.isPopular,
          stock: editBundle.stock,
        },
      })
      if (res.success) {
        toast.success("Bundle updated")
        setEditBundle(null)
        mutate()
      } else {
        toast.error(res.error || "Failed to update bundle")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await adminMutate("/api/admin/datamart/sync-data-packages", "POST", {})
      if (res.success) {
        toast.success(`Sync complete: ${res.data?.inserted ?? 0} inserted, ${res.data?.updated ?? 0} updated`)
        mutate()
      } else {
        toast.error(res.error || "Sync failed")
      }
    } catch {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const handleBulkUpdate = async () => {
    if (!bulkNetwork) { toast.error("Select a network for bulk update"); return }
    setBulkSaving(true)
    try {
      const body: any = { bulkUpdate: { networkCode: bulkNetwork, mode: bulkMode, applyTo: "override" } }
      if (bulkMode !== "clear") body.bulkUpdate.amount = parseFloat(bulkAmount) || 0
      const res = await adminMutate("/api/admin/data-bundles-pricing", "PATCH", body)
      if (res.success) {
        toast.success(res.message || "Bulk update applied")
        mutate()
      } else {
        toast.error(res.error || "Bulk update failed")
      }
    } catch {
      toast.error("Bulk update failed")
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <AdminPageShell
      title="Data Bundles"
      description="Manage data bundle pricing, availability, and sync from Datamart."
      icon={Database}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowDownToLine className="w-4 h-4 mr-1.5" />}
            Sync from Datamart
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Bundles" value={bundles.length} icon={Database} />
        <StatCard label="Active" value={activeCount} icon={CheckCircle} accent />
        <StatCard label="Popular" value={popularCount} icon={TrendingUp} />
        <StatCard label="Networks" value={networks.length} icon={Database} />
      </div>

      {/* Bulk Price Tool */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Bulk Pricing Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs">Network</Label>
              <Select value={bulkNetwork} onValueChange={setBulkNetwork}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((n) => (
                    <SelectItem key={String(n)} value={String(n)}>{String(n)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mode</Label>
              <Select value={bulkMode} onValueChange={(v) => setBulkMode(v as any)}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Markup %</SelectItem>
                  <SelectItem value="fixed">Fixed Add GH&#8373;</SelectItem>
                  <SelectItem value="clear">Clear Overrides</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkMode !== "clear" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={bulkMode === "percent" ? "e.g. 10" : "e.g. 0.50"}
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  className="h-9 w-28"
                />
              </div>
            )}
            <Button size="sm" onClick={handleBulkUpdate} disabled={bulkSaving || !bulkNetwork}>
              {bulkSaving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bundles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {networks.map((n) => (
                  <SelectItem key={String(n)} value={String(n)}>{String(n)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">
            {filtered.length} bundle{filtered.length !== 1 ? "s" : ""}
          </p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState icon={Database} title="Failed to load bundles" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No bundles found"
            description={bundles.length === 0 ? 'Click "Sync from Datamart" to import data packages.' : "Try adjusting your search or filters."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead className="text-right">Provider Price</TableHead>
                  <TableHead className="text-right">Override / Markup</TableHead>
                  <TableHead className="text-right">Customer Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell className="font-semibold text-sm">{bundle.networkId ?? bundle.network}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{bundle.name}</p>
                        {bundle.sizeMb && (
                          <p className="text-xs text-muted-foreground">
                            {bundle.sizeMb >= 1024 ? `${(bundle.sizeMb / 1024).toFixed(1)} GB` : `${bundle.sizeMb} MB`}
                            {bundle.validityHours ? ` · ${bundle.validityHours}h` : ""}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground font-mono">
                      GH&#8373;{Number(bundle.providerPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {bundle.priceOverride != null ? (
                        <span className="font-mono text-blue-600">
                          GH&#8373;{Number(bundle.priceOverride).toFixed(2)}
                        </span>
                      ) : bundle.markupPercent != null ? (
                        <Badge variant="outline" className="text-xs font-mono">+{Number(bundle.markupPercent).toFixed(1)}%</Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold font-mono text-sm">
                      GH&#8373;{Number(bundle.effectivePrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bundle.isActive ? "default" : "secondary"} className="text-[10px]">
                        {bundle.isActive ? "Active" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bundle.isPopular && (
                        <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500">Popular</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditBundle(bundle)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      {/* Edit Dialog */}
      <Dialog open={!!editBundle} onOpenChange={(o) => !o && setEditBundle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>
              {editBundle?.name} &mdash; {editBundle?.networkId ?? editBundle?.network}
              {editBundle?.providerPrice != null && (
                <span className="ml-2 text-muted-foreground">Provider: GH&#8373;{Number(editBundle.providerPrice).toFixed(2)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {editBundle && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price Override (GH&#8373;)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank for auto"
                    value={editBundle.priceOverride ?? ""}
                    onChange={(e) =>
                      setEditBundle((b) => b && ({ ...b, priceOverride: e.target.value ? parseFloat(e.target.value) : null }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Overrides markup when set</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Markup % (applied to provider price)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10"
                    value={editBundle.markupPercent ?? ""}
                    onChange={(e) =>
                      setEditBundle((b) => b && ({ ...b, markupPercent: e.target.value ? parseFloat(e.target.value) : null }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="Unlimited"
                    value={editBundle.stock ?? ""}
                    onChange={(e) =>
                      setEditBundle((b) => b && ({ ...b, stock: e.target.value ? parseInt(e.target.value) : null }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Calculated customer price:</span>
                <span className="font-semibold font-mono">
                  GH&#8373;{calcEffective(editBundle).toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { key: "isActive", label: "Active", desc: "Show this bundle to customers" },
                  { key: "isPopular", label: "Popular", desc: "Highlight as popular" },
                  { key: "isFeatured", label: "Featured", desc: "Feature prominently in the UI" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={editBundle[key as keyof Bundle] as boolean}
                      onCheckedChange={(c) => setEditBundle((b) => b && ({ ...b, [key]: c }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBundle(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
