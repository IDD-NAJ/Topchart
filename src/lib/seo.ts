import { sql } from "@/lib/db";

interface SeoData {
  title: string | null;
  meta_description: string | null;
  keywords: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  canonical_url: string | null;
  no_index: boolean;
}

export async function getSeoSettings(pageKey: string): Promise<SeoData | null> {
  try {
    const rows = await sql`
      SELECT title, meta_description, keywords, og_image_url, favicon_url, canonical_url, no_index
      FROM seo_settings
      WHERE page_key = ${pageKey}
      LIMIT 1
    `;
    return rows.length > 0 ? (rows[0] as unknown as SeoData) : null;
  } catch {
    return null;
  }
}

export function buildMetadata(seo: SeoData | null, fallbacks: { title: string; description: string }) {
  return {
    title: seo?.title || fallbacks.title,
    description: seo?.meta_description || fallbacks.description,
    keywords: seo?.keywords || undefined,
    openGraph: {
      title: seo?.title || fallbacks.title,
      description: seo?.meta_description || fallbacks.description,
      images: seo?.og_image_url ? [{ url: seo.og_image_url }] : undefined,
    },
    robots: seo?.no_index ? { index: false, follow: false } : undefined,
    alternates: seo?.canonical_url ? { canonical: seo.canonical_url } : undefined,
    icons: seo?.favicon_url ? { icon: seo.favicon_url } : undefined,
  };
}
