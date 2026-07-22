"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatDateTime } from "@/lib/admin-fetcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RefreshCw, Wrench, Settings2 } from "lucide-react"

interface ServiceStatus {
  id: string
  service_key: string
  service_name: string
  description: string | null
  is_coming_soon: boolean
  coming_soon_message: string | null
  is_enabled: boolean
  is_maintenance: boolean
  maintenance_message: string | null
  updated_at: string
}

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  details: any
  ip_address: string | null
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export default function AdminSettingsPage() {
  const [maintenanceTarget, setMaintenanceTarget] = useState<ServiceStatus | null>(null)
  const [maintenanceMessage, setMaintenanceMessage] = useState("")
  const [saving, setSaving] = useState(false)

  const {
    data: servicesData,
    error: servicesError,
    isLoading: servicesLoading,
    mutate: mutateServices,
  } = useSWR<{ success: boolean; services: ServiceStatus[] }>("/api/admin/service-status", adminFetcher)

  const {
    data: logsData,
    error: logsError,
    isLoading: logsLoading,
    mutate: mutateLogs,
  } = useSWR<{ success: boolean; logs: AuditLog[]; pagination: { total: number } }>(
    "/api/admin/audit-logs?limit=50",
    adminFetcher
  )

  const services = servicesData?.services || []
  const logs = logsData?.logs || []

  const patchService = async (serviceKey: string, patch: Record<string, unknown>, successMsg: string) => {
    try {
      await adminMutate("/api/admin/service-status", "PATCH", { service_key: serviceKey, ...patch })
      toast.success(successMsg)
      mutateServices()
    } catch (err: any) {
      toast.error(err.message || "Failed to update service")
    }
  }

  const openMaintenanceDialog = (service: ServiceStatus) => {
    setMaintenanceTarget(service)
    setMaintenanceMessage(service.maintenance_message || "")
  }

  const handleMaintenanceSave = async () => {
    if (!maintenanceTarget) return
    setSaving(true)
    try {
      await adminMutate("/api/admin/service-status", "PATCH", {
        service_key: maintenanceTarget.service_key,
        is_maintenance: !maintenanceTarget.is_maintenance,
        maintenance_message: maintenanceMessage,
      })
      toast.success(
        maintenanceTarget.is_maintenance ? "Maintenance mode disabled" : "Maintenance mode enabled"
      )
      setMaintenanceTarget(null)
      mutateServices()
    } catch (err: any) {
      toast.error(err.message || "Failed to update maintenance mode")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">System Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Service availability, maintenance mode and audit trail</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            mutateServices()
            mutateLogs()
          }}
          disabled={servicesLoading || logsLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${servicesLoading || logsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="services" className="flex-1 sm:flex-none">
            <Settings2 className="mr-2 h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 sm:flex-none">
            <Wrench className="mr-2 h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Services tab */}
        <TabsContent value="services">
          {servicesError && (
            <Card className="mb-6 border-destructive/50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <p className="text-sm text-destructive">Failed to load services: {servicesError.message}</p>
                <Button variant="outline" size="sm" onClick={() => mutateServices()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {servicesLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          )}

          {!servicesLoading && !servicesError && services.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No services configured yet. Services appear here once the service_status table is populated.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{service.service_name}</CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {service.description || service.service_key}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {service.is_maintenance ? (
                        <Badge variant="destructive">Maintenance</Badge>
                      ) : service.is_enabled ? (
                        <Badge>Live</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                      {service.is_coming_soon && <Badge variant="outline">Coming soon</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`enabled-${service.id}`} className="text-sm">
                      Service enabled
                    </Label>
                    <Switch
                      id={`enabled-${service.id}`}
                      checked={service.is_enabled}
                      onCheckedChange={(checked) =>
                        patchService(
                          service.service_key,
                          { is_enabled: checked },
                          checked ? "Service enabled" : "Service disabled"
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`coming-soon-${service.id}`} className="text-sm">
                      Coming soon mode
                    </Label>
                    <Switch
                      id={`coming-soon-${service.id}`}
                      checked={service.is_coming_soon}
                      onCheckedChange={(checked) =>
                        patchService(
                          service.service_key,
                          { is_coming_soon: checked },
                          checked ? "Coming soon enabled" : "Coming soon disabled"
                        )
                      }
                    />
                  </div>
                  <Button
                    variant={service.is_maintenance ? "destructive" : "outline"}
                    size="sm"
                    className="mt-1 min-h-10 w-full"
                    onClick={() => openMaintenanceDialog(service)}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    {service.is_maintenance ? "End maintenance" : "Start maintenance"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Last updated {formatDateTime(service.updated_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit logs tab */}
        <TabsContent value="audit">
          {logsError && (
            <Card className="mb-6 border-destructive/50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <p className="text-sm text-destructive">Failed to load audit logs: {logsError.message}</p>
                <Button variant="outline" size="sm" onClick={() => mutateLogs()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {logsLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {!logsLoading && !logsError && logs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No audit logs recorded yet</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {log.action}
                      {log.resource_type && (
                        <span className="text-muted-foreground"> · {log.resource_type}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.email || "System"}
                      {log.ip_address && ` · ${log.ip_address}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Maintenance dialog */}
      <Dialog open={!!maintenanceTarget} onOpenChange={(open) => !open && setMaintenanceTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {maintenanceTarget?.is_maintenance ? "End maintenance" : "Start maintenance"}
            </DialogTitle>
            <DialogDescription>{maintenanceTarget?.service_name}</DialogDescription>
          </DialogHeader>
          {maintenanceTarget && !maintenanceTarget.is_maintenance && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="maintenance-message">Maintenance message shown to users</Label>
              <Textarea
                id="maintenance-message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="This service is temporarily unavailable for maintenance..."
                rows={3}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMaintenanceTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={maintenanceTarget?.is_maintenance ? "default" : "destructive"}
              onClick={handleMaintenanceSave}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : maintenanceTarget?.is_maintenance
                  ? "End maintenance"
                  : "Start maintenance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
