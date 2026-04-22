import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");

    let media;
    if (section) {
      media = await sql`
        SELECT section_key, asset_type, public_url, alt_text, priority, storage_source, file_name, mime_type, file_size
        FROM homepage_media
        WHERE is_active = TRUE AND section_key = ${section}
        ORDER BY priority ASC, created_at ASC
      `;
    } else {
      media = await sql`
        SELECT section_key, asset_type, public_url, alt_text, priority, storage_source, file_name, mime_type, file_size
        FROM homepage_media
        WHERE is_active = TRUE
        ORDER BY section_key ASC, priority ASC, created_at ASC
      `;
    }

    return NextResponse.json(
      { success: true, media: media || [] },
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
