export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const [media] = await sql`
      SELECT public_url, asset_type, alt_text
      FROM homepage_media
      WHERE section_key = 'header_logo' AND is_active = true
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 1
    `;

    if (!media) {
      return NextResponse.json({
        success: true,
        url: "/logo.svg",
        mediaType: "image",
        altText: "Topchart",
      });
    }

    return NextResponse.json(
      {
        success: true,
        url: media.public_url,
        mediaType: media.asset_type,
        altText: media.alt_text || "Topchart",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json({
      success: true,
      url: "/logo.svg",
      mediaType: "image",
      altText: "Topchart",
    });
  }
}
