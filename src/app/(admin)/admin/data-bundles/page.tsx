"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Database, RefreshCw, Pencil, Search, Plus, Trash2,
  ArrowDownToLine, TrendingUp, CheckCircle, Package,
} from "lucide-react"

interface Bundle {
  id: string
  network: string
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
  updatedAt?: string | null
}

interface BundlesResponse {
  success: boolean
  data?: Bundle[]
}

const EMPTY_FORM = {
  network: "", name: "", size_mb: "", validity_hours: "", price: "",
  price_override: "", markup_percent: "", is_active: true, is_popular: false, is_featured: false, stock: "",
}

type FormState = typeof EMPTY_FORM

function calcEffective(b: Bundle): number {
  if (b.priceOverride != null)  return Number(b.priceOverride)
  if (b.markupPercent != null)  return Number(b.providerPrice) * (1 + Number(b.markupPercent) / 100)
  return Number(b.providerPrice)
}

export default function AdminDataBundlesPage() {
  const [search, setSearch]           = useState("")
  const [networkFilter, setNF]        = useState("all")
  const [editBundle, setEditBundle]   = useState<Bundle | null>(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [syncing, setSyncing]         = useState(false)
  const [form, setForm]               = useState<FormState>(EMPTY_FORM)
  // bulk
  const [bulkNetwork, setBulkNetwork] = useState("all")
  const [bulkMode, setBulkMode]       = useState<"percent" | "fixed" | "clear">("percent")
  const [bulkAmount, setBulkAmount]   = useState("")
  const [bulkSaving, setBulkSaving]   = useState(false)

  const params = new URLSearchParams()
  if (networkFilter !== "all") params.set("network", networkFilter)
  const url = `/api/admin/data-bundles-pricing?${params}`

  const { data, error, isLoading, mutate } = useSWR<BundlesResponse>(url, adminFetcher)

  const rawBundles = data?.data ?? []
  const networks   = Array.from(new Set(rawBundles.map((b) => b.network).filter(Boolean)))

  const filtered = rawBundles.filter((b) => {
    if (networkFilter !== "all" && b.network !== networkFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return b.name.toLowerCase().includes(q) || b.network?.toLowerCase().includes(q)
  })

  const activeCount   = rawBundles.filter((b) => b.isActive).length
  const featuredCount = rawBundles.filter((b) => b.isFeatured).length

  function openEdit(b: Bundle) {
    setForm({
      network: b.network ?? "",
      name: b.name,
      size_mb: b.sizeMb != null ? String(b.sizeMb) : "",
      validity_hours: b.validityHours != null ? String(b.validityHours) : "",
      price: String(b.providerPrice),
      price_override: b.priceOverride != null ? String(b.priceOverride) : "",
      markup_percent: b.markupPercent != null ? String(b.markupPercent) : "",
      is_active: b.isActive,
      is_popular: b.isPopular,
      is_featured: b.isFeatured,
      stock: b.stock != null ? String(b.stock) : "",
    })
    setEditBundle(b)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setShowCreate(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editBundle) {
        await adminMutate("/api/admin/data-bundles-pricing", "PATCH", {
          id: editBundle.id,
          updates: {
            priceOverride: form.price_override ? Number(form.price_override) : null,
            markupPercent: form.markup_percent ? Number(form.markup_percent) : null,
            isActive:   form.is_active,
            isPopular:  form.is_popular,
            isFeatured: form.is_featured,
            stock: form.stock ? Number(form.stock) : null,
          },
        })
        toast.success("Bundle updated")
        setEditBundle(null)
      } else {
        await adminMutate("/api/admin/data-bundles-pricing", "POST", {
          network:        form.network,
          name:           form.name,
          size_mb:        form.size_mb        ? Number(form.size_mb)        : null,
          validity_hours: form.validity_hours ? Number(form.validity_hours) : null,
          price:          Number(form.price),
          price_override: form.price_override ? Number(form.price_override) : null,
          markup_percent: form.markup_percent ? Number(form.markup_percent) : null,
          is_active:   form.is_active,
          is_popular:  form.is_popular,
          is_featured: form.is_featured,
          stock: form.stock ? Number(form.stock) : null,
        })
        toast.success("Bundle created")
        setShowCreate(false)
      }
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminMutate("/api/admin/data-bundles-pricing", "DELETE", { id: deleteId })
      toast.success("Bundle deleted")
      setDeleteId(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await adminMutate("/api/admin/datamart/sync-data-packages", "POST", {})
      toast.success(`Synced: ${(res as any).inserted ?? 0} inserted, ${(res as any).updated ?? 0} updated`)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  async function handleBulk() {
    if (bulkNetwork === "all" || bulkNetwork === "") {
      toast.error("Select a network for bulk pricing")
      return
    }
    if (bulkMode !== "clear" && !bulkAmount) {
      toast.error("Enter an amount")
      return
    }
    setBulkSaving(true)
    try {
      const res = await adminMutate("/api/admin/data-bundles-pricing", "PATCH", {
        bulkUpdate: {
          networkCode: bulkNetwork,
          mode: bulkMode,
          amount: bulkAmount ? Number(bulkAmount) : undefined,
        },
      })
      toast.success((res as any).message || "Bulk update applied")
      setBulkAmount("")
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Bulk update failed")
    } finally {
      setBulkSaving(false)
    }
  }

  const dialogOpen = !!editBundle || showCreate
  const setDialogOpen = (v: boolean) => {
    if (!v) { setEditBundle(null); setShowCreate(false) }
  }

  return (
    <AdminPageShell
      title="Data Bundles"
      description="Manage all data bundle products and pricing"
      icon={Database}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <ArrowDownToLine className="h-4 w-4 mr-1.5" />
            {syncing ? "Syncing..." : "Sync Datamart"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate} style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }} className="text-white">
            <Plus className="h-4 w-4 mr-1.5" /> New Bundle
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Bundles" value={isLoading ? <Skeleton className="h-8 w-16" /> : rawBundles.length.toLocaleString()} icon={Database} />
        <StatCard label="Active"        value={isLoading ? <Skeleton className="h-8 w-16" /> : activeCount.toLocaleString()}        icon={CheckCircle} accent />
        <StatCard label="Networks"      value={isLoading ? <Skeleton className="h-8 w-12" /> : networks.length.toLocaleString()}    icon={TrendingUp} />
        <StatCard label="Featured"      value={isLoading ? <Skeleton className="h-8 w-12" /> : featuredCount.toLocaleString()}      icon={Package} />
      </div>

      {/* Bulk Pricing */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold mb-3">Bulk Pricing</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Network</Label>
            <Select value={bulkNetwork} onValueChange={setBulkNetwork}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Select network" /></SelectTrigger>
              <SelectContent>
                {networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mode</Label>
            <Select value={bulkMode} onValueChange={(v) => setBulkMode(v as any)}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">% Markup</SelectItem>
                <SelectItem value="fixed">Fixed Uplift</SelectItem>
                <SelectItem value="clear">Clear Overrides</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bulkMode !== "clear" && (
            <div className="space-y-1">
              <Label className="text-xs">{bulkMode === "percent" ? "Percent (%)" : "Amount (GHS)"}</Label>
              <Input
                className="h-9 w-32"
                type="number"
                step="0.01"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                placeholder={bulkMode === "percent" ? "e.g. 15" : "e.g. 2.00"}
              />
            </div>
          )}
          <Button size="sm" className="h-9" onClick={handleBulk} disabled={bulkSaving}>
            {bulkSaving ? "Applying..." : "Apply"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bundles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-56"
              />
            </div>
            <Select value={networkFilter} onValueChange={setNF}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All networks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All networks</SelectItem>
                {networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">{filtered.length} bundles</p>
        </AdminTableHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Markup %</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-destructive py-10">
                    {(error as any).message || "Failed to load bundles"}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState icon={Database} title="No bundles found" description="Create a bundle or sync from Datamart" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id} className="group">
                    <TableCell className="font-medium max-w-[180px] truncate">{b.name}</TableCell>
                    <TableCell><span className="font-semibold text-xs uppercase">{b.network}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.sizeMb != null ? `${b.sizeMb} MB` : "—"}
                      {b.validityHours != null && <span className="ml-1 text-xs">/ {b.validityHours}h</span>}
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(Number(b.providerPrice))}</TableCell>
                    <TableCell className="text-sm">
                      {b.priceOverride != null ? formatCurrency(Number(b.priceOverride)) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.markupPercent != null ? `${b.markupPercent}%` : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{formatCurrency(calcEffective(b))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={b.isActive ? "default" : "outline"} className="text-xs">
                          {b.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {b.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                        {b.isPopular  && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AdminTableShell>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBundle ? "Edit Bundle" : "Create Bundle"}</DialogTitle>
            <DialogDescription>
              {editBundle ? `Editing: ${editBundle.name}` : "Add a new data bundle product"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {!editBundle && (
              <>
                <div className="space-y-1.5">
                  <Label>Network *</Label>
                  <Input value={form.network} onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))} placeholder="MTN" />
                </div>
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="MTN 1GB Daily" />
                </div>
                <div className="space-y-1.5">
                  <Label>Size (MB)</Label>
                  <Input type="number" value={form.size_mb} onChange={(e) => setForm((f) => ({ ...f, size_mb: e.target.value }))} placeholder="1024" />
                </div>
                <div className="space-y-1.5">
                  <Label>Validity (hours)</Label>
                  <Input type="number" value={form.validity_hours} onChange={(e) => setForm((f) => ({ ...f, validity_hours: e.target.value }))} placeholder="24" />
                </div>
                <div className="space-y-1.5">
                  <Label>Base Price (GHS) *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="5.00" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Price Override (GHS)</Label>
              <Input type="number" step="0.01" value={form.price_override} onChange={(e) => setForm((f) => ({ ...f, price_override: e.target.value }))} placeholder="Leave blank to use base" />
            </div>
            <div className="space-y-1.5">
              <Label>Markup %</Label>
              <Input type="number" step="0.1" value={form.markup_percent} onChange={(e) => setForm((f) => ({ ...f, markup_percent: e.target.value }))} placeholder="e.g. 15" />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="Unlimited if blank" />
            </div>
            <div className="col-span-2 flex items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active}   onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} id="is_active" />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_popular}  onCheckedChange={(v) => setForm((f) => ({ ...f, is_popular: v }))} id="is_popular" />
                <Label htmlFor="is_popular">Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} id="is_featured" />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editBundle ? "Save Changes" : "Create Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this data bundle. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  )
}
