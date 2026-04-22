import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isHomepageSection, toLegacySectionKey } from "@/lib/homepage-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionParam = searchParams.get("section");
    const slotKey = searchParams.get("slot_key");
    const section = sectionParam && isHomepageSection(sectionParam) ? sectionParam : null;

    let media: any[];
    if (section && slotKey) {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, is_active
        FROM homepage_media
        WHERE is_active = TRUE AND section = ${section} AND slot_key = ${slotKey}
        ORDER BY priority ASC, created_at ASC
      `;
    } else if (section) {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, is_active
        FROM homepage_media
        WHERE is_active = TRUE AND section = ${section}
        ORDER BY priority ASC, created_at ASC
      `;
    } else if (slotKey) {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, is_active
        FROM homepage_media
        WHERE is_active = TRUE AND slot_key = ${slotKey}
        ORDER BY priority ASC, created_at ASC
      `;
    } else {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, is_active
        FROM homepage_media
        WHERE is_active = TRUE
        ORDER BY section ASC, slot_key ASC, priority ASC, created_at ASC
      `;
    }

    const compatMedia = media.map((item) => ({
      ...item,
      section_key: toLegacySectionKey(item.slot_key),
      asset_type: item.media_type,
      public_url: item.file_url,
    }));

    return NextResponse.json(
      { success: true, media: compatMedia || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: unknown) {
    const message = String((error as { message?: string })?.message || "");
    const code = (error as { code?: string })?.code || "";
    
    console.error("Media fetch error:", {
      message,
      code,
      error: error instanceof Error ? error.stack : String(error)
    });
    
    if (message.includes("does not exist") || message.includes("relation") || code === "42P01") {
      return NextResponse.json(
        { success: true, media: [] },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to load media" },
      { status: 500 }
    );
  }
}
