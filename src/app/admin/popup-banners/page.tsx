export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Edit, Trash2, RefreshCw, Eye, EyeOff, Calendar, Target, Megaphone, Search, Users } from "lucide-react";

interface PopupBanner {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  target_type: "all" | "specific" | "segment";
  target_user_ids: string[];
  target_segment: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  priority: number;
  show_once_per_session: boolean;
  dismissible: boolean;
  created_at: string;
  updated_at: string;
  dismissals: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export default function PopupBannersPage() {
  const [banners, setBanners] = useState<PopupBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PopupBanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    link_url: "",
    link_text: "",
    target_type: "all" as "all" | "specific" | "segment",
    target_user_ids: "",
    target_segment: "",
    is_active: true,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: "",
    priority: 0,
    show_once_per_session: true,
    dismissible: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/popup-banners");
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      } else {
        setError(data.error || "Failed to fetch banners. The database migration may not have been run yet.");
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      setError("Failed to fetch banners. The database migration may not have been run yet. Please ensure the popup_banners table exists.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      fetchUsers();
    }
  }, [dialogOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        target_user_ids: selectedUserIds,
        end_date: formData.end_date || null,
      };

      const res = await fetch("/api/admin/popup-banners", {
        method: editingBanner ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBanner ? { id: editingBanner.id, updates: payload } : payload),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setEditingBanner(null);
        resetForm();
        await fetchBanners();
      } else {
        setError(data.error || "Failed to save banner");
      }
    } catch (error) {
      console.error("Failed to save banner:", error);
      setError("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/popup-banners?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchBanners();
      } else {
        setError(data.error || "Failed to delete banner");
      }
    } catch (error) {
      console.error("Failed to delete banner:", error);
      setError("Failed to delete banner");
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (banner: PopupBanner) => {
    setEditingBanner(banner);
    const userIds = Array.isArray(banner.target_user_ids) ? banner.target_user_ids : [];
    setFormData({
      title: banner.title,
      content: banner.content,
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      link_text: banner.link_text || "",
      target_type: banner.target_type,
      target_user_ids: userIds.join(", "),
      target_segment: banner.target_segment || "",
      is_active: banner.is_active,
      start_date: new Date(banner.start_date).toISOString().slice(0, 16),
      end_date: banner.end_date ? new Date(banner.end_date).toISOString().slice(0, 16) : "",
      priority: banner.priority,
      show_once_per_session: banner.show_once_per_session,
      dismissible: banner.dismissible,
    });
    setSelectedUserIds(userIds);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      link_url: "",
      link_text: "",
      target_type: "all",
      target_user_ids: "",
      target_segment: "",
      is_active: true,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: "",
      priority: 0,
      show_once_per_session: true,
      dismissible: true,
    });
    setSelectedUserIds([]);
  };

  const handleCreateNew = () => {
    setEditingBanner(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user =>
    userSearch === "" ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.phone?.includes(userSearch)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Popup Banners</h1>
          <p className="text-muted-foreground mt-1">
            Manage promotional banners that appear on user dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBanners} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBanner ? "Edit Banner" : "Create New Banner"}</DialogTitle>
                <DialogDescription>
                  Create a promotional banner that will appear on user dashboards
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Banner title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Banner message content"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/banner-image.jpg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="link_url">Link URL</Label>
                    <Input
                      id="link_url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link_text">Link Text</Label>
                    <Input
                      id="link_text"
                      value={formData.link_text}
                      onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                      placeholder="Learn More"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_type">Target Audience</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: "all" | "specific" | "segment") =>
                      setFormData({ ...formData, target_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                      <SelectItem value="segment">User Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.target_type === "specific" && (
                  <div className="space-y-2">
                    <Label htmlFor="target_user_ids">Select Users</Label>
                    <div className="border rounded-md">
                      <div className="p-3 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users by email, name, or phone..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-48 p-2">
                        {usersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {userSearch ? "No users found" : "No users available"}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                onClick={() => handleUserToggle(user.id)}
                              >
                                <Checkbox
                                  id={`user-${user.id}`}
                                  checked={selectedUserIds.includes(user.id)}
                                  onCheckedChange={() => handleUserToggle(user.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                      <div className="p-2 border-t text-xs text-muted-foreground">
                        {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                      </div>
                    </div>
                  </div>
                )}
                {formData.target_type === "segment" && (
                  <div className="space-y-2">
                    <Label htmlFor="target_segment">Segment Name</Label>
                    <Input
                      id="target_segment"
                      value={formData.target_segment}
                      onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })}
                      placeholder="new_users, active_users, etc."
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (optional)</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (higher shows first)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_once_per_session">Show Once Per Session</Label>
                    <Switch
                      id="show_once_per_session"
                      checked={formData.show_once_per_session}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_once_per_session: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dismissible">Dismissible</Label>
                    <Switch
                      id="dismissible"
                      checked={formData.dismissible}
                      onCheckedChange={(checked) => setFormData({ ...formData, dismissible: checked })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingBanner ? "Update" : "Create"} Banner
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No Banners Found</CardTitle>
            <CardDescription>Create your first popup banner to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.is_active ? "opacity-50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{banner.title}</CardTitle>
                      <CardDescription className="mt-1">{banner.content}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {banner.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        <Eye className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                    <Badge variant="outline">
                      Priority: {banner.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium capitalize">{banner.target_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dismissals</p>
                    <p className="font-medium">{banner.dismissals}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(banner.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{banner.end_date ? new Date(banner.end_date).toLocaleDateString() : "No end"}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    disabled={deleting === banner.id}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                    disabled={deleting === banner.id}
                  >
                    {deleting === banner.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
