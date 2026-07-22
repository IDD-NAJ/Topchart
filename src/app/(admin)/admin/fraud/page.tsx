"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, RefreshCw, Search, ShieldAlert, ShieldCheck, Clock, Eye } from "lucide-react"

interface FraudAlert {
  id: string
  user_id?: string
  user_email?: string
  alert_type: string
  description?: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "investigating" | "resolved" | "dismissed"
  risk_score?: number
  ip_address?: string
  metadata?: Record<string, unknown>
  created_at: string
  resolved_at?: string
  notes?: string
}

interface FraudResponse {
  success: boolean
  alerts: FraudAlert[]
  total: number
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600",
  medium: "bg-amber-500/10 text-amber-600",
  high: "bg-orange-500/10 text-orange-600",
  critical: "bg-red-500/10 text-red-600 font-bold",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  investigating: "secondary",
  resolved: "default",
  dismissed: "outline",
}

export default function AdminFraudPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [selected, setSelected] = useState<FraudAlert | null>(null)
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)
  if (severityFilter !== "all") params.set("severity", severityFilter)

  const { data, error, isLoading, mutate } = useSWR<FraudResponse>(
    `/api/admin/fraud-alerts?${params}`,
    adminFetcher
  )

  const alerts = data?.alerts || []
  const filtered = alerts.filter(
    (a) =>
      !search ||
      a.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.alert_type?.toLowerCase().includes(search.toLowerCase()) ||
      a.ip_address?.includes(search)
  )

  const openAlert = (a: FraudAlert) => { setSelected(a); setNotes(a.notes || "") }

  const handleUpdateStatus = async (status: string) => {
    if (!selected) return
    setProcessing(true)
    try {
      const res = await adminMutate(`/api/admin/fraud-alerts`, "PATCH", {
        id: selected.id, status, notes,
      })
      if (res.success) { toast.success(`Alert ${status}`); mutate(); setSelected(null) }
      else toast.error(res.error || "Failed")
    } catch { toast.error("Something went wrong") }
    finally { setProcessing(false) }
  }

  const openCount = alerts.filter((a) => a.status === "open").length
  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length

  return (
    <AdminPageShell
      title="Fraud Alerts"
      description="Monitor and investigate suspicious activity across the platform."
      icon={AlertTriangle}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Alerts" value={data?.total ?? "—"} icon={ShieldAlert} />
        <StatCard label="Open" value={openCount} icon={AlertTriangle} accent />
        <StatCard label="Critical" value={criticalCount} icon={ShieldAlert} />
        <StatCard label="Resolved" value={resolvedCount} icon={ShieldCheck} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} alert{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Failed to load alerts" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No alerts found" description="Platform looks clean!" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.alert_type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.user_email || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${SEVERITY_COLORS[a.severity] || ""}`}>
                        {a.severity}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{a.risk_score ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{a.ip_address || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[a.status] || "outline"} className="text-[10px] capitalize">{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(a.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAlert(a)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fraud Alert — {selected?.alert_type}</DialogTitle>
            <DialogDescription>
              {selected?.user_email} &bull; Detected {formatDateTime(selected?.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize mt-1 ${SEVERITY_COLORS[selected.severity]}`}>{selected.severity}</span>
                </div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                  <Badge variant={STATUS_VARIANTS[selected.status]} className="mt-1 text-[10px] capitalize">{selected.status}</Badge>
                </div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</p>
                  <p className="mt-0.5 font-mono font-bold">{selected.risk_score ?? "—"}</p>
                </div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</p>
                  <p className="mt-0.5 font-mono">{selected.ip_address || "—"}</p>
                </div>
              </div>
              {selected.description && (
                <div className="rounded-lg bg-muted p-3 text-sm">{selected.description}</div>
              )}
              <div className="space-y-1.5">
                <Label>Investigation Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this alert..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2">
            {selected?.status === "open" && (
              <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus("investigating")} disabled={processing}>
                <Clock className="w-3.5 h-3.5 mr-1" />Investigate
              </Button>
            )}
            {selected?.status !== "resolved" && (
              <Button size="sm" onClick={() => handleUpdateStatus("resolved")} disabled={processing}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />Resolve
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus("dismissed")} disabled={processing}>
              Dismiss
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
