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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Bell, RefreshCw, Plus, Send, Megaphone, Users, Info } from "lucide-react"

interface Notification {
  id: string
  user_id?: string | null
  type: string
  title: string
  message: string
  is_read: boolean
  action_url?: string | null
  created_at: string
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  total: number
}

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-amber-500/10 text-amber-600",
  error: "bg-red-500/10 text-red-600",
  promo: "bg-purple-500/10 text-purple-600",
}

export default function AdminNotificationsPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    action_url: "",
    target: "all",
    user_ids: "",
  })
  const [sending, setSending] = useState(false)

  const params = new URLSearchParams()
  if (typeFilter !== "all") params.set("type", typeFilter)

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/admin/notifications?${params}`,
    adminFetcher
  )

  const notifications = data?.notifications || []
  const filtered = notifications.filter(
    (n) =>
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error("Title and message are required"); return }
    setSending(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        message: form.message,
        type: form.type,
        action_url: form.action_url || undefined,
        target: form.target,
      }
      if (form.target === "specific" && form.user_ids) {
        body.user_ids = form.user_ids.split(",").map((s) => s.trim()).filter(Boolean)
      }
      const res = await adminMutate("/api/admin/notifications", "POST", body)
      if (res.success) {
        toast.success("Notification sent successfully")
        setCreateOpen(false)
        setForm({ title: "", message: "", type: "info", action_url: "", target: "all", user_ids: "" })
        mutate()
      } else {
        toast.error(res.error || "Failed to send")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSending(false) }
  }

  const readCount = notifications.filter((n) => n.is_read).length
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <AdminPageShell
      title="Notifications"
      description="Send and manage platform notifications to users."
      icon={Bell}
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />Send Notification
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Sent" value={data?.total ?? "—"} icon={Megaphone} />
        <StatCard label="Unread" value={unreadCount} icon={Bell} accent />
        <StatCard label="Read" value={readCount} icon={Users} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-3" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Bell} title="Failed to load notifications" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications found" description="Send your first notification above." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium max-w-[160px] truncate">{n.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{n.message}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${TYPE_COLORS[n.type] || "bg-muted text-muted-foreground"}`}>
                        {n.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{n.user_id ? n.user_id.slice(0, 12) + "..." : "All"}</TableCell>
                    <TableCell>
                      <Badge variant={n.is_read ? "default" : "secondary"} className="text-[10px]">
                        {n.is_read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(n.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      {/* Create / Send dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" style={{ color: "var(--marketing-accent,#F38F20)" }} />
              Send Notification
            </DialogTitle>
            <DialogDescription>Broadcast a message to users on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["info", "success", "warning", "error", "promo"].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Select value={form.target} onValueChange={(v) => setForm((f) => ({ ...f, target: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.target === "specific" && (
              <div className="space-y-1.5">
                <Label>User IDs (comma-separated)</Label>
                <Input value={form.user_ids} onChange={(e) => setForm((f) => ({ ...f, user_ids: e.target.value }))} placeholder="uuid1, uuid2, ..." />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Notification message..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Action URL (optional)</Label>
              <Input value={form.action_url} onChange={(e) => setForm((f) => ({ ...f, action_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              <Send className="w-4 h-4 mr-1.5" />
              {sending ? "Sending..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
