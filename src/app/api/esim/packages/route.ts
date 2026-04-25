import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch all active eSIM data packages
export async function GET() {
  try {
    const packages = await sql`
      SELECT 
        id,
        country,
        country_code,
        flag,
        data_allowance,
        validity,
        price,
        network,
        speed,
        region,
        is_active,
        sort_order
      FROM esim_data_packages
      WHERE is_active = true
      ORDER BY region ASC, sort_order ASC, price ASC
    `

    return NextResponse.json({
      success: true,
      data: packages.map((p: any) => ({
        id: p.id,
        country: p.country,
        countryCode: p.country_code,
        flag: p.flag,
        dataAllowance: p.data_allowance,
        validity: p.validity,
        price: parseFloat(p.price),
        network: p.network,
        speed: p.speed,
        region: p.region,
      }))
    })
  } catch (error) {
    console.error("eSIM packages API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch data packages" },
      { status: 500 }
    )
  }
}
