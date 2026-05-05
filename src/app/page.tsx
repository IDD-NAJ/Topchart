import HomeClient from "./home-client";
import { HomepageMediaItem } from "@/hooks/use-homepage-media";
import type { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: "Topchart — Buy Airtime, Data, Verification Numbers & More",
  description:
    "Buy airtime and data bundles online in Ghana for MTN, Telecel, and AirtelTigo. Get OTP verification numbers, WAEC/BECE result checker vouchers, gift cards, and bill payments on one secure platform.",
  keywords: [
    "buy airtime online ghana",
    "buy data bundles ghana",
    "mtn telecel airteltigo data",
    "verification number ghana",
    "waec bece result checker",
    "gift cards ghana",
    "bill payment ghana",
  ],
  alternates: {
    canonical: "https://topchart.store",
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
      console.warn("[Homepage] homepage_media table does not exist - using defaults");
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
