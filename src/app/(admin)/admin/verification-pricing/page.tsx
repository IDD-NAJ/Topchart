"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DollarSign, RefreshCw, Pencil, Search, Settings, TrendingUp,
  CheckCircle, XCircle, Globe, MessageCircle, CreditCard, Briefcase, Play, Save,
} from "lucide-react"

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  social_media: { label: "Social Media", icon: MessageCircle, color: "text-blue-600" },
  ecommerce_financial: { label: "E-Commerce & Financial", icon: CreditCard, color: "text-green-600" },
  professional_tools: { label: "Professional Tools", icon: Briefcase, color: "text-purple-600" },
  streaming_entertainment: { label: "Streaming & Entertainment", icon: Play, color: "text-red-600" },
}

interface CategoryDefaults {
  social_media: number
  ecommerce_financial: number
  professional_tools: number
  streaming_entertainment: number
}

interface GlobalSettings {
  exchangeRate: number
  defaultMarkup: number
  minMarkup: number | null
  maxMarkup: number | null
  categoryDefaults: CategoryDefaults
  pvadealsApiKey: string
  updated_at?: string | null
}

interface SettingsResponse {
  success: boolean
  data: GlobalSettings
}

interface Service {
  id: string
  pvadeals_service_id: string
  name: string
  category: string
  picture_url?: string | null
  country?: string | null
  is_active: boolean
  markup_percentage: number | null
  str_price: number
  ltr3_price: number
  ltr7_price: number
  ltr14_price: number
  ltr30_price: number
  purchase_count: number
  total_revenue: number
}

interface ServicesResponse {
  success: boolean
  data: { services: Service[] }
}

const DEFAULT_SETTINGS: GlobalSettings = {
  exchangeRate: 15.5,
  defaultMarkup: 40,
  minMarkup: null,
  maxMarkup: null,
  categoryDefaults: {
    social_media: 40,
    ecommerce_financial: 40,
    professional_tools: 40,
    streaming_entertainment: 40,
  },
  pvadealsApiKey: "",
}

function SettingsPanel() {
  const { data, error, isLoading, mutate } = useSWR<SettingsResponse>(
    "/api/admin/verification/settings",
    adminFetcher
  )
  const [form, setForm] = useState<GlobalSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [applyToExisting, setApplyToExisting] = useState(false)

  const settings = data?.data ?? DEFAULT_SETTINGS

  React.useEffect(() => {
    if (data?.data && !form) {
      setForm(data.data)
    }
  }, [data, form])

  const current = form ?? settings

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await adminMutate("/api/admin/verification/settings", "PUT", {
        ...form,
        applyToExisting,
      })
      if (res.success) {
        toast.success(res.message || "Settings saved")
        mutate()
      } else {
        toast.error(res.error || "Failed to save settings")
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: keyof GlobalSettings, value: unknown) => {
    setForm((f) => ({ ...(f ?? settings), [key]: value }))
  }

  const updateCategory = (cat: keyof CategoryDefaults, value: number) => {
    setForm((f) => ({
      ...(f ?? settings),
      categoryDefaults: { ...(f ?? settings).categoryDefaults, [cat]: value },
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Exchange Rate &amp; Default Markup</CardTitle>
          <CardDescription>Global settings that apply to all verification services unless overridden per category.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Exchange Rate (USD &rarr; GHS)</Label>
            <Input
              type="number"
              step="0.01"
              value={current.exchangeRate}
              onChange={(e) => updateField("exchangeRate", parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Used to convert USD provider prices to GHS</p>
          </div>
          <div className="space-y-1.5">
            <Label>Default Markup (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={current.defaultMarkup}
              onChange={(e) => updateField("defaultMarkup", parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Applied when no category override is set</p>
          </div>
          <div className="space-y-1.5">
            <Label>PVADeals API Key</Label>
            <Input
              type="password"
              value={current.pvadealsApiKey}
              onChange={(e) => updateField("pvadealsApiKey", e.target.value)}
              placeholder="pk_live_..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Min Markup Guard (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={current.minMarkup ?? ""}
              onChange={(e) => updateField("minMarkup", e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="No minimum"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max Markup Guard (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={current.maxMarkup ?? ""}
              onChange={(e) => updateField("maxMarkup", e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="No maximum"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Category Markup Defaults (%)</CardTitle>
          <CardDescription>Set per-category markup overrides applied when syncing services.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon, color }]) => (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={current.categoryDefaults[key as keyof CategoryDefaults]}
                  onChange={(e) => updateCategory(key as keyof CategoryDefaults, parseFloat(e.target.value) || 0)}
                  className="max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">Apply to existing services</p>
          <p className="text-xs text-muted-foreground">Updates markup_percentage on all verification_services records</p>
        </div>
        <Switch checked={applyToExisting} onCheckedChange={setApplyToExisting} />
      </div>

      <div className="flex items-center justify-between">
        {data?.data?.updated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(data.data.updated_at).toLocaleString("en-GB")}
          </p>
        )}
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}

function ServicesPanel() {
  const { data, error, isLoading, mutate } = useSWR<ServicesResponse>(
    "/api/admin/verification/services",
    adminFetcher
  )
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editService, setEditService] = useState<Service | null>(null)
  const [editMarkup, setEditMarkup] = useState("")
  const [editStrPrice, setEditStrPrice] = useState("")
  const [editLtr3, setEditLtr3] = useState("")
  const [editLtr7, setEditLtr7] = useState("")
  const [editLtr14, setEditLtr14] = useState("")
  const [editLtr30, setEditLtr30] = useState("")
  const [saving, setSaving] = useState(false)

  const services = data?.data?.services ?? []

  const filtered = services.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === "all" || s.category === categoryFilter
    return matchSearch && matchCat
  })

  const openEdit = (svc: Service) => {
    setEditService(svc)
    setEditMarkup(String(svc.markup_percentage ?? ""))
    setEditStrPrice(String(svc.str_price ?? ""))
    setEditLtr3(String(svc.ltr3_price ?? ""))
    setEditLtr7(String(svc.ltr7_price ?? ""))
    setEditLtr14(String(svc.ltr14_price ?? ""))
    setEditLtr30(String(svc.ltr30_price ?? ""))
  }

  const handleSave = async () => {
    if (!editService) return
    setSaving(true)
    try {
      const res = await adminMutate("/api/admin/verification/services", "PATCH", {
        id: editService.id,
        markup_percentage: editMarkup !== "" ? parseFloat(editMarkup) : null,
        str_price: parseFloat(editStrPrice) || 0,
        ltr3_price: parseFloat(editLtr3) || 0,
        ltr7_price: parseFloat(editLtr7) || 0,
        ltr14_price: parseFloat(editLtr14) || 0,
        ltr30_price: parseFloat(editLtr30) || 0,
      })
      if (res.success) {
        toast.success("Service pricing updated")
        setEditService(null)
        mutate()
      } else {
        toast.error(res.error || "Failed to update")
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={DollarSign} title="Failed to load services" description={error.message} />
  }

  return (
    <>
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} service{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {filtered.length === 0 ? (
          <EmptyState icon={DollarSign} title="No services found" description="Sync services from the PVADeals API first." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">STR Price</TableHead>
                  <TableHead className="text-right">LTR 3d</TableHead>
                  <TableHead className="text-right">LTR 7d</TableHead>
                  <TableHead className="text-right">LTR 30d</TableHead>
                  <TableHead className="text-right">Markup %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((svc) => {
                  const cat = CATEGORY_LABELS[svc.category]
                  const Icon = cat?.icon ?? Globe
                  return (
                    <TableRow key={svc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {svc.picture_url ? (
                            <img src={svc.picture_url} alt={svc.name} className="h-6 w-6 rounded object-contain bg-muted p-0.5" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {svc.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-sm">{svc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 text-xs ${cat?.color ?? ""}`}>
                          <Icon className="h-3 w-3" />
                          {cat?.label ?? svc.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        GH&#8373;{Number(svc.str_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        GH&#8373;{Number(svc.ltr3_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        GH&#8373;{Number(svc.ltr7_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        GH&#8373;{Number(svc.ltr30_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {svc.markup_percentage !== null ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {Number(svc.markup_percentage).toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {svc.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="h-3 w-3" />Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(svc)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      <Dialog open={!!editService} onOpenChange={(o) => !o && setEditService(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Service Pricing</DialogTitle>
            <DialogDescription>{editService?.name} — {CATEGORY_LABELS[editService?.category ?? ""]?.label}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Markup % Override</Label>
              <Input
                type="number"
                step="0.1"
                value={editMarkup}
                onChange={(e) => setEditMarkup(e.target.value)}
                placeholder="Use global default"
              />
            </div>
            <div className="space-y-1.5">
              <Label>STR Price (GHS)</Label>
              <Input type="number" step="0.01" value={editStrPrice} onChange={(e) => setEditStrPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LTR 3-Day Price (GHS)</Label>
              <Input type="number" step="0.01" value={editLtr3} onChange={(e) => setEditLtr3(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LTR 7-Day Price (GHS)</Label>
              <Input type="number" step="0.01" value={editLtr7} onChange={(e) => setEditLtr7(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LTR 14-Day Price (GHS)</Label>
              <Input type="number" step="0.01" value={editLtr14} onChange={(e) => setEditLtr14(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LTR 30-Day Price (GHS)</Label>
              <Input type="number" step="0.01" value={editLtr30} onChange={(e) => setEditLtr30(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditService(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AdminVerificationPricingPage() {
  const { data: settingsData } = useSWR<SettingsResponse>("/api/admin/verification/settings", adminFetcher)
  const { data: servicesData } = useSWR<ServicesResponse>("/api/admin/verification/services", adminFetcher)

  const services = servicesData?.data?.services ?? []
  const activeCount = services.filter((s) => s.is_active).length
  const avgMarkup =
    services.filter((s) => s.markup_percentage !== null).length > 0
      ? services
          .filter((s) => s.markup_percentage !== null)
          .reduce((sum, s) => sum + Number(s.markup_percentage), 0) /
        services.filter((s) => s.markup_percentage !== null).length
      : null

  return (
    <AdminPageShell
      title="Verification Pricing"
      description="Manage pricing, markup rates, and exchange rate for foreign verification numbers."
      icon={DollarSign}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Exchange Rate"
          value={`$1 = GH&#8373;${Number(settingsData?.data?.exchangeRate ?? 15.5).toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Default Markup"
          value={`${Number(settingsData?.data?.defaultMarkup ?? 40).toFixed(1)}%`}
          icon={DollarSign}
          accent
        />
        <StatCard label="Total Services" value={services.length} icon={Globe} />
        <StatCard label="Active Services" value={activeCount} icon={CheckCircle} />
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="services">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Service Prices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <SettingsPanel />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicesPanel />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  )
}
