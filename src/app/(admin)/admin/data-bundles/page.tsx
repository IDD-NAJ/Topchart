"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Database, RefreshCw, Pencil, Search, Download } from "lucide-react"

interface Bundle {
  id: string
  networkId: string
  name: string
  sizeMb?: number
  validityHours?: number
  providerPrice: number
  priceOverride?: number | null
  markupPercent?: number | null
  effectivePrice: number
  isActive: boolean
  isPopular: boolean
  isFeatured: boolean
  datamartPlanId?: string | null
  datamartPlanType?: string | null
}

interface BundlesResponse {
  success: boolean
  bundles: Bundle[]
  total: number
}

export default function AdminDataBundlesPage() {
  const [search, setSearch] = useState("")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [editBundle, setEditBundle] = useState<Bundle | null>(null)
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (networkFilter !== "all") params.set("network", networkFilter)
  const url = `/api/admin/data-bundles-pricing?${params.toString()}`

  const { data, error, isLoading, mutate } = useSWR<BundlesResponse>(url, adminFetcher)
  const bundles = data?.bundles || []

  const filtered = bundles.filter((b) =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.networkId?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!editBundle) return
    setSaving(true)
    try {
      const res = await adminMutate(`/api/admin/data-bundles-pricing`, "PATCH", {
        id: editBundle.id,
        priceOverride: editBundle.priceOverride,
        markupPercent: editBundle.markupPercent,
        isActive: editBundle.isActive,
        isPopular: editBundle.isPopular,
        isFeatured: editBundle.isFeatured,
      })
      if (res.success) {
        toast.success("Bundle updated successfully")
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

  const networks = Array.from(new Set(bundles.map((b) => b.networkId).filter(Boolean)))

  return (
    <AdminPageShell
      title="Data Bundles"
      description="Manage data bundle pricing, availability and markups."
      icon={Database}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
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
                  <SelectItem key={n} value={n}>{n}</SelectItem>
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
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Database} title="Failed to load bundles" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Database} title="No bundles found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Provider Price</TableHead>
                  <TableHead className="text-right">Override</TableHead>
                  <TableHead className="text-right">Effective</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell className="font-semibold">{bundle.networkId}</TableCell>
                    <TableCell>{bundle.name}</TableCell>
                    <TableCell>
                      {bundle.datamartPlanType && (
                        <Badge variant="secondary" className="text-[10px]">
                          {bundle.datamartPlanType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(bundle.providerPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {bundle.priceOverride != null ? formatCurrency(bundle.priceOverride) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bundle.effectivePrice)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bundle.isActive ? "default" : "secondary"} className="text-[10px]">
                        {bundle.isActive ? "Active" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bundle.isPopular && <Badge className="text-[10px] bg-amber-500">Popular</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditBundle(bundle)}
                      >
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
            <DialogDescription>{editBundle?.name} — {editBundle?.networkId}</DialogDescription>
          </DialogHeader>
          {editBundle && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price Override (GH₵)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank for auto"
                    value={editBundle.priceOverride ?? ""}
                    onChange={(e) =>
                      setEditBundle((b) => b && ({ ...b, priceOverride: e.target.value ? parseFloat(e.target.value) : null }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={editBundle.markupPercent ?? ""}
                    onChange={(e) =>
                      setEditBundle((b) => b && ({ ...b, markupPercent: e.target.value ? parseFloat(e.target.value) : null }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">Show this bundle to customers</p>
                  </div>
                  <Switch
                    checked={editBundle.isActive}
                    onCheckedChange={(c) => setEditBundle((b) => b && ({ ...b, isActive: c }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Popular</p>
                    <p className="text-xs text-muted-foreground">Highlight as popular</p>
                  </div>
                  <Switch
                    checked={editBundle.isPopular}
                    onCheckedChange={(c) => setEditBundle((b) => b && ({ ...b, isPopular: c }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Featured</p>
                    <p className="text-xs text-muted-foreground">Feature on the homepage</p>
                  </div>
                  <Switch
                    checked={editBundle.isFeatured}
                    onCheckedChange={(c) => setEditBundle((b) => b && ({ ...b, isFeatured: c }))}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBundle(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
