"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, EyeOff, RefreshCw, Trash2, Upload, ImagePlus, Film,
  Replace, X
} from "lucide-react";
import {
  HOMEPAGE_SECTIONS, SECTION_LABELS, SLOT_OPTIONS,
  allowsMultipleForSlot, detectMediaType, formatFileSize,
  type HomepageSection,
} from "@/lib/homepage-media";

type MediaItem = {
  id: string;
  section: HomepageSection;
  slot_key: string;
  media_type: "image" | "video";
  file_url: string;
  storage_source: "local" | "supabase";
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  status: "active" | "inactive" | "archived";
  is_active: boolean;
  priority: number;
  version: number;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StorageFile = {
  id: string;
  name: string;
  path: string;
  publicUrl: string;
  size: number;
  mimeType: string;
  source: "local" | "supabase";
  folder: string;
  linkedInDatabase?: boolean;
};

type UploadConstraints = {
  maxImageSize: number;
  maxVideoSize: number;
  maxVideoDurationSeconds: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
};

const DEFAULT_CONSTRAINTS: UploadConstraints = {
  maxImageSize: 5 * 1024 * 1024,
  maxVideoSize: 100 * 1024 * 1024,
  maxVideoDurationSeconds: 120,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  allowedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"],
};

function relativeTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  archived: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function AdminHomepageMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [section, setSection] = useState<HomepageSection>("hero");
  const [slotKey, setSlotKey] = useState("hero_background");
  const [storageSource, setStorageSource] = useState<"local" | "supabase">("supabase");
  const [priority, setPriority] = useState(0);
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [useExistingFile, setUseExistingFile] = useState(false);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [constraints, setConstraints] = useState<UploadConstraints>(DEFAULT_CONSTRAINTS);
  const [dragOver, setDragOver] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store", credentials: "include" });
      if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error ?? "Failed to load");
      setMedia(payload.media ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const loadConstraints = async () => {
    try {
      const res = await fetch("/api/admin/media/upload");
      const data = await res.json();
      if (data.success && data.constraints) {
        const c = data.constraints;
        setConstraints({
          maxImageSize: c.image?.maxSize ?? DEFAULT_CONSTRAINTS.maxImageSize,
          maxVideoSize: c.video?.maxSize ?? DEFAULT_CONSTRAINTS.maxVideoSize,
          maxVideoDurationSeconds: c.video?.maxDurationSeconds ?? DEFAULT_CONSTRAINTS.maxVideoDurationSeconds,
          allowedImageTypes: c.image?.acceptedTypes ?? DEFAULT_CONSTRAINTS.allowedImageTypes,
          allowedVideoTypes: c.video?.acceptedTypes ?? DEFAULT_CONSTRAINTS.allowedVideoTypes,
        });
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { loadMedia(); loadConstraints(); }, []);

  useEffect(() => {
    const nextSlot = SLOT_OPTIONS[section]?.[0]?.value;
    if (nextSlot && !SLOT_OPTIONS[section]?.some((item) => item.value === slotKey)) {
      setSlotKey(nextSlot);
    }
  }, [section, slotKey]);

  const byTab = useMemo(
    () =>
      HOMEPAGE_SECTIONS.reduce((acc, item) => {
        acc[item] = media.filter((m) => m.section === item);
        return acc;
      }, {} as Record<HomepageSection, MediaItem[]>),
    [media]
  );

  const handleFileSelect = useCallback((selected: File | null) => {
    setFile(selected);
    if (filePreview) URL.revokeObjectURL(filePreview);
    if (selected && (selected.type.startsWith("image/") || selected.type.startsWith("video/"))) {
      setFilePreview(URL.createObjectURL(selected));
    } else {
      setFilePreview(null);
    }
  }, [filePreview]);

  const validateFile = (f: File): string | null => {
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isImage && !isVideo) return "Only images and videos are allowed";
    if (isImage && f.size > constraints.maxImageSize) return `Image must be under ${formatFileSize(constraints.maxImageSize)}`;
    if (isVideo && f.size > constraints.maxVideoSize) return `Video must be under ${formatFileSize(constraints.maxVideoSize)}`;
    return null;
  };

  const submitUpload = async () => {
    if (!file) { toast.error("Select a file"); return; }
    const validationError = validateFile(file);
    if (validationError) { toast.error(validationError); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("section", section);
      form.append("slot_key", slotKey);
      form.append("media_type", detectMediaType(file));
      form.append("storage_source", storageSource);
      form.append("priority", String(priority));
      form.append("alt_text", altText);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Upload failed");
      handleFileSelect(null);
      setAltText("");
      setPriority(0);
      await loadMedia();
      toast.success("Media uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const loadFiles = async () => {
    if (storageFiles.length > 0) return;
    setLoadingFiles(true);
    try {
      const response = await fetch("/api/admin/media/files", { cache: "no-store", credentials: "include" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to load files");
      setStorageFiles(payload.files ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load files");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => { if (useExistingFile) loadFiles(); }, [useExistingFile]);

  const submitSelection = async () => {
    if (!selectedFileId) { toast.error("Select a file from the library"); return; }
    const selectedFile = storageFiles.find((f) => f.id === selectedFileId);
    if (!selectedFile) return;
    setUploading(true);
    try {
      const response = await fetch("/api/admin/media/select", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section, slot_key: slotKey, priority, alt_text: altText,
          file_url: selectedFile.publicUrl, source: selectedFile.source,
          file_name: selectedFile.name, mime_type: selectedFile.mimeType, file_size: selectedFile.size,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Selection failed");
      setSelectedFileId(null);
      setAltText("");
      setPriority(0);
      await loadMedia();
      toast.success("Media selected & saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Selection failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleMedia = async (id: string, makeActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: makeActive ? "active" : "inactive" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to update");
      await loadMedia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const updatePriority = async (id: string, nextPriority: number) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: nextPriority }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to update");
      await loadMedia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const deleteMedia = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE", credentials: "include" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to delete");
      await loadMedia();
      toast.success("Media deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const handleReplace = async (item: MediaItem, replaceFile: File) => {
    const validationError = validateFile(replaceFile);
    if (validationError) { toast.error(validationError); return; }
    setUploading(true);
    try {
      await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const form = new FormData();
      form.append("file", replaceFile);
      form.append("section", item.section);
      form.append("slot_key", item.slot_key);
      form.append("media_type", detectMediaType(replaceFile));
      form.append("storage_source", storageSource);
      form.append("priority", String(item.priority));
      form.append("alt_text", item.alt_text || "");
      const response = await fetch("/api/admin/media/upload", {
        method: "POST", credentials: "include", body: form,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Replace upload failed");
      setReplaceTarget(null);
      await loadMedia();
      toast.success("Media replaced");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Replace failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [handleFileSelect]);

  const slotOptions = SLOT_OPTIONS[section] ?? [];
  const currentSlotAllowsMultiple = allowsMultipleForSlot(section, slotKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Homepage Media</h1>
          <p className="text-sm text-muted-foreground">Manage hero, header, logos, backgrounds, and banners for the homepage.</p>
        </div>
        <Button variant="outline" onClick={loadMedia} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Add Media to Slot</CardTitle>
              <CardDescription>Upload a new file or browse existing files from Supabase/Local.</CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-1 bg-muted">
              <Button size="sm" variant={!useExistingFile ? "secondary" : "ghost"} onClick={() => setUseExistingFile(false)}>Upload New</Button>
              <Button size="sm" variant={useExistingFile ? "secondary" : "ghost"} onClick={() => setUseExistingFile(true)}>Select Existing</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Section</Label>
            <select className="h-10 w-full rounded-md border px-3 bg-background" value={section} onChange={(e) => setSection(e.target.value as HomepageSection)}>
              {HOMEPAGE_SECTIONS.map((item) => <option key={item} value={item}>{SECTION_LABELS[item]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Slot key
              {currentSlotAllowsMultiple && <Badge variant="secondary" className="text-[9px] h-4">Multiple allowed</Badge>}
            </Label>
            {slotOptions.length > 0 ? (
              <select className="h-10 w-full rounded-md border px-3 bg-background" value={slotKey} onChange={(e) => setSlotKey(e.target.value)}>
                {slotOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            ) : (
              <Input value={slotKey} onChange={(e) => setSlotKey(e.target.value)} placeholder="custom_slot_key" />
            )}
          </div>
          {!useExistingFile && (
            <div className="space-y-2">
              <Label>Source</Label>
              <select className="h-10 w-full rounded-md border px-3 bg-background" value={storageSource} onChange={(e) => setStorageSource(e.target.value as "local" | "supabase")}>
                <option value="supabase">Supabase (recommended)</option>
                <option value="local">Local (dev only)</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Alt text</Label>
            <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Descriptive alt text" />
          </div>

          {!useExistingFile ? (
            <div className="space-y-2 md:col-span-3">
              <Label>File Upload</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                {filePreview ? (
                  <div className="space-y-3">
                    {file?.type.startsWith("image/") ? (
                      <img src={filePreview} alt="Preview" className="mx-auto max-h-40 rounded object-contain" />
                    ) : file?.type.startsWith("video/") ? (
                      <video src={filePreview} className="mx-auto max-h-40 rounded" muted playsInline />
                    ) : null}
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm font-medium">{file?.name}</p>
                      <Badge variant="outline" className="text-[10px]">{formatFileSize(file?.size ?? 0)}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{detectMediaType(file!)}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }}>
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      <Film className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drop an image or video here, or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Images: JPG, PNG, WebP, GIF (max {formatFileSize(constraints.maxImageSize)}) · Videos: MP4, WebM, MOV (max {formatFileSize(constraints.maxVideoSize)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 md:col-span-3 mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Select from Media Library</Label>
                <Button variant="outline" size="sm" onClick={() => loadFiles()} disabled={loadingFiles}>
                  {loadingFiles ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />} Refresh Library
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-1">
                {storageFiles.length === 0 && !loadingFiles && (
                  <p className="text-sm text-muted-foreground col-span-full">No existing files found.</p>
                )}
                {storageFiles.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFileId(f.id)}
                    className={`cursor-pointer border rounded-md overflow-hidden relative group transition-all ${selectedFileId === f.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {f.mimeType.startsWith("video") ? (
                        <video className="w-full h-full object-cover" src={f.publicUrl} />
                      ) : (
                        <img className="w-full h-full object-cover" src={f.publicUrl} loading="lazy" />
                      )}
                    </div>
                    <div className="p-2 bg-background border-t">
                      <p className="text-xs truncate font-medium" title={f.name}>{f.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatFileSize(f.size)}</span>
                        <div className="flex items-center gap-1">
                          {!f.linkedInDatabase && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">not-synced</Badge>}
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{f.source}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="md:col-span-3">
            {!useExistingFile ? (
              <Button onClick={submitUpload} disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload New File"}
              </Button>
            ) : (
              <Button onClick={submitSelection} disabled={!selectedFileId || uploading}>
                {uploading ? "Saving..." : "Save Selected Media to Slot"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={section} onValueChange={(value) => setSection(value as HomepageSection)} className="w-full">
        <TabsList className="w-full h-auto p-1 bg-muted/50 flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
          {HOMEPAGE_SECTIONS.filter(s => s !== "footer").map((s) => (
            <TabsTrigger key={s} value={s} className="flex-none px-4 py-2">
              {SECTION_LABELS[s]}
              {byTab[s]?.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{byTab[s].length}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {HOMEPAGE_SECTIONS.filter(s => s !== "footer").map((tab) => (
          <TabsContent value={tab} key={tab}>
            {SLOT_OPTIONS[tab]?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <p className="text-muted-foreground">No media slots defined for {SECTION_LABELS[tab]}.</p>
                </CardContent>
              </Card>
            ) : byTab[tab]?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center space-y-3">
                  <p className="text-muted-foreground font-medium">No media uploaded for {SECTION_LABELS[tab]} yet.</p>
                  <p className="text-sm text-muted-foreground">Use the upload form above to add images or videos.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {byTab[tab].map((item) => {
                  const slotConfig = SLOT_OPTIONS[item.section]?.find(s => s.value === item.slot_key);
                  const slotLabel = slotConfig?.label ?? item.slot_key;
                  const allowsMultiple = allowsMultipleForSlot(item.section, item.slot_key);
                  const isReplaceMode = replaceTarget === item.id;

                  return (
                    <Card key={item.id} className={item.status === "archived" ? "opacity-50" : ""}>
                      <CardContent className="space-y-3 p-4">
                        <div className="aspect-video overflow-hidden rounded bg-muted relative">
                          {item.media_type === "video" ? (
                            <video className="h-full w-full object-cover" src={item.file_url} muted playsInline controls />
                          ) : (
                            <img className="h-full w-full object-cover" src={item.file_url} alt={item.alt_text ?? item.slot_key} loading="lazy" />
                          )}
                          <Badge className={`absolute top-2 right-2 text-[9px] border ${STATUS_STYLES[item.status]}`}>
                            {item.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between"><span>Slot</span><span className="font-medium text-foreground truncate ml-2" title={slotLabel}>{slotLabel}</span></div>
                          <div className="flex justify-between"><span>Type</span><span>{item.media_type}</span></div>
                          {item.file_size != null && <div className="flex justify-between"><span>Size</span><span>{formatFileSize(item.file_size)}</span></div>}
                          {item.width && item.height && <div className="flex justify-between"><span>Dimensions</span><span>{item.width}×{item.height}</span></div>}
                          {item.duration_seconds != null && <div className="flex justify-between"><span>Duration</span><span>{formatDuration(item.duration_seconds)}</span></div>}
                          <div className="flex justify-between"><span>Source</span><span>{item.storage_source}</span></div>
                          <div className="flex justify-between"><span>Version</span><span>v{item.version}</span></div>
                          {item.alt_text && <div className="flex justify-between"><span>Alt</span><span className="truncate ml-2 max-w-[150px]" title={item.alt_text}>{item.alt_text}</span></div>}
                          {allowsMultiple && <div className="flex justify-between"><span>Multi</span><span className="text-green-600">Yes</span></div>}
                          <div className="flex justify-between"><span>Updated</span><span>{relativeTime(item.updated_at)}</span></div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.priority}
                            onChange={(e) => updatePriority(item.id, Number(e.target.value))}
                            className="h-8 w-16 text-xs"
                            title="Priority"
                          />
                          <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {item.status === "active" ? "Active" : item.status === "archived" ? "Archived" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => toggleMedia(item.id, item.status !== "active")} disabled={item.status === "archived"}>
                            {item.status === "active" ? <><EyeOff className="mr-1 h-3 w-3" />Disable</> : <><Eye className="mr-1 h-3 w-3" />Enable</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setReplaceTarget(isReplaceMode ? null : item.id);
                            if (!isReplaceMode) setTimeout(() => replaceInputRef.current?.click(), 100);
                          }} disabled={uploading}>
                            <Replace className="mr-1 h-3 w-3" />Replace
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMedia(item.id)}>
                            <Trash2 className="mr-1 h-3 w-3" />Delete
                          </Button>
                        </div>

                        {isReplaceMode && (
                          <div className="border-t pt-3 space-y-2">
                            <p className="text-xs text-muted-foreground">Select a replacement file. The current media will be archived.</p>
                            <input
                              ref={replaceInputRef}
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleReplace(item, f);
                              }}
                            />
                            <Button size="sm" variant="outline" onClick={() => replaceInputRef.current?.click()} disabled={uploading}>
                              {uploading ? "Uploading..." : "Choose Replacement File"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplaceTarget(null)}>Cancel</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <input
        ref={replaceInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && replaceTarget) {
            const item = media.find(m => m.id === replaceTarget);
            if (item) handleReplace(item, f);
          }
        }}
      />
    </div>
  );
}
