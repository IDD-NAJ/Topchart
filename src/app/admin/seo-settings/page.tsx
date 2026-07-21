export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Save, Plus, Trash2, Search, Globe } from "lucide-react"

interface SeoSetting {
  id: string
  page_key: string
  title: string | null
  meta_description: string | null
  keywords: string | null
  og_image_url: string | null
  favicon_url: string | null
  canonical_url: string | null
  no_index: boolean
  updated_at: string
}

export default function SeoSettingsPage() {
  const [settings, setSettings] = useState<SeoSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [newPageKey, setNewPageKey] = useState("")

  const [form, setForm] = useState({
    title: "",
    meta_description: "",
    keywords: "",
    og_image_url: "",
    favicon_url: "",
    canonical_url: "",
    no_index: false,
  })

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/seo-settings")
      const data = await res.json()
      if (data.success) setSettings(data.settings)
    } catch {
      toast.error("Failed to load SEO settings")
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (setting: SeoSetting) => {
    setEditingKey(setting.page_key)
    setForm({
      title: setting.title || "",
      meta_description: setting.meta_description || "",
      keywords: setting.keywords || "",
      og_image_url: setting.og_image_url || "",
      favicon_url: setting.favicon_url || "",
      canonical_url: setting.canonical_url || "",
      no_index: setting.no_index,
    })
  }

  const saveSetting = async (pageKey: string) => {
    setSaving(pageKey)
    try {
      const res = await fetch("/api/admin/seo-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: pageKey, ...form }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`SEO settings for "${pageKey}" saved`)
        setEditingKey(null)
        loadSettings()
      } else {
        toast.error(data.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save SEO settings")
    } finally {
      setSaving(null)
    }
  }

  const deleteSetting = async (pageKey: string) => {
    if (!confirm(`Delete SEO settings for "${pageKey}"?`)) return
    try {
      const res = await fetch("/api/admin/seo-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: pageKey }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted SEO settings for "${pageKey}"`)
        loadSettings()
        if (editingKey === pageKey) setEditingKey(null)
      }
    } catch {
      toast.error("Failed to delete")
    }
  }

  const addNew = async () => {
    const key = newPageKey.trim().toLowerCase().replace(/\s+/g, "_")
    if (!key) return toast.error("Page key is required")
    setSaving(key)
    try {
      const res = await fetch("/api/admin/seo-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: key, ...form }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Created SEO settings for "${key}"`)
        setNewPageKey("")
        setEditingKey(null)
        loadSettings()
      } else {
        toast.error(data.error || "Failed to create")
      }
    } catch {
      toast.error("Failed to create SEO settings")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Settings</h1>
          <p className="text-sm text-muted-foreground">Manage meta tags, OG images, and indexing per page</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Page
          </CardTitle>
          <CardDescription>Create SEO settings for a new page route</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">Page Key (e.g. home, about, dashboard)</Label>
              <Input
                value={newPageKey}
                onChange={(e) => setNewPageKey(e.target.value)}
                placeholder="page_key"
                className="mt-1"
              />
            </div>
            <Button onClick={() => { setForm({ title: "", meta_description: "", keywords: "", og_image_url: "", favicon_url: "", canonical_url: "", no_index: false }); setEditingKey("__new__") }} disabled={!newPageKey.trim()}>
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {editingKey && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Editing: <Badge variant="outline">{editingKey === "__new__" ? newPageKey : editingKey}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Page Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Topchart - Buy Data, Airtime & More" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Canonical URL</Label>
                <Input value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://topchart.store" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Meta Description</Label>
              <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="Buy affordable data bundles, airtime, and more across all networks in Ghana" className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs">Keywords (comma-separated)</Label>
              <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="data bundles, airtime, ghana, mtn, vodafone" className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">OG Image URL</Label>
                <Input value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://topchart.store/og-image.png" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Favicon URL</Label>
                <Input value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="https://topchart.store/logo.svg" className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.no_index} onCheckedChange={(v) => setForm({ ...form, no_index: v })} />
              <Label className="text-xs">No Index (prevent search engines from indexing this page)</Label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => saveSetting(editingKey === "__new__" ? newPageKey : editingKey)} disabled={!!saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {settings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No SEO settings configured yet. Add a page above to get started.
            </CardContent>
          </Card>
        ) : (
          settings.map((s) => (
            <Card key={s.id} className={editingKey === s.page_key ? "ring-2 ring-blue-300" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">{s.page_key}</Badge>
                      {s.no_index && <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-700">NO INDEX</Badge>}
                    </div>
                    <p className="text-sm font-medium truncate">{s.title || <span className="text-muted-foreground italic">No title set</span>}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{s.meta_description || "No description"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Updated: {new Date(s.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(s)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSetting(s.page_key)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
