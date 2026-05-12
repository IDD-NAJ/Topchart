import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let images: Array<{ image_key: string; image_url: string; alt_text: string | null }> = [];
    try {
      images = await sql`
        SELECT image_key, image_url, alt_text
        FROM homepage_images
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, created_at ASC
      `;
    } catch (dbError: unknown) {
      const message = String((dbError as { message?: string })?.message || "");
      if (message.includes("does not exist") || message.includes("relation") || message.includes("undefined_table")) {
        return NextResponse.json(
          { success: true, images: [] },
          {
            status: 200,
            headers: {
              "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
            },
          }
        );
      }
      throw dbError;
    }

    return NextResponse.json(
      { success: true, images },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Homepage images fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load homepage images" },
      { status: 500 }
    );
  }
}
