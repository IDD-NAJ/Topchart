"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { adminFetcher, formatDateTime } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Image as ImageIcon, RefreshCw, Search, Film, FileIcon, Eye } from "lucide-react"

interface MediaItem {
  id: string
  section?: string
  slot_key?: string
  section_key?: string
  media_type: string
  file_url?: string
  public_url?: string
  alt_text?: string
  file_name?: string
  mime_type?: string
  file_size?: number
  is_active: boolean
  priority?: number
  created_at: string
}

interface MediaResponse {
  success: boolean
  media: MediaItem[]
  total?: number
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminMediaPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [preview, setPreview] = useState<MediaItem | null>(null)

  const { data, error, isLoading, mutate } = useSWR<MediaResponse>("/api/admin/homepage-media", adminFetcher)
  const items = data?.media || []

  const filtered = items.filter((m) => {
    const matchSearch = !search || m.file_name?.toLowerCase().includes(search.toLowerCase()) || m.alt_text?.toLowerCase().includes(search.toLowerCase()) || m.section?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || m.media_type === typeFilter
    const matchSection = sectionFilter === "all" || m.section === sectionFilter
    return matchSearch && matchType && matchSection
  })

  const sections = Array.from(new Set(items.map((m) => m.section).filter(Boolean)))
  const types = Array.from(new Set(items.map((m) => m.media_type).filter(Boolean)))
  const imageCount = items.filter((m) => m.media_type?.includes("image") || m.media_type === "image").length
  const videoCount = items.filter((m) => m.media_type?.includes("video") || m.media_type === "video").length

  const getMediaUrl = (m: MediaItem) => m.public_url || m.file_url

  const isImage = (m: MediaItem) =>
    m.mime_type?.startsWith("image/") || m.media_type === "image" || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(m.file_name || "")

  return (
    <AdminPageShell
      title="Media Library"
      description="View and manage all uploaded homepage and platform media assets."
      icon={ImageIcon}
      actions={
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Assets" value={data?.total ?? items.length} icon={FileIcon} />
        <StatCard label="Images" value={imageCount} icon={ImageIcon} accent />
        <StatCard label="Videos" value={videoCount} icon={Film} />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((t) => <SelectItem key={t as string} value={t as string} className="capitalize">{t as string}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s as string} value={s as string} className="capitalize">{s as string}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} asset{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : error ? (
          <EmptyState icon={ImageIcon} title="Failed to load media" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No media found" description="Uploaded assets will appear here." />
        ) : (
          <div className="p-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((m) => {
              const url = getMediaUrl(m)
              return (
                <div key={m.id} className="group relative overflow-hidden rounded-xl border border-border bg-muted aspect-square cursor-pointer" onClick={() => setPreview(m)}>
                  {url && isImage(m) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={m.alt_text || m.file_name || "Media asset"}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="h-6 w-6 text-white drop-shadow" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-[10px] font-medium truncate">{m.file_name || m.section_key || m.slot_key}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge variant={m.is_active ? "default" : "secondary"} className="text-[9px] py-0 px-1">
                        {m.is_active ? "Active" : "Hidden"}
                      </Badge>
                      {m.section && <span className="text-white/70 text-[9px]">{m.section}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AdminTableShell>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{preview?.file_name || preview?.slot_key || "Asset Preview"}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {getMediaUrl(preview) && isImage(preview) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getMediaUrl(preview)!}
                  alt={preview.alt_text || "Asset"}
                  className="max-h-64 w-full object-contain rounded-lg bg-muted"
                />
              ) : getMediaUrl(preview) ? (
                <video src={getMediaUrl(preview)} controls className="w-full rounded-lg" />
              ) : null}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Section", preview.section],
                  ["Slot", preview.slot_key],
                  ["Type", preview.media_type],
                  ["MIME Type", preview.mime_type],
                  ["File Size", formatFileSize(preview.file_size)],
                  ["Priority", preview.priority],
                  ["Alt Text", preview.alt_text],
                  ["Uploaded", formatDateTime(preview.created_at)],
                ].map(([label, val]) => val !== undefined && val !== null && val !== "" ? (
                  <div key={label as string}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-medium break-all">{String(val)}</p>
                  </div>
                ) : null)}
              </div>
              {getMediaUrl(preview) && (
                <a href={getMediaUrl(preview)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  Open original
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
