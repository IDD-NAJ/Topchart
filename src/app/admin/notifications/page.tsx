"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, RefreshCw, Bell, Search, Send, Users, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

const TYPE_CONFIG = {
  info: { label: "Info", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Info },
  success: { label: "Success", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  warning: { label: "Warning", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: AlertTriangle },
  error: { label: "Error / Urgent", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "error",
    action_url: "",
    target: "all" as "all" | "specific",
  });

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        setError(data.error || "Failed to fetch notifications");
      }
    } catch {
      setError("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch {}
    finally { setUsersLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);
  useEffect(() => { if (dialogOpen) fetchUsers(); }, [dialogOpen]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required");
      return;
    }
    if (form.target === "specific" && selectedUserIds.length === 0) {
      setError("Please select at least one user");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          type: form.type,
          action_url: form.action_url || undefined,
          target: form.target,
          user_ids: form.target === "specific" ? selectedUserIds : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "Notification sent successfully");
        setDialogOpen(false);
        setForm({ title: "", message: "", type: "info", action_url: "", target: "all" });
        setSelectedUserIds([]);
        await fetchNotifications();
      } else {
        setError(data.error || "Failed to send");
      }
    } catch {
      setError("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        setError(data.error || "Failed to delete");
      }
    } catch {
      setError("Failed to delete notification");
    } finally {
      setDeleting(null);
    }
  };

  const handleCleanup = async () => {
    try {
      const res = await fetch("/api/admin/notifications", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccess("Old read notifications cleaned up");
        await fetchNotifications();
      }
    } catch {}
  };

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleUserToggle = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Pop-ups</h1>
          <p className="text-muted-foreground mt-1">
            Send in-app notification pop-ups to users. These appear in the user&apos;s notification bell.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCleanup} variant="outline" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Clean Old
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Send Notification Pop-up</DialogTitle>
                <DialogDescription>
                  Send a notification that will appear in the user&apos;s notification bell and as an in-app pop-up.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Action URL (optional)</Label>
                  <Input
                    value={form.action_url}
                    onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                    placeholder="/dashboard/data"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.target === "specific" && (
                  <div className="space-y-2">
                    <Label>Select Users</Label>
                    <div className="border rounded-md">
                      <div className="p-3 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by email or name..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-40 p-2">
                        {usersLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <p className="text-center py-6 text-sm text-muted-foreground">No users found</p>
                        ) : (
                          <div className="space-y-1">
                            {filteredUsers.map(u => (
                              <div
                                key={u.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                                onClick={() => handleUserToggle(u.id)}
                              >
                                <Checkbox
                                  checked={selectedUserIds.includes(u.id)}
                                  onCheckedChange={() => handleUserToggle(u.id)}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                      <div className="p-2 border-t text-xs text-muted-foreground">
                        {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(error && !dialogOpen) && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No Notifications</CardTitle>
            <CardDescription>Send a notification to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Send First Notification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
              <Badge variant="secondary">{notifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-1.5 rounded-md border ${cfg.color} shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <Badge variant={n.is_read ? "outline" : "secondary"} className="text-xs">
                          {n.is_read ? "Read" : "Unread"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {n.user_id}
                        </span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(n.id)}
                      disabled={deleting === n.id}
                    >
                      {deleting === n.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
