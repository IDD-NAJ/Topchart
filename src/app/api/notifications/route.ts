import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { sql, isPgMissingRelation } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const notifications = await sql`
      SELECT id, user_id, type, title, message, is_read, action_url, created_at
      FROM notifications
      WHERE user_id = ${user.id}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const unreadCount = await sql`
      SELECT COUNT(*)::int as count
      FROM notifications
      WHERE user_id = ${user.id}::uuid AND is_read = false
    `;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    });
  } catch (error: any) {
    if (
      isPgMissingRelation(error) ||
      error?.code === "42703" ||
      error?.code === "22P02" ||
      error?.code === "3D000" ||
      error?.code === "42P01" ||
      (typeof error?.message === "string" && /does not exist|invalid input syntax|does not exist|relation/i.test(error.message))
    ) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }
    console.error("[Notifications API] GET error:", error);
    return NextResponse.json({
      success: true,
      notifications: [],
      unreadCount: 0,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, actionUrl } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message required" }, { status: 400 });
    }

    const id = uuidv4();
    const result = await sql`
      INSERT INTO notifications (id, user_id, type, title, message, action_url, is_read, created_at)
      VALUES (
        ${id}::uuid,
        ${user.id}::uuid,
        ${type || "info"},
        ${title},
        ${message},
        ${actionUrl || null},
        false,
        NOW()
      )
      RETURNING id, type, title, message, is_read, action_url, created_at
    `;

    return NextResponse.json({ success: true, notification: result[0] }, { status: 201 });
  } catch (error) {
    console.error("[Notifications API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${user.id}::uuid AND is_read = false
      `;
      return NextResponse.json({ success: true, action: "all_read" });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId required" }, { status: 400 });
    }

    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE id = ${notificationId}::uuid AND user_id = ${user.id}::uuid
    `;

    return NextResponse.json({ success: true, action: "read" });
  } catch (error) {
    console.error("[Notifications API] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId required" }, { status: 400 });
    }

    await sql`
      DELETE FROM notifications
      WHERE id = ${notificationId}::uuid AND user_id = ${user.id}::uuid
    `;

    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    console.error("[Notifications API] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
