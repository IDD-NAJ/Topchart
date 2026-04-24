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
  display_order: number;
  icon_name: string | null;
  updated_at: string;
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

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/service-status");
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
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

  const filteredServices = services.filter(
    (s) =>
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.service_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (iconName: string | null) => {
    if (!iconName) return FileText;
    return ICON_MAP[iconName] || FileText;
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
        <Button
          variant="outline"
          size="sm"
          onClick={fetchServices}
          disabled={loading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
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
                  service.is_coming_soon && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          service.is_coming_soon
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
                    {service.is_coming_soon && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Coming Soon
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Toggle */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`toggle-${service.service_key}`}
                      className="text-sm font-medium"
                    >
                      Mark as Coming Soon
                    </Label>
                    <Switch
                      id={`toggle-${service.service_key}`}
                      checked={service.is_coming_soon}
                      disabled={saving === service.service_key}
                      onCheckedChange={(checked) =>
                        handleToggleComingSoon(service, checked)
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
    </div>
  );
}
