import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/actions/auth"
import {
  listSubUsers,
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
      return NextResponse.json({ success: true, credentials: [] })
    }

    const result = await listSubUsers({ limit: 50 })
    const credentials = result.result.items.map((item) => ({
      username: item.user_name,
      status: item.status,
    }))

    return NextResponse.json({ success: true, credentials })
  } catch (error) {
    console.error("List proxy credentials error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to list proxy credentials" },
      { status: 500 }
    )
  }
}
