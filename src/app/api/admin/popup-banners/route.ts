import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const targetType = searchParams.get("targetType");

    let banners;
    if (isActive !== null && targetType) {
      banners = await sql`
        SELECT id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible, created_at, updated_at
        FROM popup_banners
        WHERE is_active = ${isActive === 'true'} AND target_type = ${targetType}
        ORDER BY priority DESC, created_at DESC
      ` as Array<{
        id: string;
        title: string;
        content: string;
        image_url: string | null;
        link_url: string | null;
        link_text: string | null;
        target_type: string;
        target_user_ids: unknown;
        target_segment: string | null;
        is_active: boolean;
        start_date: Date;
        end_date: Date | null;
        priority: number;
        show_once_per_session: boolean;
        dismissible: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
    } else if (isActive !== null) {
      banners = await sql`
        SELECT id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible, created_at, updated_at
        FROM popup_banners
        WHERE is_active = ${isActive === 'true'}
        ORDER BY priority DESC, created_at DESC
      ` as Array<{
        id: string;
        title: string;
        content: string;
        image_url: string | null;
        link_url: string | null;
        link_text: string | null;
        target_type: string;
        target_user_ids: unknown;
        target_segment: string | null;
        is_active: boolean;
        start_date: Date;
        end_date: Date | null;
        priority: number;
        show_once_per_session: boolean;
        dismissible: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
    } else if (targetType) {
      banners = await sql`
        SELECT id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible, created_at, updated_at
        FROM popup_banners
        WHERE target_type = ${targetType}
        ORDER BY priority DESC, created_at DESC
      ` as Array<{
        id: string;
        title: string;
        content: string;
        image_url: string | null;
        link_url: string | null;
        link_text: string | null;
        target_type: string;
        target_user_ids: unknown;
        target_segment: string | null;
        is_active: boolean;
        start_date: Date;
        end_date: Date | null;
        priority: number;
        show_once_per_session: boolean;
        dismissible: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
    } else {
      banners = await sql`
        SELECT id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible, created_at, updated_at
        FROM popup_banners
        ORDER BY priority DESC, created_at DESC
      ` as Array<{
        id: string;
        title: string;
        content: string;
        image_url: string | null;
        link_url: string | null;
        link_text: string | null;
        target_type: string;
        target_user_ids: unknown;
        target_segment: string | null;
        is_active: boolean;
        start_date: Date;
        end_date: Date | null;
        priority: number;
        show_once_per_session: boolean;
        dismissible: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
    }

    const bannersWithStats = await Promise.all(
      banners.map(async (banner) => {
        const [dismissalsResult] = await sql`
          SELECT COUNT(*) as count FROM user_banner_dismissals WHERE banner_id = ${banner.id}
        ` as Array<{ count: string }>;
        const dismissals = parseInt(dismissalsResult.count, 10);

        return {
          ...banner,
          target_user_ids: banner.target_user_ids as string[],
          dismissals,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: bannersWithStats,
    });
  } catch (error) {
    console.error("[Popup Banners API] Error fetching banners:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      content,
      image_url,
      link_url,
      link_text,
      target_type = "all",
      target_user_ids = [],
      target_segment,
      is_active = true,
      start_date,
      end_date,
      priority = 0,
      show_once_per_session = true,
      dismissible = true,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (!["all", "specific", "segment"].includes(target_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid target_type. Must be 'all', 'specific', or 'segment'" },
        { status: 400 }
      );
    }

    const targetUserIdsJson = JSON.stringify(Array.isArray(target_user_ids) ? target_user_ids : []);
    const result = await sql`
      INSERT INTO popup_banners (title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible)
      VALUES (${title}, ${content}, ${image_url || null}, ${link_url || null}, ${link_text || null}, ${target_type}, ${targetUserIdsJson}::jsonb, ${target_segment || null}, ${is_active}, ${start_date ? new Date(start_date).toISOString() : new Date().toISOString()}, ${end_date ? new Date(end_date).toISOString() : null}, ${priority}, ${show_once_per_session}, ${dismissible})
      RETURNING id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible, created_at, updated_at
    ` as Array<{
      id: string;
      title: string;
      content: string;
      image_url: string | null;
      link_url: string | null;
      link_text: string | null;
      target_type: string;
      target_user_ids: unknown;
      target_segment: string | null;
      is_active: boolean;
      start_date: Date;
      end_date: Date | null;
      priority: number;
      show_once_per_session: boolean;
      dismissible: boolean;
      created_at: Date;
      updated_at: Date;
    }>;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to create banner" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        target_user_ids: result[0].target_user_ids as string[],
      },
      message: "Banner created successfully",
    });
  } catch (error) {
    console.error("[Popup Banners API] Error creating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Banner ID is required" },
        { status: 400 }
      );
    }

    const targetUserIdsJson = updates.target_user_ids !== undefined
      ? JSON.stringify(Array.isArray(updates.target_user_ids) ? updates.target_user_ids : [])
      : null;
    const result = await sql`
      UPDATE popup_banners
      SET
        title = COALESCE(${updates.title ?? null}, title),
        content = COALESCE(${updates.content ?? null}, content),
        image_url = COALESCE(${updates.image_url ?? null}, image_url),
        link_url = COALESCE(${updates.link_url ?? null}, link_url),
        link_text = COALESCE(${updates.link_text ?? null}, link_text),
        target_type = COALESCE(${updates.target_type ?? null}, target_type),
        target_user_ids = COALESCE(${targetUserIdsJson}::jsonb, target_user_ids),
        target_segment = COALESCE(${updates.target_segment ?? null}, target_segment),
        is_active = COALESCE(${updates.is_active ?? null}, is_active),
        start_date = COALESCE(${updates.start_date ? new Date(updates.start_date).toISOString() : null}, start_date),
        end_date = COALESCE(${updates.end_date ? new Date(updates.end_date).toISOString() : null}, end_date),
        priority = COALESCE(${updates.priority ?? null}, priority),
        show_once_per_session = COALESCE(${updates.show_once_per_session ?? null}, show_once_per_session),
        dismissible = COALESCE(${updates.dismissible ?? null}, dismissible),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, content, image_url, link_url, link_text, target_type, target_user_ids, target_segment, is_active, start_date, end_date, priority, show_once_per_session, dismissible, created_at, updated_at
    ` as Array<{
      id: string;
      title: string;
      content: string;
      image_url: string | null;
      link_url: string | null;
      link_text: string | null;
      target_type: string;
      target_user_ids: unknown;
      target_segment: string | null;
      is_active: boolean;
      start_date: Date;
      end_date: Date | null;
      priority: number;
      show_once_per_session: boolean;
      dismissible: boolean;
      created_at: Date;
      updated_at: Date;
    }>;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        target_user_ids: result[0].target_user_ids as string[],
      },
      message: "Banner updated successfully",
    });
  } catch (error) {
    console.error("[Popup Banners API] Error updating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Banner ID is required" },
        { status: 400 }
      );
    }

    await sql`DELETE FROM popup_banners WHERE id = ${id}`;

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("[Popup Banners API] Error deleting banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
