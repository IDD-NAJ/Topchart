import { NextResponse } from "next/server"
import { getPackages } from "@/lib/airalo"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch available eSIM packages from Airalo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country") || undefined
    const type = searchParams.get("type") as "local" | "global" | "regional" | undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50

    const packages = await getPackages({
      country: country || undefined,
      type: type || undefined,
      limit,
      includeTopUp: true,
    })

    return NextResponse.json({
      success: true,
      data: packages.data,
      meta: packages.meta,
    })
  } catch (error: any) {
    console.error("Airalo packages fetch error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch packages" },
      { status: 500 }
    )
  }
}
