"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatDateTime } from "@/lib/admin-fetcher"
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
import { Network, RefreshCw, Plus, Pencil, Trash2, CheckCircle } from "lucide-react"

interface NetworkRow {
  id: string
  code: string
  name: string
  color?: string | null
  is_active: boolean
  bundle_count: number
  created_at: string
  updated_at: string
}

const EMPTY_FORM = { code: "", name: "", color: "#000000", is_active: true }

export default function AdminNetworksPage() {
  const [editNetwork, setEditNetwork] = useState<NetworkRow | null>(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; networks: NetworkRow[] }>(
    "/api/admin/networks",
    adminFetcher
  )

  const networks = data?.networks ?? []
  const active   = networks.filter((n) => n.is_active).length

  function openEdit(n: NetworkRow) {
    setForm({ code: n.code, name: n.name, color: n.color ?? "#000000", is_active: n.is_active })
    setEditNetwork(n)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setShowCreate(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editNetwork) {
        await adminMutate("/api/admin/networks", "PATCH", { id: editNetwork.id, ...form })
        toast.success("Network updated")
        setEditNetwork(null)
      } else {
        await adminMutate("/api/admin/networks", "POST", form)
        toast.success("Network created")
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
      await adminMutate("/api/admin/networks", "DELETE", { id: deleteId })
      toast.success("Network deleted")
      setDeleteId(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const dialogOpen  = !!editNetwork || showCreate
  const setDialogOpen = (v: boolean) => { if (!v) { setEditNetwork(null); setShowCreate(false) } }

  return (
    <AdminPageShell
      title="Networks"
      description="Manage mobile network operators"
      icon={Network}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}
            className="text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Network
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Networks" value={isLoading ? <Skeleton className="h-8 w-12" /> : networks.length} icon={Network} />
        <StatCard label="Active"         value={isLoading ? <Skeleton className="h-8 w-12" /> : active}          icon={CheckCircle} accent />
        <StatCard label="Inactive"       value={isLoading ? <Skeleton className="h-8 w-12" /> : networks.length - active} icon={Network} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <p className="text-sm font-semibold">All Networks</p>
          <p className="text-xs text-muted-foreground">{networks.length} networks</p>
        </AdminTableHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Bundles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-destructive py-8">
                    {(error as any).message || "Failed to load networks"}
                  </TableCell>
                </TableRow>
              ) : networks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={Network} title="No networks found" description="Add your first network" />
                  </TableCell>
                </TableRow>
              ) : (
                networks.map((n) => (
                  <TableRow key={n.id} className="group">
                    <TableCell>
                      <span
                        className="inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                        style={{ backgroundColor: n.color ?? "#888", color: "#fff" }}
                      >
                        {n.code}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{n.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-5 w-5 rounded border border-border"
                          style={{ backgroundColor: n.color ?? "#888" }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">{n.color ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{n.bundle_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={n.is_active ? "default" : "outline"} className="text-xs">
                        {n.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(n.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(n)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(n.id)}
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editNetwork ? "Edit Network" : "Add Network"}</DialogTitle>
            <DialogDescription>
              {editNetwork ? `Editing ${editNetwork.name}` : "Add a new mobile network operator"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Code (e.g. MTN) *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="MTN"
                maxLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="MTN Ghana"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-9 w-14 cursor-pointer rounded border border-border"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#FFCC00"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                id="net_active"
              />
              <Label htmlFor="net_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.code || !form.name}>
              {saving ? "Saving..." : editNetwork ? "Save Changes" : "Add Network"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Network?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this network. Existing bundles will not be affected.
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
