"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  RefreshCw,
  Trash2,
  FolderOpen,
  Check,
  X,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  CloudUpload,
  Film,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type HomepageMediaRecord = {
  id: string;
  section_key: string;
  asset_type: "image" | "video";
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const SECTION_OPTIONS = [
  { value: "header_logo", label: "Header Logo/Video", icon: Video },
  { value: "hero_background_video", label: "Hero Background Video", icon: Film },
  { value: "scale_background_video", label: "Scale Section Video", icon: Film },
  { value: "mtn_logo", label: "MTN Logo", icon: ImageIcon },
  { value: "telecel_logo", label: "Telecel Logo", icon: ImageIcon },
  { value: "airteltigo_logo", label: "AirtelTigo Logo", icon: ImageIcon },
  { value: "developer_community_image", label: "Developer Section Image", icon: ImageIcon },
];

const ACCEPTED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  video: ["video/mp4", "video/webm", "video/ogg"],
};
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function detectAssetType(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["mp4", "webm", "ogg", "mov", "avi"].includes(ext) ? "video" : "image";
}

function MediaPreview({ url, type, alt }: { url: string; type: "image" | "video"; alt?: string | null }) {
  if (type === "video") {
    return (
      <video
        src={url}
        className="h-full w-full object-cover"
        preload="metadata"
        muted
        onError={(e) => {
          (e.target as HTMLVideoElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt ?? ""}
      className="h-full w-full object-contain"
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

function DropZone({
  onFile,
  assetType,
  file,
  previewUrl,
  onClear,
}: {
  onFile: (f: File) => void;
  assetType: "image" | "video";
  file: File | null;
  previewUrl: string | null;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (!dropped) return;
      const allowed = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video];
      if (!allowed.includes(dropped.type)) {
        toast.error("Unsupported file type");
        return;
      }
      if (dropped.size > MAX_FILE_SIZE) {
        toast.error(`File too large (max ${humanSize(MAX_FILE_SIZE)})`);
        return;
      }
      onFile(dropped);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`File too large (max ${humanSize(MAX_FILE_SIZE)})`);
      return;
    }
    onFile(f);
    e.target.value = "";
  };

  if (file && previewUrl) {
    return (
      <div className="relative rounded-xl border border-primary/30 bg-muted/40 overflow-hidden">
        <div className="aspect-video flex items-center justify-center bg-black/5">
          {detectAssetType(file) === "video" ? (
            <video src={previewUrl} controls className="max-h-48 max-w-full rounded" />
          ) : (
            <img src={previewUrl} alt={file.name} className="max-h-48 max-w-full object-contain rounded" />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{humanSize(file.size)}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <CloudUpload className={cn("h-10 w-10", dragging ? "text-primary" : "text-muted-foreground")} />
      <div className="text-center">
        <p className="text-sm font-medium">Drop file here or <span className="text-primary">browse</span></p>
        <p className="mt-1 text-xs text-muted-foreground">
          {assetType === "video" ? "MP4, WebM, OGG" : "JPG, PNG, WebP, GIF, SVG"} · max {humanSize(MAX_FILE_SIZE)}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={assetType === "video" ? "video/*" : "image/*"}
        onChange={handleChange}
      />
    </div>
  );
}

function MediaCard({
  item,
  onToggle,
  onDelete,
  isDeleting,
}: {
  item: HomepageMediaRecord;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}) {
  const [toggling, setToggling] = useState(false);
  const sectionLabel = SECTION_OPTIONS.find((s) => s.value === item.section_key)?.label ?? item.section_key;

  return (
    <div className={cn(
      "group rounded-xl border bg-card transition-all duration-200",
      item.is_active ? "border-primary/30 shadow-sm shadow-primary/10" : "border-border opacity-75"
    )}>
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted/60">
        <MediaPreview url={item.public_url} type={item.asset_type} alt={item.alt_text} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge
            variant={item.is_active ? "default" : "secondary"}
            className={cn("text-xs", item.is_active && "bg-emerald-500")}
          >
            {item.is_active ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline" className="bg-background/80 text-xs capitalize">
            {item.asset_type}
          </Badge>
        </div>
        {item.asset_type === "video" && (
          <div className="absolute bottom-2 left-2">
            <Film className="h-4 w-4 text-white/80" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div>
          <p className="text-sm font-medium truncate">{sectionLabel}</p>
          {item.alt_text && (
            <p className="text-xs text-muted-foreground truncate">{item.alt_text}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant={item.is_active ? "outline" : "default"}
            size="sm"
            className="flex-1 text-xs"
            disabled={toggling}
            onClick={async () => {
              setToggling(true);
              try {
                await onToggle(item.id, !item.is_active);
              } finally {
                setToggling(false);
              }
            }}
          >
            {toggling ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : item.is_active ? (
              <><EyeOff className="mr-1 h-3 w-3" /> Deactivate</>
            ) : (
              <><Eye className="mr-1 h-3 w-3" /> Activate</>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            disabled={isDeleting}
            onClick={async () => {
              if (!window.confirm(`Delete "${sectionLabel}"? This cannot be undone.`)) return;
              await onDelete(item.id);
            }}
          >
            {isDeleting ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminHomepageMediaPage() {
  const [media, setMedia] = useState<HomepageMediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sectionKey, setSectionKey] = useState(SECTION_OPTIONS[0].value);
  const [altText, setAltText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string>("all");

  const assetType = useMemo((): "image" | "video" => {
    if (selectedFile) return detectAssetType(selectedFile);
    const found = SECTION_OPTIONS.find((s) => s.value === sectionKey);
    if (!found) return "image";
    return (found.value.includes("video") || found.value.includes("film")) ? "video" : "image";
  }, [selectedFile, sectionKey]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/homepage-media", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to load");
      setMedia(payload.media ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load homepage media");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadMedia(); }, []);

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("Select a file first"); return; }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("section_key", sectionKey);
      formData.append("asset_type", detectAssetType(selectedFile));
      formData.append("alt_text", altText);
      formData.append("sort_order", "0");
      formData.append("is_active", "true");

      const res = await fetch("/api/admin/homepage-media", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.error ?? "Upload failed");

      toast.success("Media uploaded and set as active");
      clearFile();
      setAltText("");
      await loadMedia();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/homepage-media/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.error ?? "Update failed");
      toast.success(active ? "Media activated (others in section deactivated)" : "Media deactivated");
      await loadMedia();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/homepage-media/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.error ?? "Delete failed");
      toast.success("Media deleted");
      await loadMedia();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMedia = useMemo(() => {
    if (filterSection === "all") return media;
    return media.filter((m) => m.section_key === filterSection);
  }, [media, filterSection]);

  const grouped = useMemo(() => {
    return filteredMedia.reduce<Record<string, HomepageMediaRecord[]>>((acc, item) => {
      acc[item.section_key] = acc[item.section_key] ?? [];
      acc[item.section_key].push(item);
      return acc;
    }, {});
  }, [filteredMedia]);

  const activeCount = media.filter((m) => m.is_active).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading media library…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage images and videos displayed on the public homepage. Activating a file
            automatically deactivates others in the same section.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs">
            {activeCount} active
          </Badge>
          <Badge variant="outline" className="text-xs">
            {media.length} total
          </Badge>
          <Button variant="outline" size="sm" onClick={loadMedia}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage warning if no items */}
      {media.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">No media found.</p>
            <p className="mt-1 text-amber-700">
              Run <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">node setup-homepage-media.js</code> to
              initialize the database table and Supabase bucket, then upload your first files below.
            </p>
          </div>
        </div>
      )}

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Media
          </CardTitle>
          <CardDescription>
            Drag-and-drop or browse. Uploading automatically sets the file as active for the chosen section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                New Upload
              </TabsTrigger>
              <TabsTrigger value="storage">
                <FolderOpen className="mr-2 h-4 w-4" />
                From Storage
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <select
                    value={sectionKey}
                    onChange={(e) => setSectionKey(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {SECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Alt text / description</Label>
                  <Input
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="e.g. MTN logo for hero section"
                  />
                </div>
              </div>

              <DropZone
                assetType={assetType}
                file={selectedFile}
                previewUrl={previewUrl}
                onFile={handleFileSelect}
                onClear={clearFile}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="min-w-32"
                >
                  {isUploading ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><CloudUpload className="mr-2 h-4 w-4" /> Upload & Activate</>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="storage" className="mt-4">
              <StorageFileSelector
                sectionKey={sectionKey}
                altText={altText}
                onSuccess={loadMedia}
                onSectionChange={setSectionKey}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Media Library */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Media Library</h2>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Filter:</Label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All sections ({media.length})</option>
              {SECTION_OPTIONS.map((opt) => {
                const count = media.filter((m) => m.section_key === opt.value).length;
                return count > 0 ? (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({count})
                  </option>
                ) : null;
              })}
            </select>
          </div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No media yet</p>
            <p className="text-xs text-muted-foreground">Upload your first file above.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([sectionK, items]) => {
            const sectionLabel = SECTION_OPTIONS.find((s) => s.value === sectionK)?.label ?? sectionK;
            const hasActive = items.some((i) => i.is_active);
            return (
              <div key={sectionK} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {sectionLabel}
                  </h3>
                  {!hasActive && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs">
                      No active
                    </Badge>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      isDeleting={deletingId === item.id}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StorageFileSelector({
  sectionKey,
  altText,
  onSuccess,
  onSectionChange,
}: {
  sectionKey: string;
  altText: string;
  onSuccess: () => void;
  onSectionChange: (s: string) => void;
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/storage-files", { credentials: "include", cache: "no-store" });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to load");
      setFiles(payload.files ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load storage files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadFiles(); }, []);

  const handleAssign = async () => {
    if (!selectedFile) { toast.error("Select a file first"); return; }
    setIsAssigning(true);
    try {
      const res = await fetch("/api/admin/storage-files", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_key: sectionKey,
          storage_path: selectedFile.path,
          asset_type: selectedFile.type,
          alt_text: altText || selectedFile.name,
          sort_order: 0,
          is_active: true,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to assign");
      toast.success(`Assigned to "${sectionKey}" successfully`);
      setSelectedFile(null);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign file");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredFiles = files.filter((f) => {
    if (f.isFolder) return false;
    if (filter === "all") return true;
    return f.type === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Filter:</Label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "image" | "video")}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-3 w-3", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No files in bucket yet.</p>
          <p className="text-xs text-muted-foreground">Upload via the "New Upload" tab first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto pr-1">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => setSelectedFile(selectedFile?.path === file.path ? null : file)}
                className={cn(
                  "relative cursor-pointer rounded-lg border p-2 transition-all",
                  selectedFile?.path === file.path
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                {selectedFile?.path === file.path && (
                  <div className="absolute right-2 top-2 z-10 rounded-full bg-primary p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="aspect-video overflow-hidden rounded bg-muted/60 mb-2">
                  {file.type === "video" ? (
                    <video src={file.publicUrl} className="h-full w-full object-cover" preload="metadata" muted />
                  ) : (
                    <img src={file.publicUrl} alt={file.name} className="h-full w-full object-contain" loading="lazy" />
                  )}
                </div>
                <p className="truncate text-xs font-medium">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{humanSize(file.size ?? 0)} · {file.type}</p>
              </div>
            ))}
          </div>

          {selectedFile && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{humanSize(selectedFile.size ?? 0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Assign to:</Label>
                  <select
                    value={sectionKey}
                    onChange={(e) => onSectionChange(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {SECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  <X className="mr-2 h-3 w-3" /> Cancel
                </Button>
                <Button size="sm" onClick={handleAssign} disabled={isAssigning}>
                  {isAssigning ? (
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-3 w-3" />
                  )}
                  {isAssigning ? "Assigning…" : "Assign & Activate"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
