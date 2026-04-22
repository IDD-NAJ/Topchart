import { sql } from "@/lib/db";
import HomeClient from "./home-client";
import { HomepageMediaItem } from "@/hooks/use-homepage-media";

export const revalidate = 3600; // Cache for 1 hour

async function getHomepageMedia() {
  try {
    const media = await sql`
      SELECT 
        id, 
        section_key, 
        slot_key, 
        media_type, 
        asset_type, 
        storage_path, 
        public_url, 
        file_url, 
        alt_text, 
        priority, 
        status as is_active 
      FROM homepage_media 
      WHERE status = 'active' 
      ORDER BY priority DESC, created_at DESC
    `;
    return JSON.parse(JSON.stringify(media)) as HomepageMediaItem[];
  } catch (error) {
    console.error("Failed to fetch homepage media:", error);
    return [];
  }
}

export default async function HomePage() {
  const media = await getHomepageMedia();
  
  return <HomeClient initialMedia={media} />;
}
