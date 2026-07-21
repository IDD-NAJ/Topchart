export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/actions/auth"
import {
  listProxyConnections,
  deleteProxyConnections,
  isNineProxyConfigured,
} from "@/lib/nineproxy"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!isNineProxyConfigured()) {
      return NextResponse.json({ success: true, connections: [] })
    }

    const result = await listProxyConnections({ limit: 100 })
    const connections = result.result.items.map((item) => ({
      id: item.id,
      proxy_type: item.proxy_type,
      country_code: item.country_code,
      start_port: item.start_port,
      end_port: item.end_port,
      session_time: item.session_time,
      created_at: item.created_at,
    }))

    return NextResponse.json({ success: true, connections })
  } catch (error) {
    console.error("List proxy connections error:", error)
    // Return empty connections array instead of 500 error for better UX
    return NextResponse.json({ success: true, connections: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!isNineProxyConfigured()) {
      return NextResponse.json({ success: false, error: "9Proxy not configured" }, { status: 400 })
    }

    const body = await request.json()
    const { startPort } = body

    if (!startPort) {
      return NextResponse.json({ success: false, error: "Missing startPort" }, { status: 400 })
    }

    await deleteProxyConnections([Number(startPort)])

    return NextResponse.json({ success: true, message: "Connection deleted" })
  } catch (error) {
    console.error("Delete proxy connection error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete proxy connection" },
      { status: 500 }
    )
  }
}
