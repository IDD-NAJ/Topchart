import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { toLegacySectionKey } from "@/lib/homepage-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const media = section
      ? await sql`
          SELECT id, section, slot_key, media_type, file_url, alt_text, priority, is_active, storage_source, file_name, mime_type, file_size
          FROM homepage_media
          WHERE is_active = TRUE AND slot_key = ${section}
          ORDER BY priority ASC, created_at ASC
        `
      : await sql`
          SELECT id, section, slot_key, media_type, file_url, alt_text, priority, is_active, storage_source, file_name, mime_type, file_size
          FROM homepage_media
          WHERE is_active = TRUE
          ORDER BY priority ASC, created_at ASC
        `;

    const compatMedia = media.map((item) => ({
      ...item,
      section_key: toLegacySectionKey(item.slot_key),
      asset_type: item.media_type,
      public_url: item.file_url,
      sort_order: item.priority,
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
    
    console.error("Homepage media fetch error:", {
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
      { success: false, error: "Failed to load homepage media" },
      { status: 500 }
    );
  }
}
