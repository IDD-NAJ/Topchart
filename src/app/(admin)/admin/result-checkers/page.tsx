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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CheckSquare, RefreshCw, Plus, Pencil, Search } from "lucide-react"

interface ResultCheckerCard {
  id: string
  title: string
  description?: string
  exam_type?: string
  status: "active" | "inactive" | "coming_soon"
  provider_url?: string
  icon_url?: string
  price?: number
  sort_order?: number
  created_at: string
}

interface ResultCheckersResponse {
  success: boolean
  cards: ResultCheckerCard[]
  total?: number
}

const defaultForm = { title: "", description: "", exam_type: "", provider_url: "", price: "", sort_order: "0", status: "active" as const }

export default function AdminResultCheckersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editCard, setEditCard] = useState<ResultCheckerCard | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<typeof defaultForm>(defaultForm)
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)

  const { data, error, isLoading, mutate } = useSWR<ResultCheckersResponse>(
    `/api/admin/result-checkers?${params}`,
    adminFetcher
  )

  const cards = data?.cards || []
  const filtered = cards.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.exam_type?.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = cards.filter((c) => c.status === "active").length

  const openEdit = (c: ResultCheckerCard) => {
    setForm({
      title: c.title,
      description: c.description || "",
      exam_type: c.exam_type || "",
      provider_url: c.provider_url || "",
      price: c.price != null ? String(c.price) : "",
      sort_order: String(c.sort_order ?? 0),
      status: c.status,
    })
    setEditCard(c)
    setCreateOpen(true)
  }

  const openCreate = () => { setForm(defaultForm); setEditCard(null); setCreateOpen(true) }

  const handleSave = async () => {
    if (!form.title) { toast.error("Title is required"); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        sort_order: parseInt(form.sort_order) || 0,
        ...(editCard ? { id: editCard.id } : {}),
      }
      const res = editCard
        ? await adminMutate("/api/admin/result-checkers", "PATCH", body)
        : await adminMutate("/api/admin/result-checkers", "POST", body)
      if (res.success) {
        toast.success(editCard ? "Card updated" : "Card created")
        setCreateOpen(false)
        mutate()
      } else {
        toast.error(res.error || "Failed")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  return (
    <AdminPageShell
      title="Result Checkers"
      description="Manage exam result checker services and their settings."
      icon={CheckSquare}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}><RefreshCw className="w-4 h-4 mr-1.5" />Refresh</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Add Checker</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Checkers" value={cards.length} icon={CheckSquare} />
        <StatCard label="Active" value={activeCount} icon={CheckSquare} accent />
        <StatCard label="Inactive" value={cards.length - activeCount} icon={CheckSquare} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search checkers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} checker{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={CheckSquare} title="Failed to load result checkers" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No result checkers" description="Add your first checker above." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Exam Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{c.sort_order ?? "—"}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      {c.exam_type && <Badge variant="outline" className="text-[10px]">{c.exam_type}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{c.price != null ? `GH₵ ${Number(c.price).toFixed(2)}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                        {c.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(c.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
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

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCard ? "Edit Result Checker" : "Add Result Checker"}</DialogTitle>
            <DialogDescription>Configure an exam result checker service.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. WASSCE Result Checker" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Exam Type</Label>
                <Input value={form.exam_type} onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))} placeholder="WASSCE, BECE..." />
              </div>
              <div className="space-y-1.5">
                <Label>Price (GH₵)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="5.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Provider URL</Label>
              <Input value={form.provider_url} onChange={(e) => setForm((f) => ({ ...f, provider_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof form.status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editCard ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
