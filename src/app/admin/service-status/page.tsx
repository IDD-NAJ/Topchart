"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Wifi,
  Smartphone,
  Shield,
  Globe2,
  Gift,
  Receipt,
  FileText,
  Search,
  RefreshCw,
  Save,
  AlertTriangle,
  Clock,
  Sparkles,
  Check,
  X,
  Wrench,
  Ban,
  Plus,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  id: string;
  service_key: string;
  service_name: string;
  description: string | null;
  is_coming_soon: boolean;
  coming_soon_message: string | null;
  expected_launch_date: string | null;
  is_enabled: boolean;
  is_maintenance: boolean;
  maintenance_message: string | null;
  display_order: number;
  icon_name: string | null;
  updated_at: string;
  maintenance_starts_at?: string | null;
  maintenance_ends_at?: string | null;
  maintenance_auto_resume?: boolean;
}

interface ServiceHealth {
  service_key: string;
  status: "healthy" | "degraded" | "unreachable";
  latencyMs: number | null;
  endpoint: string | null;
}

interface ServiceAudit {
  id: string;
  service_key: string;
  action: string;
  changed_at: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Wifi,
  Smartphone,
  Shield,
  Globe2,
  Gift,
  Receipt,
  FileText,
};

export default function ServiceStatusPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    service: ServiceStatus | null;
    newValue: boolean;
  }>({ open: false, service: null, newValue: false });
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [editingMaintenance, setEditingMaintenance] = useState<string | null>(null);
  const [editedMaintenanceMsg, setEditedMaintenanceMsg] = useState("");
  const [editedMaintenanceStart, setEditedMaintenanceStart] = useState("");
  const [editedMaintenanceEnd, setEditedMaintenanceEnd] = useState("");
  const [editedAutoResume, setEditedAutoResume] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [health, setHealth] = useState<Record<string, ServiceHealth>>({});
  const [audits, setAudits] = useState<ServiceAudit[]>([]);
  const [historyService, setHistoryService] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [newServiceKey, setNewServiceKey] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServiceIcon, setNewServiceIcon] = useState("FileText");

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/service-status?includeAudit=true&includeHealth=true", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        setAudits(data.audits || []);
        const healthMap: Record<string, ServiceHealth> = {};
        for (const item of data.health || []) {
          healthMap[item.service_key] = item;
        }
        setHealth(healthMap);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleToggleComingSoon = (service: ServiceStatus, newValue: boolean) => {
    // Show confirmation dialog
    setConfirmDialog({ open: true, service, newValue });
  };

  const confirmToggle = async () => {
    const { service, newValue } = confirmDialog;
    if (!service) return;

    setSaving(service.service_key);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_key: service.service_key,
          is_coming_soon: newValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_key === service.service_key
              ? { ...s, is_coming_soon: newValue }
              : s
          )
        );
        toast.success(
          `${service.service_name} ${newValue ? "marked as Coming Soon" : "is now active"}`
        );
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      console.error("Failed to toggle:", error);
      toast.error("Failed to update service status");
    } finally {
      setSaving(null);
      setConfirmDialog({ open: false, service: null, newValue: false });
    }
  };

  const handleSaveMessage = async (serviceKey: string) => {
    setSaving(serviceKey);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_key: serviceKey,
          coming_soon_message: editedMessage,
          expected_launch_date: editedDate || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_key === serviceKey
              ? {
                  ...s,
                  coming_soon_message: editedMessage,
                  expected_launch_date: editedDate || null,
                }
              : s
          )
        );
        toast.success("Message updated successfully");
        setEditingMessage(null);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Failed to save message:", error);
      toast.error("Failed to save message");
    } finally {
      setSaving(null);
    }
  };

  const startEditingMessage = (service: ServiceStatus) => {
    setEditingMessage(service.service_key);
    setEditedMessage(service.coming_soon_message || "This service is coming soon. Stay tuned!");
    setEditedDate(service.expected_launch_date || "");
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditedMessage("");
    setEditedDate("");
  };

  const handleToggleEnabled = async (service: ServiceStatus, newValue: boolean) => {
    setSaving(service.service_key);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_key: service.service_key,
          is_enabled: newValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_key === service.service_key
              ? { ...s, is_enabled: newValue }
              : s
          )
        );
        toast.success(
          `${service.service_name} ${newValue ? "enabled" : "disabled"}`
        );
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      console.error("Failed to toggle enabled:", error);
      toast.error("Failed to update service status");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleMaintenance = async (service: ServiceStatus, newValue: boolean) => {
    setSaving(service.service_key);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_key: service.service_key,
          is_maintenance: newValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_key === service.service_key
              ? { ...s, is_maintenance: newValue }
              : s
          )
        );
        toast.success(
          `${service.service_name} ${newValue ? "marked as Under Maintenance" : "maintenance mode off"}`
        );
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      console.error("Failed to toggle maintenance:", error);
      toast.error("Failed to update service status");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveMaintenanceMessage = async (serviceKey: string) => {
    setSaving(serviceKey);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_key: serviceKey,
          maintenance_message: editedMaintenanceMsg,
          maintenance_starts_at: editedMaintenanceStart || null,
          maintenance_ends_at: editedMaintenanceEnd || null,
          maintenance_auto_resume: editedAutoResume,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.service_key === serviceKey
              ? {
                  ...s,
                  maintenance_message: editedMaintenanceMsg,
                  maintenance_starts_at: editedMaintenanceStart || null,
                  maintenance_ends_at: editedMaintenanceEnd || null,
                  maintenance_auto_resume: editedAutoResume,
                }
              : s
          )
        );
        toast.success("Maintenance message updated");
        setEditingMaintenance(null);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Failed to save maintenance message:", error);
      toast.error("Failed to save maintenance message");
    } finally {
      setSaving(null);
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.service_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (iconName: string | null) => {
    if (!iconName) return FileText;
    return ICON_MAP[iconName] || FileText;
  };

  const toggleSelect = (serviceKey: string, checked: boolean) => {
    setSelectedServices((prev) =>
      checked ? Array.from(new Set([...prev, serviceKey])) : prev.filter((s) => s !== serviceKey)
    );
  };

  const handleBulkUpdate = async (payload: { is_enabled?: boolean; is_coming_soon?: boolean; is_maintenance?: boolean }) => {
    if (!selectedServices.length) {
      toast.error("Select at least one service");
      return;
    }
    setBulkSaving(true);
    try {
      const updates = selectedServices.map((service_key) => ({ service_key, ...payload }));
      const res = await fetch("/api/admin/service-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Bulk update failed");
      toast.success(`Updated ${data.updated} service(s)`);
      setSelectedServices([]);
      await fetchServices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleCreateService = async () => {
    if (!newServiceKey.trim() || !newServiceName.trim()) {
      toast.error("Service key and name are required");
      return;
    }
    setCreatingService(true);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_key: newServiceKey,
          service_name: newServiceName,
          description: newServiceDescription,
          icon_name: newServiceIcon,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create service");
      toast.success("Service created");
      setCreateDialogOpen(false);
      setNewServiceKey("");
      setNewServiceName("");
      setNewServiceDescription("");
      setNewServiceIcon("FileText");
      await fetchServices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create service");
    } finally {
      setCreatingService(false);
    }
  };

  const handleDeleteService = async (serviceKey: string) => {
    setSaving(serviceKey);
    try {
      const res = await fetch("/api/admin/service-status", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_key: serviceKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete service");
      toast.success("Service deleted");
      setServices((prev) => prev.filter((s) => s.service_key !== serviceKey));
      setSelectedServices((prev) => prev.filter((s) => s !== serviceKey));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete service");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Status</h1>
          <p className="text-muted-foreground">
            Manage &quot;Coming Soon&quot; status for platform services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchServices} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {selectedServices.length > 0 && (
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">{selectedServices.length} selected</span>
            <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => handleBulkUpdate({ is_enabled: true })}>Enable</Button>
            <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => handleBulkUpdate({ is_enabled: false })}>Disable</Button>
            <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => handleBulkUpdate({ is_coming_soon: true })}>Mark Coming Soon</Button>
            <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => handleBulkUpdate({ is_maintenance: true })}>Mark Maintenance</Button>
            <Button size="sm" variant="ghost" disabled={bulkSaving} onClick={() => setSelectedServices([])}>Clear</Button>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {searchQuery
              ? "No services match your search"
              : "No services configured"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const Icon = getIcon(service.icon_name);
            const isEditing = editingMessage === service.service_key;

            return (
              <Card
                key={service.id}
                className={cn(
                  "transition-all",
                  !service.is_enabled && "border-red-500/50 bg-red-50/30 dark:bg-red-900/10",
                  service.is_enabled && service.is_maintenance && "border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10",
                  service.is_enabled && !service.is_maintenance && service.is_coming_soon && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.service_key)}
                        onChange={(e) => toggleSelect(service.service_key, e.target.checked)}
                        className="h-4 w-4 mt-1"
                      />
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          !service.is_enabled
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : service.is_maintenance
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : service.is_coming_soon
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {service.service_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {service.service_key}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {health[service.service_key] && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                            health[service.service_key].status === "healthy" && "text-emerald-700 bg-emerald-100",
                            health[service.service_key].status === "degraded" && "text-amber-700 bg-amber-100",
                            health[service.service_key].status === "unreachable" && "text-red-700 bg-red-100"
                          )}
                        >
                          {health[service.service_key].status}
                          {health[service.service_key].latencyMs !== null && ` · ${health[service.service_key].latencyMs}ms`}
                        </span>
                      )}
                      {!service.is_enabled && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                          <Ban className="w-3 h-3" />
                          Disabled
                        </span>
                      )}
                      {service.is_maintenance && service.is_enabled && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                          <Wrench className="w-3 h-3" />
                          Maintenance
                        </span>
                      )}
                      {service.is_coming_soon && service.is_enabled && !service.is_maintenance && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`enabled-${service.service_key}`}
                      className="text-sm font-medium"
                    >
                      Enabled
                    </Label>
                    <Switch
                      id={`enabled-${service.service_key}`}
                      checked={service.is_enabled}
                      disabled={saving === service.service_key}
                      onCheckedChange={(checked) =>
                        handleToggleEnabled(service, checked)
                      }
                    />
                  </div>

                  {/* Coming Soon Toggle */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`coming-soon-${service.service_key}`}
                      className="text-sm font-medium"
                    >
                      Coming Soon
                    </Label>
                    <Switch
                      id={`coming-soon-${service.service_key}`}
                      checked={service.is_coming_soon}
                      disabled={saving === service.service_key || !service.is_enabled}
                      onCheckedChange={(checked) =>
                        handleToggleComingSoon(service, checked)
                      }
                    />
                  </div>

                  {/* Maintenance Toggle */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`maintenance-${service.service_key}`}
                      className="text-sm font-medium"
                    >
                      Under Maintenance
                    </Label>
                    <Switch
                      id={`maintenance-${service.service_key}`}
                      checked={service.is_maintenance}
                      disabled={saving === service.service_key || !service.is_enabled}
                      onCheckedChange={(checked) =>
                        handleToggleMaintenance(service, checked)
                      }
                    />
                  </div>

                  {/* Message editing (only when coming soon) */}
                  {service.is_coming_soon && (
                    <div className="space-y-3 pt-2 border-t">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Custom Message</Label>
                            <Textarea
                              value={editedMessage}
                              onChange={(e) => setEditedMessage(e.target.value)}
                              placeholder="Enter a custom message..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Expected Launch Date</Label>
                            <Input
                              type="date"
                              value={editedDate}
                              onChange={(e) => setEditedDate(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Maintenance Start</Label>
                            <Input
                              type="datetime-local"
                              value={editedMaintenanceStart}
                              onChange={(e) => setEditedMaintenanceStart(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Maintenance End</Label>
                            <Input
                              type="datetime-local"
                              value={editedMaintenanceEnd}
                              onChange={(e) => setEditedMaintenanceEnd(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <Label className="text-xs">Auto resume after end</Label>
                            <Switch checked={editedAutoResume} onCheckedChange={setEditedAutoResume} />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveMessage(service.service_key)}
                              disabled={saving === service.service_key}
                            >
                              {saving === service.service_key ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground">
                            <p className="line-clamp-2">
                              {service.coming_soon_message ||
                                "This service is coming soon. Stay tuned!"}
                            </p>
                            {service.expected_launch_date && (
                              <p className="flex items-center gap-1 mt-1 text-xs">
                                <Clock className="w-3 h-3" />
                                Expected:{" "}
                                {new Date(
                                  service.expected_launch_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingMessage(service)}
                          >
                            Edit Message
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Maintenance message editing (only when maintenance) */}
                  {service.is_maintenance && (
                    <div className="space-y-3 pt-2 border-t">
                      {editingMaintenance === service.service_key ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Maintenance Message</Label>
                            <Textarea
                              value={editedMaintenanceMsg}
                              onChange={(e) => setEditedMaintenanceMsg(e.target.value)}
                              placeholder="Enter a maintenance message..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveMaintenanceMessage(service.service_key)}
                              disabled={saving === service.service_key}
                            >
                              {saving === service.service_key ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMaintenance(null)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground">
                            <p className="line-clamp-2">
                              {service.maintenance_message ||
                                "This service is temporarily under maintenance. Please check back shortly."}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMaintenance(service.service_key);
                              setEditedMaintenanceMsg(
                                service.maintenance_message ||
                                  "This service is temporarily under maintenance. Please check back shortly."
                              );
                              setEditedMaintenanceStart(service.maintenance_starts_at ? service.maintenance_starts_at.slice(0, 16) : "");
                              setEditedMaintenanceEnd(service.maintenance_ends_at ? service.maintenance_ends_at.slice(0, 16) : "");
                              setEditedAutoResume(service.maintenance_auto_resume !== false);
                            }}
                          >
                            Edit Message
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => setHistoryService(service.service_key)}>
                      <History className="w-3 h-3 mr-1" />
                      History
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.service_key)} disabled={saving === service.service_key}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  {/* Last updated */}
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Updated: {new Date(service.updated_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, service: null, newValue: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.newValue
                ? `Are you sure you want to mark "${confirmDialog.service?.service_name}" as Coming Soon? Users will not be able to access this service.`
                : `Are you sure you want to activate "${confirmDialog.service?.service_name}"? Users will be able to access this service again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, service: null, newValue: false })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggle}
              variant={confirmDialog.newValue ? "default" : "default"}
              className={
                confirmDialog.newValue
                  ? "bg-amber-600 hover:bg-amber-700"
                  : ""
              }
            >
              {confirmDialog.newValue ? "Mark as Coming Soon" : "Activate Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Service</DialogTitle>
            <DialogDescription>Add a new service to status management.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Service Key</Label>
              <Input value={newServiceKey} onChange={(e) => setNewServiceKey(e.target.value)} placeholder="proxy" />
            </div>
            <div>
              <Label className="text-xs">Service Name</Label>
              <Input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Proxy" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={newServiceDescription} onChange={(e) => setNewServiceDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Icon Name</Label>
              <Input value={newServiceIcon} onChange={(e) => setNewServiceIcon(e.target.value)} placeholder="FileText" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateService} disabled={creatingService}>{creatingService ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyService)} onOpenChange={(open) => !open && setHistoryService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service History</DialogTitle>
            <DialogDescription>{historyService}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-auto space-y-2">
            {audits.filter((a) => a.service_key === historyService).map((audit) => (
              <div key={audit.id} className="rounded border p-2 text-xs">
                <p className="font-medium">{audit.action}</p>
                <p className="text-muted-foreground">{new Date(audit.changed_at).toLocaleString()}</p>
              </div>
            ))}
            {audits.filter((a) => a.service_key === historyService).length === 0 && (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
