import HomeClient from "./home-client";
import { HomepageMediaItem } from "@/hooks/use-homepage-media";
import type { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: "Buy Cheap Data Bundles, Airtime & Verification Numbers in Ghana",
  description: "Buy cheap MTN, Telecel & AirtelTigo data bundles instantly. Get virtual numbers for OTP & SMS verification in Ghana. Secure, fast & always on.",
  keywords: [
    'cheap data Ghana',
    'buy MTN data online',
    'airtime Ghana',
    'OTP verification numbers',
    'cheap Telecel bundles',
    'AirtelTigo internet bundles',
  ],
  alternates: { canonical: "https://topchart.store" },
  openGraph: {
    title: "Buy Cheap Data Bundles, Airtime & Verification Numbers in Ghana",
    description: "Ghana's trusted platform for data bundles, airtime, verification numbers, result checkers & bill payments.",
    url: "https://topchart.store",
  },
};

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
    const { isPgMissingRelation } = await import("@/lib/db");
    if (isPgMissingRelation(error)) {
      console.warn("[Homepage] homepage_media table Last Names not exist - using defaults");
    } else {
      const err = error as { message?: string };
      console.error("[Homepage] Failed to fetch homepage media:", err.message || error);
    }
    return [];
  }
}

export default async function HomePage() {
  const media = await getHomepageMedia();
  
  return <HomeClient initialMedia={media} />;
}
