import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = value == null ? def : Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const recentDays = clampInt(url.searchParams.get("recentDays"), 0, 0, 3650);

    const rawRows = await sql`
      SELECT to_jsonb(u) AS data
      FROM users u
    `;

    const usersArray = Array.isArray(rawRows) ? rawRows.map((row: any) => row.data) : [];

    const readString = (raw: any, keys: string[]) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value !== null && value !== undefined) return String(value);
      }
      return "";
    };

    const readNumber = (raw: any, keys: string[], fallback = 0) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value !== null && value !== undefined && value !== "") return Number(value);
      }
      return fallback;
    };

    const readBoolean = (raw: any, keys: string[], fallback = false) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value === null || value === undefined || value === "") continue;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value === 1;
        return String(value).toLowerCase() === "true";
      }
      return fallback;
    };

    const readDate = (raw: any, keys: string[]) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value) return String(value);
      }
      return "";
    };

    const formattedUsers = usersArray.map((raw: any) => ({
      id: String(raw?.id || ""),
      email: readString(raw, ["email"]),
      first_name: readString(raw, ["first_name", "firstName"]),
      last_name: readString(raw, ["last_name", "lastName"]),
      phone: readString(raw, ["phone", "phone_number", "phoneNumber"]),
      wallet_balance: readNumber(raw, ["wallet_balance", "walletBalance"], 0),
      is_verified: readBoolean(raw, ["is_verified", "isVerified"], false),
      created_at: readDate(raw, ["created_at", "createdAt"]),
      role: readString(raw, ["role"]) || "USER",
    }));

    const qLower = q.toLowerCase();
    const filteredUsers = formattedUsers.filter((user) => {
      if (qLower) {
        const haystack = `${user.email} ${user.first_name} ${user.last_name} ${user.phone}`.toLowerCase();
        if (!haystack.includes(qLower)) return false;
      }
      if (recentDays > 0 && user.created_at) {
        const created = new Date(user.created_at);
        if (Number.isNaN(created.valueOf())) return false;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - recentDays);
        if (created < cutoff) return false;
      }
      return true;
    });

    filteredUsers.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    const totalCount = filteredUsers.length;

    return NextResponse.json(
      { success: true, users: filteredUsers, total: totalCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
