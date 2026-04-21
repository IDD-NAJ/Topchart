"use client";

import { useEffect, useState, useCallback } from "react";

export interface HomepageMediaItem {
  id: string;
  section_key: string;
  asset_type: "image" | "video";
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UseHomepageMediaOptions {
  section?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useHomepageMedia(options: UseHomepageMediaOptions = {}) {
  const { section, autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [media, setMedia] = useState<HomepageMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = section 
        ? `/api/content/homepage-media?section=${encodeURIComponent(section)}`
        : "/api/content/homepage-media";
      
      const response = await fetch(url, {
        cache: "no-store",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMedia(data.media || []);
      } else {
        throw new Error(data.error || "Failed to load media");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching homepage media:", err);
    } finally {
      setIsLoading(false);
    }
  }, [section]);

  useEffect(() => {
    fetchMedia();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMedia, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMedia, autoRefresh, refreshInterval]);

  const getMediaBySection = useCallback((sectionKey: string) => {
    return media.filter((item) => item.section_key === sectionKey && item.is_active);
  }, [media]);

  const getHeroMedia = useCallback(() => {
    return media.find((item) => 
      item.section_key === "hero_background_video" && item.is_active
    ) || null;
  }, [media]);

  return {
    media,
    isLoading,
    error,
    refetch: fetchMedia,
    getMediaBySection,
    getHeroMedia,
  };
}

export function useHeroMedia() {
  const { getHeroMedia, isLoading, error, refetch } = useHomepageMedia();
  const [heroMedia, setHeroMedia] = useState<HomepageMediaItem | null>(null);

  useEffect(() => {
    setHeroMedia(getHeroMedia());
  }, [getHeroMedia]);

  return {
    heroMedia,
    isLoading,
    error,
    refetch,
  };
}
