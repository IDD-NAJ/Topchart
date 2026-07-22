"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate } from "@/lib/admin-fetcher"
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
import { Navigation, RefreshCw, Plus, Pencil, Trash2, GripVertical } from "lucide-react"

interface NavLink {
  id: string
  label: string
  href: string
  section?: string
  position?: number
  is_active: boolean
  target?: string
  icon?: string
  badge_text?: string | null
  parent_id?: string | null
  created_at: string
}

interface NavResponse {
  success: boolean
  links?: NavLink[]
  navigation?: NavLink[]
}

const defaultForm = { label: "", href: "", section: "main", target: "_self", is_active: true, badge_text: "", icon: "" }

export default function AdminNavigationPage() {
  const [editLink, setEditLink] = useState<NavLink | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<NavResponse>("/api/admin/navigation", adminFetcher)
  const links = data?.links || data?.navigation || []

  const openCreate = () => { setForm(defaultForm); setEditLink(null); setCreateOpen(true) }
  const openEdit = (link: NavLink) => {
    setForm({
      label: link.label,
      href: link.href,
      section: link.section || "main",
      target: link.target || "_self",
      is_active: link.is_active,
      badge_text: link.badge_text || "",
      icon: link.icon || "",
    })
    setEditLink(link)
    setCreateOpen(true)
  }

  const handleSave = async () => {
    if (!form.label || !form.href) { toast.error("Label and URL are required"); return }
    setSaving(true)
    try {
      let res
      if (editLink) {
        res = await adminMutate(`/api/admin/navigation`, "PATCH", { id: editLink.id, ...form, badge_text: form.badge_text || null })
      } else {
        res = await adminMutate(`/api/admin/navigation`, "POST", { ...form, badge_text: form.badge_text || null })
      }
      if (res.success) {
        toast.success(editLink ? "Link updated" : "Link created")
        setCreateOpen(false)
        mutate()
      } else {
        toast.error(res.error || "Failed")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await adminMutate("/api/admin/navigation", "DELETE", { id: deleteId })
      if (res.success) { toast.success("Link deleted"); mutate(); setDeleteId(null) }
      else toast.error(res.error || "Failed to delete")
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const sections = Array.from(new Set(links.map((l) => l.section).filter(Boolean)))

  return (
    <AdminPageShell
      title="Navigation"
      description="Manage site navigation links and menu structure."
      icon={Navigation}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}><RefreshCw className="w-4 h-4 mr-1.5" />Refresh</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Add Link</Button>
        </div>
      }
    >
      <AdminTableShell>
        <AdminTableHeader>
          <p className="font-semibold text-sm">{links.length} navigation link{links.length !== 1 ? "s" : ""}</p>
          <p className="text-sm text-muted-foreground">{sections.length} section{sections.length !== 1 ? "s" : ""}: {sections.join(", ")}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Navigation} title="Failed to load navigation" description={error.message} />
        ) : links.length === 0 ? (
          <EmptyState icon={Navigation} title="No links yet" description="Add your first navigation link above." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Label</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell><GripVertical className="w-4 h-4 text-muted-foreground/40" /></TableCell>
                    <TableCell className="font-medium">{link.label}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{link.href}</TableCell>
                    <TableCell>
                      {link.section && <Badge variant="outline" className="text-[10px] capitalize">{link.section}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{link.target || "_self"}</TableCell>
                    <TableCell>
                      {link.badge_text && <Badge className="text-[10px]" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>{link.badge_text}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.is_active ? "default" : "secondary"} className="text-[10px]">
                        {link.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(link)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(link.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editLink ? "Edit Link" : "Add Navigation Link"}</DialogTitle>
            <DialogDescription>Configure a navigation menu item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Label *</Label>
                <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Home" />
              </div>
              <div className="space-y-1.5">
                <Label>URL *</Label>
                <Input value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} placeholder="/dashboard" />
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select value={form.section} onValueChange={(v) => setForm((f) => ({ ...f, section: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["main", "footer", "sidebar", "mobile"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Select value={form.target} onValueChange={(v) => setForm((f) => ({ ...f, target: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Same Tab</SelectItem>
                    <SelectItem value="_blank">New Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Badge Text (optional)</Label>
              <Input value={form.badge_text} onChange={(e) => setForm((f) => ({ ...f, badge_text: e.target.value }))} placeholder="e.g. New, Hot" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this link in navigation</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editLink ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Link?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
