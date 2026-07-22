"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Activity, RefreshCw, Pencil, CheckCircle2, AlertTriangle, WrenchIcon, Zap } from "lucide-react"

interface ServiceStatus {
  id: string
  service_key: string
  service_name: string
  description?: string | null
  is_enabled: boolean
  is_maintenance: boolean
  is_coming_soon: boolean
  coming_soon_message?: string | null
  maintenance_message?: string | null
  display_order: number
  icon_name?: string | null
  updated_at: string
}

interface ServiceStatusResponse {
  success: boolean
  services: ServiceStatus[]
  total?: number
}

export default function AdminServiceStatusPage() {
  const [editService, setEditService] = useState<ServiceStatus | null>(null)
  const [form, setForm] = useState<Partial<ServiceStatus>>({})
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<ServiceStatusResponse>(
    "/api/admin/service-status",
    adminFetcher
  )

  const services = data?.services || []
  const enabledCount = services.filter((s) => s.is_enabled && !s.is_maintenance).length
  const maintenanceCount = services.filter((s) => s.is_maintenance).length
  const comingSoonCount = services.filter((s) => s.is_coming_soon).length

  const openEdit = (s: ServiceStatus) => {
    setForm({ ...s })
    setEditService(s)
  }

  const handleSave = async () => {
    if (!editService) return
    setSaving(true)
    try {
      const res = await adminMutate("/api/admin/service-status", "PATCH", {
        id: editService.id,
        service_key: editService.service_key,
        is_enabled: form.is_enabled,
        is_maintenance: form.is_maintenance,
        is_coming_soon: form.is_coming_soon,
        maintenance_message: form.maintenance_message,
        coming_soon_message: form.coming_soon_message,
      })
      if (res.success) {
        toast.success("Service updated")
        setEditService(null)
        mutate()
      } else {
        toast.error(res.error || "Failed to update")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const getStatusBadge = (s: ServiceStatus) => {
    if (s.is_maintenance) return <Badge variant="destructive" className="text-[10px]"><WrenchIcon className="w-2.5 h-2.5 mr-1" />Maintenance</Badge>
    if (s.is_coming_soon) return <Badge variant="secondary" className="text-[10px]"><Zap className="w-2.5 h-2.5 mr-1" />Coming Soon</Badge>
    if (s.is_enabled) return <Badge className="text-[10px] bg-green-500"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Operational</Badge>
    return <Badge variant="outline" className="text-[10px]">Disabled</Badge>
  }

  return (
    <AdminPageShell
      title="Service Status"
      description="Monitor and control platform services and their availability."
      icon={Activity}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Services" value={services.length} icon={Activity} />
        <StatCard label="Operational" value={enabledCount} icon={CheckCircle2} accent />
        <StatCard label="Maintenance" value={maintenanceCount} icon={WrenchIcon} />
        <StatCard label="Coming Soon" value={comingSoonCount} icon={Zap} />
      </div>

      {/* Status card grid */}
      {!isLoading && !error && services.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.sort((a, b) => a.display_order - b.display_order).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.is_maintenance ? "bg-destructive/10" : s.is_enabled ? "bg-green-500/10" : "bg-muted"}`}>
                  <Activity className={`h-4 w-4 ${s.is_maintenance ? "text-destructive" : s.is_enabled ? "text-green-600" : "text-muted-foreground"}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{s.service_name}</p>
                  <div className="mt-0.5">{getStatusBadge(s)}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(s)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AdminTableShell>
        <AdminTableHeader>
          <p className="text-sm font-semibold">{services.length} service{services.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Activity} title="Failed to load services" description={error.message} />
        ) : services.length === 0 ? (
          <EmptyState icon={Activity} title="No services configured" description="Service status records will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Coming Soon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.sort((a, b) => a.display_order - b.display_order).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">{s.display_order}</TableCell>
                    <TableCell className="font-medium">{s.service_name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-[10px]">{s.service_key}</Badge></TableCell>
                    <TableCell>{s.is_enabled ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{s.is_maintenance ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{s.is_coming_soon ? <Zap className="w-4 h-4 text-blue-500" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{getStatusBadge(s)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
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

      <Dialog open={!!editService} onOpenChange={(o) => !o && setEditService(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service — {editService?.service_name}</DialogTitle>
            <DialogDescription>Update status and availability for this service.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {[
                { field: "is_enabled", label: "Enabled", desc: "Make this service available to users" },
                { field: "is_maintenance", label: "Maintenance Mode", desc: "Temporarily disable with a message" },
                { field: "is_coming_soon", label: "Coming Soon", desc: "Show as coming soon to users" },
              ].map(({ field, label, desc }) => (
                <div key={field} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={!!(form as Record<string, unknown>)[field]}
                    onCheckedChange={(c) => setForm((f) => ({ ...f, [field]: c }))}
                  />
                </div>
              ))}
            </div>
            {form.is_maintenance && (
              <div className="space-y-1.5">
                <Label>Maintenance Message</Label>
                <Textarea
                  value={form.maintenance_message || ""}
                  onChange={(e) => setForm((f) => ({ ...f, maintenance_message: e.target.value }))}
                  placeholder="This service is currently undergoing maintenance..."
                  rows={2}
                />
              </div>
            )}
            {form.is_coming_soon && (
              <div className="space-y-1.5">
                <Label>Coming Soon Message</Label>
                <Input
                  value={form.coming_soon_message || ""}
                  onChange={(e) => setForm((f) => ({ ...f, coming_soon_message: e.target.value }))}
                  placeholder="Launching soon..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditService(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
