import HomeClient from "./home-client";
import { HomepageMediaItem } from "@/hooks/use-homepage-media";

export const revalidate = 3600; // Cache for 1 hour

async function getHomepageMedia(): Promise<HomepageMediaItem[]> {
  // Check if database is configured before attempting connection
  const hasDbConfig = Boolean(
    process.env.DATABASE_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim() ||
    process.env.NETLIFY_DATABASE_URL?.trim()
  );
  
  if (!hasDbConfig) {
    console.warn("[Homepage] Database not configured - using default media");
    return [];
  }
  
  try {
    // Dynamic import to avoid initialization errors when DB is not configured
    const { sql } = await import("@/lib/db");
    const media = await sql`
      SELECT 
        id, 
        section,
        section_key, 
        slot_key, 
        media_type, 
        asset_type, 
        storage_path, 
        public_url, 
        file_url, 
        alt_text, 
        priority, 
        status,
        is_active
      FROM homepage_media 
      WHERE status = 'active' 
      ORDER BY priority DESC, created_at DESC
    `;
    return JSON.parse(JSON.stringify(media)) as HomepageMediaItem[];
  } catch (error) {
    const err = error as { code?: string; message?: string };
    // Log error but don't crash - allow page to render with defaults
    if (err.code === "42P01") {
      console.warn("[Homepage] homepage_media table does not exist - using defaults");
    } else {
      console.error("[Homepage] Failed to fetch homepage media:", err.message || error);
    }
    return [];
  }
}

export default async function HomePage() {
  const media = await getHomepageMedia();
  
  return <HomeClient initialMedia={media} />;
}
