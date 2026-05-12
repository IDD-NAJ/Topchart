import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch all active proxy pricing
export async function GET() {
  try {
    const pricing = await sql`
      SELECT 
        proxy_type,
        label,
        description,
        price_per_port,
        is_active
      FROM proxy_pricing
      WHERE is_active = true
      ORDER BY proxy_type ASC
    `

    return NextResponse.json({
      success: true,
      data: pricing.map((p: any) => ({
        proxyType: p.proxy_type,
        label: p.label,
        description: p.description,
        pricePerPort: parseFloat(p.price_per_port),
      }))
    })
  } catch (error) {
    console.error("Proxy pricing API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch proxy pricing" },
      { status: 500 }
    )
  }
}
