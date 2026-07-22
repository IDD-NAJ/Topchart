"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatDate } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { CheckSquare, RefreshCw, Search, ShieldCheck, Clock, XCircle, Eye, CheckCircle } from "lucide-react"

interface VerificationRequest {
  id: string
  user_id: string
  user_email?: string
  type?: string
  status: "pending" | "approved" | "rejected" | "expired"
  document_type?: string
  document_url?: string
  selfie_url?: string
  reason?: string
  reviewer_id?: string
  reviewer_notes?: string
  submitted_at?: string
  reviewed_at?: string
  created_at: string
}

interface VerificationResponse {
  success: boolean
  verifications?: VerificationRequest[]
  requests?: VerificationRequest[]
  data?: VerificationRequest[]
  total?: number
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  expired: "outline",
}

export default function AdminVerificationPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<VerificationRequest | null>(null)
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  const params = new URLSearchParams()
  if (statusFilter !== "all") params.set("status", statusFilter)

  const { data, error, isLoading, mutate } = useSWR<VerificationResponse>(
    `/api/admin/verification?${params}`,
    adminFetcher
  )

  const verifications = data?.verifications || data?.requests || data?.data || []
  const filtered = verifications.filter(
    (v) =>
      !search ||
      v.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      v.document_type?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = verifications.filter((v) => v.status === "pending").length
  const approvedCount = verifications.filter((v) => v.status === "approved").length
  const rejectedCount = verifications.filter((v) => v.status === "rejected").length

  const handleAction = async (action: "approved" | "rejected") => {
    if (!selected) return
    setProcessing(true)
    try {
      const res = await adminMutate(`/api/admin/verification`, "PATCH", {
        id: selected.id,
        status: action,
        reviewer_notes: notes,
      })
      if (res.success) {
        toast.success(`Verification ${action}`)
        mutate()
        setSelected(null)
      } else {
        toast.error(res.error || "Failed")
      }
    } catch { toast.error("Something went wrong") }
    finally { setProcessing(false) }
  }

  return (
    <AdminPageShell
      title="Verification"
      description="Review KYC and identity verification requests from users."
      icon={CheckSquare}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={data?.total ?? verifications.length} icon={CheckSquare} />
        <StatCard label="Pending" value={pendingCount} icon={Clock} accent />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle} />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircle} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={CheckSquare} title="Failed to load verifications" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No verification requests" description="Verification requests will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Verification Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">{v.user_email || v.user_id?.slice(0, 12) + "..."}</TableCell>
                    <TableCell>{v.document_type || "—"}</TableCell>
                    <TableCell>{v.type || "KYC"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[v.status] || "outline"} className="text-[10px] capitalize">{v.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(v.submitted_at || v.created_at)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(v.reviewed_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(v); setNotes("") }}>
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
            <DialogTitle>Verification Request</DialogTitle>
            <DialogDescription>{selected?.user_email} — {selected?.document_type}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["User", selected.user_email],
                  ["Type", selected.type || "KYC"],
                  ["Document", selected.document_type],
                  ["Status", selected.status],
                  ["Submitted", formatDate(selected.submitted_at || selected.created_at)],
                ].map(([label, val]) => val ? (
                  <div key={label as string}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-medium capitalize">{val}</p>
                  </div>
                ) : null)}
              </div>
              {selected.document_url && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Document</p>
                  <a href={selected.document_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline-offset-2 hover:underline">View Document</a>
                </div>
              )}
              {selected.reason && (
                <div className="rounded-lg bg-muted p-3 text-sm">{selected.reason}</div>
              )}
              <div className="space-y-1.5">
                <Label>Reviewer Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes about your decision..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selected?.status === "pending" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("rejected")} disabled={processing}>
                  <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                </Button>
                <Button size="sm" onClick={() => handleAction("approved")} disabled={processing}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
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
