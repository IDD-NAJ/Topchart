"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, RefreshCw, Trash2, FolderOpen, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const sectionOptions = [
  "mtn_logo",
  "telecel_logo",
  "airteltigo_logo",
  "developer_community_image",
  "hero_background_video",
  "scale_background_video",
];

export default function AdminHomepageMediaPage() {
  const [media, setMedia] = useState<HomepageMediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sectionKey, setSectionKey] = useState("mtn_logo");
  const [assetType, setAssetType] = useState<"image" | "video">("image");
  const [altText, setAltText] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storageFiles, setStorageFiles] = useState<any[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [selectedStorageFile, setSelectedStorageFile] = useState<any | null>(null);
  const [isSelectingFromStorage, setIsSelectingFromStorage] = useState(false);

  const grouped = useMemo(() => {
    return media.reduce<Record<string, HomepageMediaRecord[]>>((acc, item) => {
      acc[item.section_key] = acc[item.section_key] || [];
      acc[item.section_key].push(item);
      return acc;
    }, {});
  }, [media]);

  const loadMedia = async () => {
    try {
      const response = await fetch("/api/admin/homepage-media", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load media");
      }
      setMedia(payload.media || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load homepage media");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Select a file first");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("section_key", sectionKey);
      formData.append("asset_type", assetType);
      formData.append("alt_text", altText);
      formData.append("sort_order", String(sortOrder));
      formData.append("is_active", "true");

      const response = await fetch("/api/admin/homepage-media", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Upload failed");
      }

      toast.success("Homepage media uploaded");
      setSelectedFile(null);
      setAltText("");
      setSortOrder(0);
      await loadMedia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const updateMedia = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/homepage-media/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Update failed");
    }
  };

  const removeMedia = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/homepage-media/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Homepage Media</h1>
          <p className="text-sm text-muted-foreground">Upload and manage homepage images/videos from Supabase Storage.</p>
        </div>
        <Button variant="outline" onClick={loadMedia}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Media</CardTitle>
          <CardDescription>Upload new file or select from existing storage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </TabsTrigger>
              <TabsTrigger value="storage">
                <FolderOpen className="mr-2 h-4 w-4" />
                From Storage
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label>Section key</Label>
                <select
                  value={sectionKey}
                  onChange={(e) => setSectionKey(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {sectionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Asset type</Label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as "image" | "video")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="image">image</option>
                  <option value="video">video</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Alt text</Label>
                <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Descriptive alt text" />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>File</Label>
                <Input type="file" accept={assetType === "video" ? "video/*" : "image/*"} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="storage" className="mt-4">
              <StorageFileSelector
                sectionKey={sectionKey}
                assetType={assetType}
                altText={altText}
                sortOrder={sortOrder}
                onSuccess={loadMedia}
                onSectionChange={setSectionKey}
                sectionOptions={sectionOptions}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Object.entries(grouped).map(([section, items]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base">{section}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Order: {item.sort_order}</span>
                  </div>
                  {item.asset_type === "image" ? (
                    <div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-muted">
                      <Image src={item.public_url} alt={item.alt_text || item.section_key} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  ) : (
                    <video src={item.public_url} controls className="mb-3 w-full rounded-md" />
                  )}
                  <p className="truncate text-xs text-muted-foreground">{item.public_url}</p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await updateMedia(item.id, { is_active: !item.is_active });
                          await loadMedia();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to update");
                        }
                      }}
                    >
                      {item.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const nextOrder = window.prompt("New sort order", String(item.sort_order));
                        if (nextOrder === null) return;
                        const parsed = Number(nextOrder);
                        if (Number.isNaN(parsed)) {
                          toast.error("Sort order must be a number");
                          return;
                        }
                        try {
                          await updateMedia(item.id, { sort_order: parsed });
                          await loadMedia();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to update order");
                        }
                      }}
                    >
                      Reorder
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={deletingId === item.id}
                      onClick={async () => {
                        if (!window.confirm("Delete this media item?")) return;
                        try {
                          await removeMedia(item.id);
                          await loadMedia();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to delete");
                        }
                      }}
                    >
                      {deletingId === item.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Storage File Selector Component
function StorageFileSelector({
  sectionKey,
  assetType,
  altText,
  sortOrder,
  onSuccess,
  onSectionChange,
  sectionOptions,
}: {
  sectionKey: string;
  assetType: "image" | "video";
  altText: string;
  sortOrder: number;
  onSuccess: () => void;
  onSectionChange: (section: string) => void;
  sectionOptions: string[];
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/storage-files", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load storage files");
      }
      setFiles(payload.files || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load storage files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleAssign = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsAssigning(true);
    try {
      console.log("[ASSIGN] Starting assignment:", {
        sectionKey,
        storagePath: selectedFile.path,
        assetType: selectedFile.type || assetType,
      });

      const response = await fetch("/api/admin/storage-files", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_key: sectionKey,
          storage_path: selectedFile.path,
          asset_type: selectedFile.type || assetType,
          alt_text: altText || selectedFile.name,
          sort_order: sortOrder,
          is_active: true,
        }),
      });

      const payload = await response.json();
      console.log("[ASSIGN] Response:", payload);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to assign file");
      }

      toast.success(`File assigned to "${sectionKey}" successfully`);
      setSelectedFile(null);
      onSuccess();
    } catch (error) {
      console.error("[ASSIGN] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to assign file");
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
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Filter:</Label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "image" | "video")}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No files in storage yet.</p>
          <p className="text-xs text-muted-foreground">Upload files using the Upload New tab first.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedFile?.path === file.path
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedFile(file)}
              >
                {selectedFile?.path === file.path && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}

                {file.type === "video" ? (
                  <video
                    src={file.publicUrl}
                    className="mb-2 h-24 w-full rounded-md object-cover"
                    preload="metadata"
                  />
                ) : (
                  <div className="relative mb-2 h-24 w-full overflow-hidden rounded-md bg-muted">
                    <Image
                      src={file.publicUrl}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase">{file.type}</span>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedFile && (
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-4">
                {selectedFile.type === "video" ? (
                  <video
                    src={selectedFile.publicUrl}
                    className="h-20 w-32 rounded-md object-cover"
                    preload="metadata"
                  />
                ) : (
                  <div className="relative h-20 w-32 overflow-hidden rounded-md">
                    <Image
                      src={selectedFile.publicUrl}
                      alt={selectedFile.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Type: {selectedFile.type} • Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Label className="text-xs">Assign to:</Label>
                    <select
                      value={sectionKey}
                      onChange={(e) => onSectionChange(e.target.value)}
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {sectionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAssign} disabled={isAssigning}>
                  <Check className="mr-2 h-4 w-4" />
                  {isAssigning ? "Assigning..." : `Assign to "${sectionKey}"`}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
