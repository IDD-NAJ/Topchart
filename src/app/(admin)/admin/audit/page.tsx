"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { adminFetcher, formatDateTime, exportToCsv } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ClipboardList, RefreshCw, Search, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"

interface AuditLog {
  id: string
  user_id?: string
  user_email?: string
  action: string
  resource_type?: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  status?: string
  created_at: string
}

interface AuditResponse {
  success: boolean
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-700",
  UPDATE: "bg-blue-500/10 text-blue-700",
  DELETE: "bg-red-500/10 text-red-700",
  LOGIN: "bg-purple-500/10 text-purple-700",
  LOGOUT: "bg-gray-500/10 text-gray-700",
  APPROVE: "bg-emerald-500/10 text-emerald-700",
  REJECT: "bg-red-500/10 text-red-700",
}

const PAGE_SIZE = 30

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [resourceFilter, setResourceFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  if (actionFilter !== "all") params.set("action", actionFilter)
  if (resourceFilter !== "all") params.set("resource_type", resourceFilter)
  if (search) params.set("search", search)

  const { data, error, isLoading, mutate } = useSWR<AuditResponse>(
    `/api/admin/audit-logs?${params}`,
    adminFetcher
  )

  const logs = data?.logs || []
  const totalPages = data ? Math.ceil((data.total ?? 0) / PAGE_SIZE) : 1
  const resources = Array.from(new Set(logs.map((l) => l.resource_type).filter(Boolean)))

  const handleExport = () => {
    exportToCsv("audit-logs.csv", logs.map((l) => ({
      id: l.id,
      action: l.action,
      resource_type: l.resource_type,
      resource_id: l.resource_id,
      user_email: l.user_email,
      ip_address: l.ip_address,
      status: l.status,
      created_at: l.created_at,
    })))
  }

  const actionColor = (action: string) => {
    const upper = action.toUpperCase()
    return ACTION_COLORS[upper] || "bg-muted text-muted-foreground"
  }

  return (
    <AdminPageShell
      title="Audit Logs"
      description="Full immutable record of all admin and user actions."
      icon={ClipboardList}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
        </div>
      }
    >
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search user, action..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-8 h-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "APPROVE", "REJECT"].map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Resource" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {resources.map((r) => <SelectItem key={r as string} value={r as string}>{r as string}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{data?.total ?? "—"} total logs</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={ClipboardList} title="Failed to load logs" description={error.message} />
        ) : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No audit logs found" description="Activity will appear here as actions are taken." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${actionColor(l.action)}`}>
                        {l.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{l.resource_type || "—"}</span>
                      {l.resource_id && <span className="text-muted-foreground ml-1 font-mono text-[10px]">#{l.resource_id.slice(0, 8)}</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.user_email || l.user_id?.slice(0, 12) || "System"}</TableCell>
                    <TableCell className="font-mono text-sm">{l.ip_address || "—"}</TableCell>
                    <TableCell>
                      {l.status && (
                        <Badge variant={l.status === "success" ? "default" : "destructive"} className="text-[10px] capitalize">
                          {l.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(l.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(l)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </AdminTableShell>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
            <DialogDescription>{formatDateTime(selected?.created_at)}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Action", selected.action],
                  ["Resource Type", selected.resource_type],
                  ["Resource ID", selected.resource_id],
                  ["User", selected.user_email || selected.user_id],
                  ["IP Address", selected.ip_address],
                  ["Status", selected.status],
                ].map(([label, val]) => val ? (
                  <div key={label as string}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-mono text-xs break-all">{val}</p>
                  </div>
                ) : null)}
              </div>
              {selected.changes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Changes</p>
                  <pre className="rounded-lg bg-muted p-3 text-[10px] overflow-x-auto max-h-48">
                    {JSON.stringify(selected.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
