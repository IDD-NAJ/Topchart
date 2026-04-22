"use client";

import { useState, useEffect, useCallback } from "react";
import { type HomepageSection } from "@/lib/homepage-media";

export interface HomepageMediaItem {
  id: string;
  section: HomepageSection;
  slot_key: string;
  media_type: "image" | "video";
  file_url: string;
  alt_text: string | null;
  priority: number;
  storage_source: "local" | "supabase";
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  status: "active" | "inactive" | "archived";
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MediaResponse {
  success: boolean;
  media: HomepageMediaItem[];
  error?: string;
}

const fetchMedia = async (section?: HomepageSection, slotKey?: string): Promise<MediaResponse> => {
  const params = new URLSearchParams();
  if (section) params.set("section", section);
  if (slotKey) params.set("slot_key", slotKey);
  
  const response = await fetch(`/api/media?${params.toString()}`, { cache: "no-store" });
  return response.json();
};

export function useMedia(section?: HomepageSection, slotKey?: string) {
  const [data, setData] = useState<HomepageMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMedia(section, slotKey);
      if (result.success) {
        setData(result.media);
      } else {
        setError(result.error || "Failed to load media");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [section, slotKey]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  return { data, loading, error, refetch: loadMedia };
}

export function useMediaBySection(section: HomepageSection) {
  return useMedia(section);
}

export function useMediaBySlot(section: HomepageSection, slotKey: string) {
  return useMedia(section, slotKey);
}
