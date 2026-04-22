import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isHomepageSection, toLegacySectionKey } from "@/lib/homepage-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET(request: Request) {
  try {
    // #region agent log
    const debugLog = (runId: string, hypothesisId: string, location: string, message: string, data: Record<string, unknown>) =>
      fetch("http://127.0.0.1:7505/ingest/8f2aa6f2-5ac2-46a8-bc1c-0440fc874c90", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "920650" },
        body: JSON.stringify({ sessionId: "920650", runId, hypothesisId, location, message, data, timestamp: Date.now() }),
      }).catch(() => {});
    // #endregion

    const { searchParams } = new URL(request.url);
    const sectionParam = searchParams.get("section");
    const slotKey = searchParams.get("slot_key");
    const section = sectionParam && isHomepageSection(sectionParam) ? sectionParam : null;
    // #region agent log
    debugLog("baseline2", "H7", "src/app/api/media/route.ts:22", "media_api_request", {
      sectionParam: sectionParam ?? null,
      slotKey: slotKey ?? null,
      normalizedSection: section ?? null,
    });
    // #endregion

    let media: any[];
    if (section && slotKey) {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, status, version
        FROM homepage_media
        WHERE status = 'active' AND section = ${section} AND slot_key = ${slotKey}
        ORDER BY priority ASC, created_at ASC
      `;
    } else if (section) {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, status, version
        FROM homepage_media
        WHERE status = 'active' AND section = ${section}
        ORDER BY priority ASC, created_at ASC
      `;
    } else if (slotKey) {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, status, version
        FROM homepage_media
        WHERE status = 'active' AND slot_key = ${slotKey}
        ORDER BY priority ASC, created_at ASC
      `;
    } else {
      media = await sql`
        SELECT id, section, slot_key, media_type, file_url, alt_text, priority, storage_source, file_name, mime_type, file_size, status, version
        FROM homepage_media
        WHERE status = 'active'
        ORDER BY section ASC, slot_key ASC, priority ASC, created_at ASC
      `;
    }

    const compatMedia = media.map((item) => ({
      ...item,
      section_key: toLegacySectionKey(item.slot_key),
      asset_type: item.media_type,
      public_url: item.file_url,
    }));
    // #region agent log
    debugLog("baseline2", "H7", "src/app/api/media/route.ts:57", "media_api_result_summary", {
      count: compatMedia.length,
      sample: compatMedia.slice(0, 8).map((m) => ({
        slot_key: m.slot_key,
        section_key: m.section_key,
        media_type: m.media_type,
        file_url: m.file_url,
      })),
      hasKnownMissingMp4: compatMedia.some((m) =>
        String(m.file_url || "").includes("13046977_3840_2160_30fps.mp4") ||
        String(m.file_url || "").includes("7490425-uhd_3840_2160_25fps.mp4") ||
        String(m.file_url || "").includes("IMG_7731.MP4")
      ),
    });
    // #endregion

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
    // #region agent log
    fetch("http://127.0.0.1:7505/ingest/8f2aa6f2-5ac2-46a8-bc1c-0440fc874c90", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "920650" },
      body: JSON.stringify({
        sessionId: "920650",
        runId: "baseline2",
        hypothesisId: "H7",
        location: "src/app/api/media/route.ts:77",
        message: "media_api_exception",
        data: { message: error instanceof Error ? error.message : String(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
