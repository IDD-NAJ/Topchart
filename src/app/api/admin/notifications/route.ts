import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const notifications = await sql`
      SELECT id, user_id, type, title, message, is_read, action_url, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countRow] = await sql`SELECT COUNT(*) as total FROM notifications` as Array<{ total: string }>;

    return NextResponse.json({
      success: true,
      data: notifications,
      total: parseInt(countRow.total, 10),
    });
  } catch (error) {
    console.error("[Admin Notifications GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { title, message, type = "info", action_url, target = "all", user_ids = [] } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }
    if (!["info", "success", "warning", "error"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid type. Use: info, success, warning, error" }, { status: 400 });
    }

    let inserted = 0;

    if (target === "all") {
      // Send to all users
      const result = await sql`
        INSERT INTO notifications (user_id, type, title, message, is_read, action_url, created_at)
        SELECT id, ${type}, ${title}, ${message}, false, ${action_url || null}, NOW()
        FROM users
      `;
      inserted = (result as any).rowCount || 0;
    } else if (target === "specific" && Array.isArray(user_ids) && user_ids.length > 0) {
      // Send to specific users
      for (const userId of user_ids) {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, is_read, action_url, created_at)
          VALUES (${userId}, ${type}, ${title}, ${message}, false, ${action_url || null}, NOW())
        `;
        inserted++;
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid target or missing user_ids" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Notification sent to ${inserted} user(s)`, inserted });
  } catch (error) {
    console.error("[Admin Notifications POST]", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await sql`DELETE FROM notifications WHERE id = ${id}`;
    } else {
      // Delete all read notifications older than 30 days
      await sql`DELETE FROM notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '30 days'`;
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("[Admin Notifications DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete notification" }, { status: 500 });
  }
}
