"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency, formatDate } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Store, RefreshCw, Search, Users, CheckCircle, Clock, XCircle, Eye } from "lucide-react"

interface Reseller {
  id: string
  user_id?: string
  business_name?: string
  business_type?: string
  status: "pending" | "approved" | "rejected" | "active" | "suspended"
  tier?: string
  commission_rate?: number
  total_sales?: number
  created_at: string
  approved_at?: string
  email?: string
  phone?: string
  region?: string
}

interface ResellersResponse {
  success: boolean
  resellers: Reseller[]
  total: number
  stats?: { pending: number; approved: number; rejected: number }
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  suspended: "destructive",
}

export default function AdminResellersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<Reseller | null>(null)
  const [processing, setProcessing] = useState(false)

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)
  const { data, error, isLoading, mutate } = useSWR<ResellersResponse>(
    `/api/admin/resellers?${params}`,
    adminFetcher
  )

  const resellers = data?.resellers || []
  const filtered = resellers.filter(
    (r) =>
      !search ||
      r.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  )

  const handleApprove = async (id: string) => {
    setProcessing(true)
    try {
      const res = await adminMutate(`/api/admin/resellers`, "PATCH", { id, status: "approved" })
      if (res.success) { toast.success("Reseller approved"); mutate(); setSelected(null) }
      else toast.error(res.error || "Failed")
    } catch { toast.error("Something went wrong") }
    finally { setProcessing(false) }
  }

  const handleReject = async (id: string) => {
    setProcessing(true)
    try {
      const res = await adminMutate(`/api/admin/resellers`, "PATCH", { id, status: "rejected" })
      if (res.success) { toast.success("Reseller rejected"); mutate(); setSelected(null) }
      else toast.error(res.error || "Failed")
    } catch { toast.error("Something went wrong") }
    finally { setProcessing(false) }
  }

  const stats = data?.stats
  const pendingCount = stats?.pending ?? resellers.filter(r => r.status === "pending").length
  const approvedCount = stats?.approved ?? resellers.filter(r => r.status === "approved" || r.status === "active").length

  return (
    <AdminPageShell
      title="Resellers"
      description="Manage reseller applications, approvals, and commissions."
      icon={Store}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Resellers" value={data?.total ?? "—"} icon={Users} />
        <StatCard label="Pending" value={pendingCount} icon={Clock} accent />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle} />
        <StatCard label="Rejected" value={stats?.rejected ?? resellers.filter(r => r.status === "rejected").length} icon={XCircle} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search resellers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} reseller{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Store} title="Failed to load resellers" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Store} title="No resellers found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.business_name || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{r.email || "—"}</div>
                      {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                    </TableCell>
                    <TableCell>{r.business_type || "—"}</TableCell>
                    <TableCell>
                      {r.tier && <Badge variant="outline" className="text-[10px]">{r.tier}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{r.commission_rate != null ? `${r.commission_rate}%` : "—"}</TableCell>
                    <TableCell className="text-right">{r.total_sales != null ? formatCurrency(r.total_sales) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[r.status] || "outline"} className="text-[10px] capitalize">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(r)}>
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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.business_name || "Reseller"}</DialogTitle>
            <DialogDescription>Review and manage this reseller application.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["Business Type", selected.business_type],
                  ["Region", selected.region],
                  ["Tier", selected.tier],
                  ["Commission", selected.commission_rate != null ? `${selected.commission_rate}%` : null],
                  ["Status", selected.status],
                  ["Applied", formatDate(selected.created_at)],
                ].map(([label, value]) => value ? (
                  <div key={label as string}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-medium capitalize">{value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selected?.status === "pending" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => selected && handleReject(selected.id)} disabled={processing}>
                  Reject
                </Button>
                <Button size="sm" onClick={() => selected && handleApprove(selected.id)} disabled={processing}>
                  Approve
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
