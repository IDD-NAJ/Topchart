export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const rows = await sql`
    SELECT user_id FROM auth_sessions
    WHERE token = ${token} AND expires_at > NOW()
    LIMIT 1
  `;
  return rows[0]?.user_id ?? null;
}

function computeNextRun(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
  }
  return now;
}

// GET — list all scheduled purchases for the current user
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Ensure table exists before querying
    await sql`
      CREATE TABLE IF NOT EXISTS scheduled_purchases (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL,
        network      TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        plan_id      TEXT NOT NULL,
        plan_name    TEXT NOT NULL,
        amount       NUMERIC(12, 2) NOT NULL,
        frequency    TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
        next_run_at  TIMESTAMPTZ NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        last_run_at  TIMESTAMPTZ,
        run_count    INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const rows = await sql`
      SELECT * FROM scheduled_purchases
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[scheduled-purchases GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch scheduled purchases" }, { status: 500 });
  }
}

// POST — create a new scheduled purchase
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { network, phone_number, plan_id, plan_name, amount, frequency } = body;

    if (!network || !phone_number || !plan_id || !plan_name || !amount || !frequency) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!["daily", "weekly", "monthly"].includes(frequency)) {
      return NextResponse.json({ success: false, error: "Invalid frequency" }, { status: 400 });
    }

    const nextRunAt = computeNextRun(frequency);

    const rows = await sql`
      INSERT INTO scheduled_purchases
        (user_id, network, phone_number, plan_id, plan_name, amount, frequency, next_run_at)
      VALUES
        (${userId}, ${network}, ${phone_number}, ${plan_id}, ${plan_name}, ${amount}, ${frequency}, ${nextRunAt.toISOString()})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("[scheduled-purchases POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create scheduled purchase" }, { status: 500 });
  }
}

// PATCH — toggle active / update a scheduled purchase
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, is_active, frequency } = body;

    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    // Ensure row belongs to user
    const owns = await sql`SELECT id FROM scheduled_purchases WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
    if (!owns.length) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (typeof is_active === "boolean") {
      await sql`UPDATE scheduled_purchases SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (frequency && ["daily", "weekly", "monthly"].includes(frequency)) {
      const nextRunAt = computeNextRun(frequency);
      await sql`UPDATE scheduled_purchases SET frequency = ${frequency}, next_run_at = ${nextRunAt.toISOString()}, updated_at = NOW() WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scheduled-purchases PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — remove a scheduled purchase
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    await sql`DELETE FROM scheduled_purchases WHERE id = ${id} AND user_id = ${userId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scheduled-purchases DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}
