"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/networks"
import { 
  Loader2, ArrowLeft, Save, Percent, Search, CheckSquare, Square, 
  Settings, DollarSign, TrendingUp, Filter, ChevronDown, RefreshCw,
  Download, Wallet, AlertTriangle, RotateCcw, ShoppingBag, Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const DEFAULT_USD_TO_GHS = parseFloat(process.env.NEXT_PUBLIC_USD_TO_GHS_RATE ?? "15.5")
const DEFAULT_MARKUP = 40

interface Service {
  id: string
  pvadeals_service_id: string
  name: string
  category: string
  picture_url?: string
  country?: string
  is_active: boolean
  markup_percentage: number
  str_price: number
  ltr3_price: number
  ltr7_price: number
  ltr14_price: number
  ltr30_price: number
  purchase_count?: number
  total_revenue?: number
  updated_at?: string
  created_at?: string
}

const CATEGORIES = [
  { id: "social_media", name: "Social Media" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial" },
  { id: "professional_tools", name: "Professional Tools" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment" },
]

function previewGhs(usdPrice: number, markup: number, exchangeRate: number) {
  return formatCurrency(usdPrice * exchangeRate * (1 + markup / 100))
}

function calcProfit(usdPrice: number, markup: number, exchangeRate: number) {
  const base = usdPrice * exchangeRate
  return formatCurrency(base * (markup / 100))
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "Never"
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function AdminVerificationPricingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [edits, setEdits] = useState<Record<string, { markup_percentage?: number; is_active?: boolean }>>({})

  const [exchangeRate, setExchangeRate] = useState(DEFAULT_USD_TO_GHS)
  const [defaultMarkup, setDefaultMarkup] = useState(DEFAULT_MARKUP)
  const [minMarkup, setMinMarkup] = useState<number | "">("")
  const [maxMarkup, setMaxMarkup] = useState<number | "">("")
  const [showSettings, setShowSettings] = useState(false)
  const [pvaBalance, setPvaBalance] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all")

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [currentTab, setCurrentTab] = useState("social_media")
  const [categoryDefaults, setCategoryDefaults] = useState<Record<string, number>>({
    social_media: DEFAULT_MARKUP,
    ecommerce_financial: DEFAULT_MARKUP,
    professional_tools: DEFAULT_MARKUP,
    streaming_entertainment: DEFAULT_MARKUP,
  })

  const [pvadealsApiKey, setPvadealsApiKey] = useState("")
  const [settingsLastSaved, setSettingsLastSaved] = useState<{ at: string | null; by: string | null }>({ at: null, by: null })
  const [settingsErrors, setSettingsErrors] = useState<string[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [applyToExistingOnSave, setApplyToExistingOnSave] = useState(false)
  const [bulkCustomMarkup, setBulkCustomMarkup] = useState<number | "">("")

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/verification/services")
      const data = await res.json()
      if (data.success) setServices(data.data.services)
      else toast.error(data.error || "Failed to load services")
    } catch { toast.error("Failed to load services") }
    finally { setLoading(false) }
  }

  const fetchGlobalSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch("/api/admin/verification/settings")
      const data = await res.json()
      if (data.success) {
        setExchangeRate(data.data.exchangeRate)
        setDefaultMarkup(data.data.defaultMarkup)
        setMinMarkup(data.data.minMarkup ?? "")
        setMaxMarkup(data.data.maxMarkup ?? "")
        setPvadealsApiKey(data.data.pvadealsApiKey ?? "")
        setSettingsLastSaved({ at: data.data.updated_at ?? null, by: data.data.updated_by ?? null })
        if (data.data.categoryDefaults && Object.keys(data.data.categoryDefaults).length > 0) {
          setCategoryDefaults(prev => ({ ...prev, ...data.data.categoryDefaults }))
        }
      }
    } catch { /* ignore */ }
    finally { setSettingsLoading(false) }
  }

  const fetchPvaBalance = async () => {
    try {
      const res = await fetch("/api/admin/verification/sync")
      const data = await res.json()
      if (data.success) setPvaBalance(data.data.pvadeals_balance)
    } catch { /* ignore */ }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/verification/sync", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(data.data.message || "Services synced")
        fetchServices()
        fetchPvaBalance()
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch { toast.error("Sync request failed") }
    finally { setSyncing(false) }
  }

  const handleSaveGlobalSettings = async (applyToExistingOverride?: boolean) => {
    const errors = validateSettings()
    setSettingsErrors(errors)
    if (errors.length > 0) {
      toast.error(`${errors.length} validation error${errors.length > 1 ? "s" : ""} — fix before saving`)
      return
    }
    setSettingsSaving(true)
    try {
      const applyToExisting = applyToExistingOverride ?? applyToExistingOnSave
      const res = await fetch("/api/admin/verification/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchangeRate,
          defaultMarkup,
          categoryDefaults,
          minMarkup: minMarkup === "" ? null : Number(minMarkup),
          maxMarkup: maxMarkup === "" ? null : Number(maxMarkup),
          pvadealsApiKey: pvadealsApiKey || null,
          applyToExisting,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const affectedServices = Number(data?.data?.affectedServices ?? 0)
        toast.success(
          applyToExisting
            ? `Settings saved and applied to ${affectedServices} services`
            : "Global settings saved"
        )
        await fetchGlobalSettings()
        if (applyToExisting) {
          await fetchServices()
        }
      }
      else toast.error(data.error || "Failed to save settings")
    } catch { toast.error("Failed to save settings") }
    finally { setSettingsSaving(false) }
  }

  const handleExportCSV = () => {
    const header = ["Name", "Category", "Active", "Markup%", "STR USD", "LTR3 USD", "LTR7 USD", "LTR14 USD", "LTR30 USD", "STR GHS", "LTR3 GHS", "LTR30 GHS", "Purchases 30d"].join(",")
    const rows = services.map(s => {
      const m = edits[s.id]?.markup_percentage ?? s.markup_percentage
      return [
        `"${s.name}"`,
        s.category,
        s.is_active ? "Yes" : "No",
        m,
        s.str_price, s.ltr3_price, s.ltr7_price, s.ltr14_price, s.ltr30_price,
        Number(s.str_price * exchangeRate * (1 + m / 100)).toFixed(2),
        Number(s.ltr3_price * exchangeRate * (1 + m / 100)).toFixed(2),
        Number(s.ltr30_price * exchangeRate * (1 + m / 100)).toFixed(2),
        s.purchase_count ?? 0,
      ].join(",")
    })
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `verification-pricing-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  const isOutOfRange = (markup: number) => {
    if (minMarkup !== "" && markup < Number(minMarkup)) return "low"
    if (maxMarkup !== "" && markup > Number(maxMarkup)) return "high"
    return null
  }

  const validateSettings = (): string[] => {
    const errors: string[] = []
    if (!exchangeRate || exchangeRate <= 0) errors.push("Exchange rate must be a positive number")
    if (defaultMarkup < 0) errors.push("Default markup cannot be negative")
    if (minMarkup !== "" && Number(minMarkup) < 0) errors.push("Min markup cannot be negative")
    if (maxMarkup !== "" && Number(maxMarkup) < 0) errors.push("Max markup cannot be negative")
    if (minMarkup !== "" && maxMarkup !== "" && Number(minMarkup) > Number(maxMarkup)) errors.push("Min markup cannot exceed max markup")
    if (minMarkup !== "" && defaultMarkup < Number(minMarkup)) errors.push("Default markup is below min guard")
    if (maxMarkup !== "" && defaultMarkup > Number(maxMarkup)) errors.push("Default markup exceeds max guard")
    for (const cat of CATEGORIES) {
      const val = categoryDefaults[cat.id]
      if (val < 0) errors.push(`${cat.name} markup cannot be negative`)
      if (minMarkup !== "" && val < Number(minMarkup)) errors.push(`${cat.name} markup is below min guard`)
      if (maxMarkup !== "" && val > Number(maxMarkup)) errors.push(`${cat.name} markup exceeds max guard`)
    }
    return errors
  }

  const handleResetDefaults = () => {
    setExchangeRate(DEFAULT_USD_TO_GHS)
    setDefaultMarkup(DEFAULT_MARKUP)
    setMinMarkup("")
    setMaxMarkup("")
    setPvadealsApiKey("")
    setCategoryDefaults({
      social_media: DEFAULT_MARKUP,
      ecommerce_financial: DEFAULT_MARKUP,
      professional_tools: DEFAULT_MARKUP,
      streaming_entertainment: DEFAULT_MARKUP,
    })
    setSettingsErrors([])
    toast.info("Settings reset to defaults (not saved yet)")
  }

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.pvadeals_service_id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = activeFilter === "all" ? true :
                          activeFilter === "active" ? s.is_active : !s.is_active
      return matchesSearch && matchesFilter
    })
  }, [services, searchQuery, activeFilter])

  const isSearching = searchQuery.trim().length > 0

  const currentTabServices = useMemo(() => {
    if (isSearching) return filteredServices
    return filteredServices.filter(s => s.category === currentTab)
  }, [filteredServices, currentTab, isSearching])

  const selectedInCurrentTab = useMemo(() => {
    return currentTabServices.filter(s => selectedServices.has(s.id)).map(s => s.id)
  }, [currentTabServices, selectedServices])

  const setServiceEdit = (id: string, field: string, value: any) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const handleSave = async (serviceId: string) => {
    const edit = edits[serviceId]
    if (!edit) return
    setSaving(serviceId)
    try {
      const res = await fetch("/api/admin/verification/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          markupPercentage: edit.markup_percentage,
          isActive: edit.is_active,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Saved")
        setEdits(prev => { const u = { ...prev }; delete u[serviceId]; return u })
        fetchServices()
      } else { toast.error(data.error || "Failed to save") }
    } catch { toast.error("Save failed") }
    finally { setSaving(null) }
  }

  const handleBulkUpdate = async (markupPercentage?: number, isActive?: boolean) => {
    const ids = selectedInCurrentTab
    if (ids.length === 0) {
      toast.error("No services selected")
      return
    }
    setBulkSaving(true)
    try {
      const res = await fetch("/api/admin/verification/services/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: ids, markupPercentage, isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Updated ${ids.length} services`)
        setSelectedServices(new Set())
        fetchServices()
      } else { toast.error(data.error || "Bulk update failed") }
    } catch { toast.error("Bulk update failed") }
    finally { setBulkSaving(false) }
  }

  const handleApplyToCategory = async (category: string) => {
    setBulkSaving(true)
    try {
      const persistSettingsRes = await fetch("/api/admin/verification/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryDefaults }),
      })
      const persistSettingsData = await persistSettingsRes.json()
      if (!persistSettingsData.success) {
        toast.error(persistSettingsData.error || "Failed to save category defaults")
        return
      }

      const res = await fetch("/api/admin/verification/services/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category, 
          markupPercentage: categoryDefaults[category] 
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Applied ${categoryDefaults[category]}% to all ${category}`)
        await fetchGlobalSettings()
        await fetchServices()
      } else { toast.error(data.error || "Failed to apply to category") }
    } catch { toast.error("Failed to apply to category") }
    finally { setBulkSaving(false) }
  }

  const toggleSelectAll = () => {
    const allSelected = currentTabServices.every(s => selectedServices.has(s.id))
    const newSelected = new Set(selectedServices)
    if (allSelected) {
      currentTabServices.forEach(s => newSelected.delete(s.id))
    } else {
      currentTabServices.forEach(s => newSelected.add(s.id))
    }
    setSelectedServices(newSelected)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedServices(newSelected)
  }

  useEffect(() => { fetchServices(); fetchGlobalSettings(); fetchPvaBalance() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/verification">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Pricing Settings</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap text-sm">
              {services.length} services
              <span>·</span>
              <span className="text-green-600">{services.filter(s => s.is_active).length} active</span>
              {services.length > 0 && (
                <>
                  <span>·</span>
                  <span>Avg {Math.round(services.reduce((a, s) => a + s.markup_percentage, 0) / services.length)}% markup</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pvaBalance !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm ${pvaBalance < 5 ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-border bg-muted/40"}`}>
              <Wallet className="h-3.5 w-3.5" />
              <span className="font-medium">${Number(pvaBalance).toFixed(2)}</span>
              {pvaBalance < 5 && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={services.length === 0}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Services
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            {showSettings ? "Hide" : "Show"} Global Settings
          </Button>
        </div>
      </div>

      {/* ── Global Settings ── */}
      {showSettings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Global Pricing Settings</h3>
                {settingsLastSaved.at && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    Saved {relativeTime(settingsLastSaved.at)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={handleResetDefaults} disabled={settingsSaving || settingsLoading}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset Defaults
                </Button>
                <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                  <Checkbox
                    checked={applyToExistingOnSave}
                    onCheckedChange={(checked) => setApplyToExistingOnSave(Boolean(checked))}
                    disabled={settingsSaving || settingsLoading}
                  />
                  Apply to existing
                </label>
                {applyToExistingOnSave && services.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{services.length} services affected</Badge>
                )}
                <Button size="sm" onClick={() => handleSaveGlobalSettings()} disabled={settingsSaving || settingsLoading}>
                  {settingsSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </div>

            {settingsErrors.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-xs font-semibold text-destructive mb-1">Validation Errors</p>
                <ul className="text-xs text-destructive/80 space-y-0.5">
                  {settingsErrors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-5">
              <div>
                <Label className="flex items-center gap-1 text-xs mb-1"><DollarSign className="h-3 w-3" />USD → GHS Rate</Label>
                <Input type="number" step="0.1" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || DEFAULT_USD_TO_GHS)} className={`h-8 ${(!exchangeRate || exchangeRate <= 0) ? "border-destructive" : ""}`} />
                <p className="text-xs text-muted-foreground mt-0.5">Current rate for price calculations</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 text-xs mb-1"><Percent className="h-3 w-3" />Default Markup %</Label>
                <Input type="number" step="1" min="0" value={defaultMarkup} onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || DEFAULT_MARKUP)} className={`h-8 ${(minMarkup !== "" && defaultMarkup < Number(minMarkup)) || (maxMarkup !== "" && defaultMarkup > Number(maxMarkup)) ? "border-yellow-400" : ""}`} />
                <p className="text-xs text-muted-foreground mt-0.5">Applied to new synced services</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 text-xs mb-1"><TrendingUp className="h-3 w-3" />Min Markup % (guard)</Label>
                <Input type="number" step="1" min="0" placeholder="No min" value={minMarkup} onChange={(e) => setMinMarkup(e.target.value === "" ? "" : parseFloat(e.target.value))} className={`h-8 ${minMarkup !== "" && maxMarkup !== "" && Number(minMarkup) > Number(maxMarkup) ? "border-destructive" : ""}`} />
                <p className="text-xs text-muted-foreground mt-0.5">Cards below this show a warning</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 text-xs mb-1"><TrendingUp className="h-3 w-3" />Max Markup % (guard)</Label>
                <Input type="number" step="1" min="0" placeholder="No max" value={maxMarkup} onChange={(e) => setMaxMarkup(e.target.value === "" ? "" : parseFloat(e.target.value))} className={`h-8 ${minMarkup !== "" && maxMarkup !== "" && Number(minMarkup) > Number(maxMarkup) ? "border-destructive" : ""}`} />
                <p className="text-xs text-muted-foreground mt-0.5">Cards above this show a warning</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 text-xs mb-1"><Settings className="h-3 w-3" />PVA Deals API Key</Label>
                <Input type="password" placeholder="Enter API key" value={pvadealsApiKey} onChange={(e) => setPvadealsApiKey(e.target.value)} className="h-8" />
                <p className="text-xs text-muted-foreground mt-0.5">{pvadealsApiKey ? "Key stored • " : ""}Used for service sync</p>
              </div>
            </div>

            <div className="border-t border-primary/10 pt-4 mb-5">
              <p className="text-xs font-medium mb-3 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Category Defaults</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CATEGORIES.map(cat => {
                  const catOutOfRange = (minMarkup !== "" && categoryDefaults[cat.id] < Number(minMarkup)) || (maxMarkup !== "" && categoryDefaults[cat.id] > Number(maxMarkup))
                  return (
                    <div key={cat.id}>
                      <Label className="text-xs mb-1 block">{cat.name}</Label>
                      <div className="flex gap-2">
                        <Input type="number" step="1" min="0" value={categoryDefaults[cat.id]} onChange={(e) => setCategoryDefaults(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) || 0 }))} className={`h-8 ${catOutOfRange ? "border-yellow-400" : ""}`} />
                        <Button size="sm" className="h-8 px-2 shrink-0" onClick={() => handleApplyToCategory(cat.id)} disabled={bulkSaving}>
                          {bulkSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      {catOutOfRange && <p className="text-[10px] text-yellow-600 mt-0.5">Outside min/max guard</p>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-primary/10 pt-4 mb-4">
              <p className="text-xs font-medium mb-3 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Sample Price Preview (default markup)</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[{ label: "STR", usd: 0.50 }, { label: "LTR3", usd: 1.50 }, { label: "LTR7", usd: 3.00 }, { label: "LTR14", usd: 5.00 }, { label: "LTR30", usd: 10.00 }].map(p => (
                  <div key={p.label} className="bg-background rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                    <p className="text-base font-semibold">{previewGhs(p.usd, defaultMarkup, exchangeRate)}</p>
                    <p className="text-[10px] text-muted-foreground">${p.usd} USD</p>
                    <p className="text-[10px] text-green-600">+{calcProfit(p.usd, defaultMarkup, exchangeRate)}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Rate {exchangeRate} · Markup {defaultMarkup}%</p>
            </div>

            <div className="border-t border-primary/10 pt-4">
              <p className="text-xs font-medium mb-3 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Category STR Comparison</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className="bg-background rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
                    <p className="text-base font-semibold">{previewGhs(0.50, categoryDefaults[cat.id], exchangeRate)}</p>
                    <p className="text-xs text-muted-foreground">{categoryDefaults[cat.id]}% markup</p>
                    <p className="text-xs text-green-600">+{calcProfit(0.50, categoryDefaults[cat.id], exchangeRate)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search + Filter Bar ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all categories…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="all">All Services</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <Badge variant="secondary">{filteredServices.length} services</Badge>
            {isSearching && (
              <Badge variant="outline" className="text-primary">
                Showing across all categories
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Category Tabs ── */}
      <Tabs value={isSearching ? "search" : currentTab} onValueChange={(v) => { if (v !== "search") { setCurrentTab(v); setSearchQuery("") } }}>
        {!isSearching && (
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-1">
            {CATEGORIES.map((cat) => {
              const catServices = services.filter(s => s.category === cat.id)
              const activeCount = catServices.filter(s => s.is_active).length
              const matchCount = filteredServices.filter(s => s.category === cat.id).length
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                  <span className="truncate">{cat.name}</span>
                  <Badge variant={currentTab === cat.id ? "default" : "secondary"} className="ml-1.5 text-[10px] h-4 px-1">
                    {activeFilter === "all" ? catServices.length : matchCount}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        )}

        {(isSearching ? ["search"] : CATEGORIES.map(c => c.id)).map((tabId) => {
          const cat = CATEGORIES.find(c => c.id === tabId)
          const tabServices = isSearching
            ? filteredServices
            : filteredServices.filter(s => s.category === tabId)
          const activeCount = tabServices.filter(s => s.is_active).length
          const avgMarkup = tabServices.length > 0
            ? Math.round(tabServices.reduce((a, s) => a + s.markup_percentage, 0) / tabServices.length)
            : 0
          const selectedInTab = tabServices.filter(s => selectedServices.has(s.id)).map(s => s.id)

          return (
            <TabsContent key={tabId} value={isSearching ? "search" : tabId} className="mt-4 space-y-3">

              {/* Category stats + quick actions bar */}
              {tabServices.length > 0 && (
                <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-muted/40 rounded-lg border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{tabServices.length} services</span>
                    <span className="text-green-600">{activeCount} active</span>
                    <span>Avg markup: <strong>{avgMarkup}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isSearching && cat && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={bulkSaving}
                          onClick={() => fetch("/api/admin/verification/services/bulk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: tabId, isActive: true }) }).then(() => { toast.success("All activated"); fetchServices() })}>
                          Activate All
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={bulkSaving}
                          onClick={() => fetch("/api/admin/verification/services/bulk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: tabId, isActive: false }) }).then(() => { toast.success("All deactivated"); fetchServices() })}>
                          Deactivate All
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => {
                      const allSel = tabServices.every(s => selectedServices.has(s.id))
                      const next = new Set(selectedServices)
                      tabServices.forEach(s => allSel ? next.delete(s.id) : next.add(s.id))
                      setSelectedServices(next)
                    }}>
                      {tabServices.every(s => selectedServices.has(s.id))
                        ? <><CheckSquare className="h-3.5 w-3.5" />Deselect All</>
                        : <><Square className="h-3.5 w-3.5" />Select All</>}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk actions toolbar */}
              {selectedInTab.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap p-2 bg-primary/5 border border-primary/20 rounded-lg">
                  <Badge variant="default" className="shrink-0">{selectedInTab.length} selected</Badge>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      placeholder="Custom %"
                      value={bulkCustomMarkup}
                      onChange={(e) => setBulkCustomMarkup(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="h-7 w-24 text-xs"
                    />
                    <Button size="sm" className="h-7 text-xs px-2" disabled={bulkCustomMarkup === "" || bulkSaving}
                      onClick={() => handleBulkUpdate(Number(bulkCustomMarkup))}>
                      Apply %
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={bulkSaving}>
                        {bulkSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Presets <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {[20, 30, 40, 50, 60].map(pct => (
                        <DropdownMenuItem key={pct} onClick={() => handleBulkUpdate(pct)}>Set {pct}%</DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkUpdate(defaultMarkup)}>
                        Reset to default ({defaultMarkup}%)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkUpdate(undefined, true)}>Activate selected</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate(undefined, false)}>Deactivate selected</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Service cards */}
              <div className="grid gap-3">
                {tabServices.map((svc) => {
                  const markup = edits[svc.id]?.markup_percentage ?? svc.markup_percentage
                  const isActive = edits[svc.id]?.is_active ?? svc.is_active
                  const isDirty = !!edits[svc.id]
                  const isSaving = saving === svc.id
                  const isSelected = selectedServices.has(svc.id)
                  const outOfRange = isOutOfRange(markup)

                  return (
                    <Card key={svc.id} className={[
                      isDirty ? "border-primary" : "",
                      outOfRange === "low" ? "border-yellow-400" : "",
                      outOfRange === "high" ? "border-orange-400" : "",
                      !isActive ? "opacity-60" : "",
                    ].filter(Boolean).join(" ")}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="pt-1 shrink-0">
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(svc.id)} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">

                            {/* Top row: icon + name + badges + controls */}
                            <div className="flex items-start gap-3 justify-between flex-wrap">
                              <div className="flex items-center gap-3 min-w-0">
                                {svc.picture_url && (
                                  <img src={svc.picture_url} alt={svc.name} className="h-10 w-10 rounded object-contain bg-muted p-0.5 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm">{svc.name}</p>
                                    <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] h-5">
                                      {isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {outOfRange && (
                                      <Badge variant="outline" className="text-[10px] h-5 border-yellow-400 text-yellow-600">
                                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                        markup {outOfRange === "low" ? "too low" : "too high"}
                                      </Badge>
                                    )}
                                    {(svc.purchase_count ?? 0) > 0 && (
                                      <Badge variant="secondary" className="text-[10px] h-5 gap-0.5">
                                        <ShoppingBag className="h-2.5 w-2.5" />{svc.purchase_count} sales
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <span>{svc.country ?? "US"}</span>
                                    <span>·</span>
                                    <span>ID: {svc.pvadeals_service_id.slice(0, 8)}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{relativeTime(svc.updated_at)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs text-muted-foreground shrink-0">Markup %</Label>
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={markup}
                                    onChange={(e) => setServiceEdit(svc.id, "markup_percentage", parseFloat(e.target.value))}
                                    className="h-8 w-20 text-sm"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="Reset to default"
                                    onClick={() => setServiceEdit(svc.id, "markup_percentage", defaultMarkup)}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex flex-col items-center gap-0.5">
                                  <Label className="text-xs text-muted-foreground">Active</Label>
                                  <Switch
                                    checked={isActive}
                                    onCheckedChange={(v) => setServiceEdit(svc.id, "is_active", v)}
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(svc.id)}
                                  disabled={!isDirty || isSaving}
                                  className="h-8"
                                >
                                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1" />Save</>}
                                </Button>
                              </div>
                            </div>

                            {/* Price table — always visible */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                              {[
                                { label: "STR", usd: svc.str_price },
                                { label: "LTR3", usd: svc.ltr3_price },
                                { label: "LTR7", usd: svc.ltr7_price },
                                { label: "LTR14", usd: svc.ltr14_price },
                                { label: "LTR30", usd: svc.ltr30_price },
                              ].map(p => (
                                <div key={p.label} className="p-2 bg-muted/60 rounded-md">
                                  <p className="text-muted-foreground font-medium">{p.label}</p>
                                  <p className="font-semibold text-sm mt-0.5">{previewGhs(p.usd, markup, exchangeRate)}</p>
                                  <p className="text-[10px] text-muted-foreground">${p.usd} USD</p>
                                  <p className="text-[10px] text-green-600">+{calcProfit(p.usd, markup, exchangeRate)}</p>
                                </div>
                              ))}
                            </div>

                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {tabServices.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-10 text-center space-y-3">
                      <p className="text-muted-foreground font-medium">
                        {isSearching ? `No services match "${searchQuery}".` : "No services in this category."}
                      </p>
                      {!isSearching && (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm text-muted-foreground">Load services from PVADeals to get started.</p>
                          <Button size="sm" onClick={handleSync} disabled={syncing}>
                            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Sync Services Now
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
