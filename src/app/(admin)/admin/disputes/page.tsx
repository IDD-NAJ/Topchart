"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency, formatDateTime } from "@/lib/admin-fetcher"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RefreshCw, Gavel } from "lucide-react"

interface AdminDispute {
  id: string
  transaction_id: string
  user_id: string
  status: string
  reason: string | null
  resolution: string | null
  created_at: string
  resolved_at: string | null
  transaction_type: string | null
  transaction_amount: number | null
  transaction_reference: string | null
  user_email: string | null
  user_first_name: string | null
  user_last_name: string | null
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toUpperCase()
  if (s === "RESOLVED") return "default"
  if (s === "IN_PROGRESS") return "secondary"
  if (s === "OPEN") return "destructive"
  return "outline"
}

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<AdminDispute | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [resolution, setResolution] = useState("")
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; disputes: AdminDispute[] }>(
    `/api/admin/disputes${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`,
    adminFetcher
  )

  const disputes = data?.disputes || []

  const openDialog = (dispute: AdminDispute) => {
    setSelected(dispute)
    setNewStatus(dispute.status)
    setResolution(dispute.resolution || "")
  }

  const handleResolve = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await adminMutate("/api/admin/disputes", "PATCH", {
        id: selected.id,
        status: newStatus,
        resolution: resolution.trim() || undefined,
      })
      toast.success("Dispute updated")
      setSelected(null)
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to update dispute")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Disputes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${disputes.length} disputes` : "Loading disputes..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" aria-label="Filter disputes by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">Failed to load disputes: {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !error && disputes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No disputes found</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && disputes.length > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell>
                      <p className="max-w-44 truncate text-sm">{d.user_email || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm capitalize">{d.transaction_type || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.transaction_amount != null ? formatCurrency(Number(d.transaction_amount)) : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-52 truncate text-sm">{d.reason || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(d.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => openDialog(d)}>
                          <Gavel className="mr-2 h-4 w-4" />
                          Resolve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {disputes.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{d.user_email || d.user_id}</p>
                      <p className="font-mono text-xs text-muted-foreground">{d.id}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.reason || "No reason given"}</p>
                    </div>
                    <Badge variant={statusVariant(d.status)} className="shrink-0">
                      {d.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">{formatDateTime(d.created_at)}</span>
                    <Button variant="outline" size="sm" className="min-h-10" onClick={() => openDialog(d)}>
                      <Gavel className="mr-2 h-4 w-4" />
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Resolve dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription className="font-mono text-xs">{selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">User: </span>
                  {selected.user_email || selected.user_id}
                </p>
                <p>
                  <span className="text-muted-foreground">Transaction: </span>
                  <span className="capitalize">{selected.transaction_type || "—"}</span>
                  {selected.transaction_amount != null &&
                    ` · ${formatCurrency(Number(selected.transaction_amount))}`}
                </p>
                <p className="mt-2">
                  <span className="text-muted-foreground">Reason: </span>
                  {selected.reason || "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dispute-status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="dispute-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dispute-resolution">Resolution notes</Label>
                <Textarea
                  id="dispute-resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this dispute was resolved..."
                  rows={4}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button onClick={handleResolve} disabled={saving}>
                  {saving ? "Saving..." : "Update dispute"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
