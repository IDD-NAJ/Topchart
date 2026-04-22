"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, RefreshCw, Trash2, Upload } from "lucide-react";
import { HOMEPAGE_SECTIONS, SECTION_LABELS, type HomepageSection } from "@/lib/homepage-media";

const SLOT_OPTIONS: Record<HomepageSection, Array<{ value: string; label: string }>> = {
  hero: [
    { value: "hero_background", label: "Homepage Hero" },
    { value: "faq_hero_background", label: "FAQ Hero" },
    { value: "about_hero_background", label: "About Hero" },
  ],
  header: [{ value: "header_logo", label: "Header Logo" }],
  logo: [
    { value: "network_mtn_logo", label: "MTN Logo" },
    { value: "network_telecel_logo", label: "Telecel Logo" },
    { value: "network_airteltigo_logo", label: "AirtelTigo Logo" },
  ],
  banner: [{ value: "developer_community_image", label: "Developer Community Banner" }],
  background: [{ value: "scale_background_video", label: "Scale Section Background" }],
  footer: [],
};

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
  is_active: boolean;
  priority: number;
};

function humanSize(bytes?: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminHomepageMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [section, setSection] = useState<HomepageSection>("hero");
  const [slotKey, setSlotKey] = useState("hero_background");
  const [storageSource, setStorageSource] = useState<"local" | "supabase">("supabase");
  const [priority, setPriority] = useState(0);
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store", credentials: "include" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to load");
      setMedia(payload.media ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    const nextSlot = SLOT_OPTIONS[section]?.[0]?.value;
    if (nextSlot && !SLOT_OPTIONS[section].some((item) => item.value === slotKey)) {
      setSlotKey(nextSlot);
    }
  }, [section, slotKey]);

  const byTab = useMemo(
    () =>
      HOMEPAGE_SECTIONS.reduce((acc, item) => {
        acc[item] = media.filter((mediaItem) => mediaItem.section === item);
        return acc;
      }, {} as Record<HomepageSection, MediaItem[]>),
    [media]
  );

  const submitUpload = async () => {
    if (!file) {
      toast.error("Select a file");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("section", section);
      form.append("slot_key", slotKey);
      form.append("media_type", file.type.startsWith("video/") ? "video" : "image");
      form.append("storage_source", storageSource);
      form.append("priority", String(priority));
      form.append("alt_text", altText);
      form.append("is_active", "true");
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Upload failed");
      setFile(null);
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

  const toggleMedia = async (id: string, isActive: boolean) => {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to update");
    await loadMedia();
  };

  const updatePriority = async (id: string, nextPriority: number) => {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: nextPriority }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to update");
    await loadMedia();
  };

  const deleteMedia = async (id: string) => {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Failed to delete");
    await loadMedia();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Homepage Media</h1>
          <p className="text-sm text-muted-foreground">Manage hero, header, logos, backgrounds, and banners.</p>
        </div>
        <Button variant="outline" onClick={loadMedia} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload media</CardTitle>
          <CardDescription>Supports `.jpg`, `.png`, `.webp`, `.mp4` to local or Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Section</Label>
            <select className="h-10 w-full rounded-md border px-3" value={section} onChange={(e) => setSection(e.target.value as HomepageSection)}>
              {HOMEPAGE_SECTIONS.map((item) => <option key={item} value={item}>{SECTION_LABELS[item]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Slot key</Label>
            <div className="space-y-2">
              {SLOT_OPTIONS[section]?.length ? (
                <select className="h-10 w-full rounded-md border px-3" value={slotKey} onChange={(e) => setSlotKey(e.target.value)}>
                  {SLOT_OPTIONS[section].map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              ) : null}
              <Input value={slotKey} onChange={(e) => setSlotKey(e.target.value)} placeholder="hero_background" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <select className="h-10 w-full rounded-md border px-3" value={storageSource} onChange={(e) => setStorageSource(e.target.value as "local" | "supabase")}>
              <option value="supabase">Supabase</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Alt text</Label>
            <Input value={altText} onChange={(e) => setAltText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="md:col-span-3">
            <Button onClick={submitUpload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={section} onValueChange={(value) => setSection(value as HomepageSection)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="logo">Logos</TabsTrigger>
          <TabsTrigger value="background">Backgrounds</TabsTrigger>
          <TabsTrigger value="banner">Banners</TabsTrigger>
        </TabsList>
        {(["hero", "header", "logo", "background", "banner"] as HomepageSection[]).map((tab) => (
          <TabsContent value={tab} key={tab}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {byTab[tab]?.map((item) => (
                <Card key={item.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="aspect-video overflow-hidden rounded bg-muted">
                      {item.media_type === "video" ? (
                        <video className="h-full w-full object-cover" src={item.file_url} muted playsInline controls />
                      ) : (
                        <img className="h-full w-full object-cover" src={item.file_url} alt={item.file_name ?? item.slot_key} loading="lazy" />
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Slot</span><span>{item.slot_key}</span></div>
                      <div className="flex justify-between"><span>Type</span><span>{item.media_type}</span></div>
                      <div className="flex justify-between"><span>Size</span><span>{humanSize(item.file_size)}</span></div>
                      <div className="flex justify-between"><span>Source</span><span>{item.storage_source}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.priority}
                        onChange={(e) => updatePriority(item.id, Number(e.target.value))}
                      />
                      <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleMedia(item.id, !item.is_active)}>
                        {item.is_active ? <EyeOff className="mr-2 h-3 w-3" /> : <Eye className="mr-2 h-3 w-3" />}
                        {item.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMedia(item.id)}>
                        <Trash2 className="mr-2 h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
