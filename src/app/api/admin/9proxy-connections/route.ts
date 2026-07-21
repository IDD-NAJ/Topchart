export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import {
  listProxyConnections,
  deleteProxyConnections,
  isNineProxyConfigured,
} from "@/lib/nineproxy"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    if (!isNineProxyConfigured()) {
      return NextResponse.json(
        { success: false, error: "9Proxy not configured", state: "not_configured" },
        { status: 200 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 30

    const result = await listProxyConnections({ page, limit })

    return NextResponse.json({
      success: true,
      data: result.result,
    })
  } catch (error) {
    console.error("9Proxy connections list error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to list connections" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    const body = await request.json()
    const { startPorts } = body as { startPorts: number[] }

    if (!Array.isArray(startPorts) || startPorts.length === 0) {
      return NextResponse.json(
        { success: false, error: "startPorts must be a non-empty array" },
        { status: 400 }
      )
    }

    const result = await deleteProxyConnections(startPorts)

    return NextResponse.json({
      success: true,
      data: result.result,
    })
  } catch (error) {
    console.error("9Proxy connections delete error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete connections" },
      { status: 500 }
    )
  }
}
