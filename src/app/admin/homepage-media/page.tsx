"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, RefreshCw, Trash2 } from "lucide-react";

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
    const response = await fetch(`/api/admin/homepage-media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Delete failed");
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
          <CardTitle>Upload Media</CardTitle>
          <CardDescription>Choose section, file type, and upload.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
                      <Trash2 className="h-4 w-4" />
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
