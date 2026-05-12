import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { syncPackagesToDatabase } from "@/lib/airalo"

export const runtime = "nodejs"

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value
  if (!sessionToken) return null

  const sessions = await sql`
    SELECT user_id FROM auth_sessions
    WHERE token = ${sessionToken} AND expires_at > NOW()
    LIMIT 1
  `
  return sessions.length > 0 ? String(sessions[0].user_id) : null
}

async function isAdmin(userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT role FROM users WHERE id = ${userId} LIMIT 1
  `
  return rows.length > 0 && (rows[0].role === "admin" || rows[0].role === "superadmin")
}

// POST - Sync Airalo packages to local database
export async function POST() {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const admin = await isAdmin(userId)
    if (!admin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const result = await syncPackagesToDatabase()

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error("Airalo sync error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync packages" },
      { status: 500 }
    )
  }
}
