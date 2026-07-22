"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { FileText, RefreshCw, Plus, Pencil, Eye, Globe, EyeOff } from "lucide-react"

interface HomepageSection {
  id: string
  section_key: string
  title?: string
  subtitle?: string
  body?: string
  cta_text?: string
  cta_url?: string
  is_active: boolean
  metadata?: Record<string, unknown>
  updated_at: string
}

interface HomepageResponse {
  success: boolean
  sections?: HomepageSection[]
  content?: HomepageSection[]
  data?: HomepageSection[]
}

const defaultForm = { title: "", subtitle: "", body: "", cta_text: "", cta_url: "", is_active: true, section_key: "" }

export default function AdminCMSPage() {
  const [editSection, setEditSection] = useState<HomepageSection | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [preview, setPreview] = useState<HomepageSection | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<HomepageResponse>("/api/admin/homepage", adminFetcher)
  const sections = data?.sections || data?.content || data?.data || []

  const openEdit = (s: HomepageSection) => {
    setForm({
      title: s.title || "",
      subtitle: s.subtitle || "",
      body: s.body || "",
      cta_text: s.cta_text || "",
      cta_url: s.cta_url || "",
      is_active: s.is_active,
      section_key: s.section_key,
    })
    setEditSection(s)
  }

  const handleSave = async () => {
    if (!editSection) return
    setSaving(true)
    try {
      const res = await adminMutate("/api/admin/homepage", "PATCH", {
        id: editSection.id,
        ...form,
      })
      if (res.success) {
        toast.success("Section updated")
        setEditSection(null)
        mutate()
      } else {
        toast.error(res.error || "Failed to update")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const activeCount = sections.filter((s) => s.is_active).length

  return (
    <AdminPageShell
      title="CMS / Homepage"
      description="Manage homepage sections, banners, and content blocks."
      icon={FileText}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Sections" value={sections.length} icon={Globe} />
        <StatCard label="Active" value={activeCount} icon={Eye} accent />
        <StatCard label="Hidden" value={sections.length - activeCount} icon={EyeOff} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <p className="text-sm font-semibold">{sections.length} content section{sections.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={FileText} title="Failed to load sections" description={error.message} />
        ) : sections.length === 0 ? (
          <EmptyState icon={FileText} title="No sections found" description="Homepage content sections will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Subtitle</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">{s.section_key}</Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[160px] truncate">{s.title || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{s.subtitle || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {s.cta_text ? (
                        <span className="text-primary underline-offset-2 hover:underline">{s.cta_text}</span>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">
                        {s.is_active ? "Visible" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(s.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(s)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                          <Pencil className="w-3.5 h-3.5" />
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

      {/* Edit Dialog */}
      <Dialog open={!!editSection} onOpenChange={(o) => !o && setEditSection(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Section — <code className="text-sm font-mono">{editSection?.section_key}</code></DialogTitle>
            <DialogDescription>Update the content for this homepage section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Body / Description</Label>
              <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CTA Text</Label>
                <Input value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} placeholder="Get Started" />
              </div>
              <div className="space-y-1.5">
                <Label>CTA URL</Label>
                <Input value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} placeholder="/dashboard" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Visible</p>
                <p className="text-xs text-muted-foreground">Show this section on the homepage</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview — {preview?.section_key}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 py-2">
              {preview.title && <h2 className="text-2xl font-black">{preview.title}</h2>}
              {preview.subtitle && <p className="text-muted-foreground text-base">{preview.subtitle}</p>}
              {preview.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{preview.body}</p>}
              {preview.cta_text && (
                <div className="pt-2">
                  <a href={preview.cta_url || "#"} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
                    {preview.cta_text}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
