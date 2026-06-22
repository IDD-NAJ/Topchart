import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  const sessions = await sql`
    SELECT user_id FROM auth_sessions
    WHERE token = ${sessionToken} AND expires_at > NOW()
    LIMIT 1
  `;
  return sessions.length > 0 ? String(sessions[0].user_id) : null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    const banners = await sql`
      SELECT id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible
      FROM popup_banners
      WHERE is_active = true
        AND start_date <= ${now}
        AND (end_date IS NULL OR end_date > ${now})
      ORDER BY priority DESC, created_at DESC
    ` as Array<{
      id: string;
      title: string;
      content: string;
      image_url: string | null;
      link_url: string | null;
      link_text: string | null;
      target_type: "all" | "specific" | "segment";
      target_user_ids: unknown;
      target_segment: string | null;
      is_active: boolean;
      start_date: Date;
      end_date: Date | null;
      priority: number;
      show_once_per_session: boolean;
      dismissible: boolean;
    }>;

    const dismissedBanners = await sql`
      SELECT banner_id FROM user_banner_dismissals
      WHERE user_id = ${userId}
    ` as Array<{ banner_id: string }>;
    const dismissedSet = new Set(dismissedBanners.map((d) => d.banner_id));

    const filteredBanners = banners.filter((banner) => {
      if (dismissedSet.has(banner.id)) {
        return false;
      }

      if (banner.target_type === "all") {
        return true;
      }

      if (banner.target_type === "specific") {
        const targetIds = banner.target_user_ids as string[];
        return targetIds.includes(userId);
      }

      if (banner.target_type === "segment") {
        return true;
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      data: filteredBanners,
    });
  } catch (error) {
    console.error("[User Popup Banners API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bannerId } = body;

    if (!bannerId) {
      return NextResponse.json(
        { success: false, error: "Banner ID is required" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO user_banner_dismissals (user_id, banner_id, dismissed_at)
      VALUES (${userId}, ${bannerId}, NOW())
      ON CONFLICT (user_id, banner_id) DO NOTHING
    `;

    return NextResponse.json({
      success: true,
      message: "Banner dismissed",
    });
  } catch (error) {
    console.error("[User Popup Banners API] Error dismissing banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dismiss banner" },
      { status: 500 }
    );
  }
}
