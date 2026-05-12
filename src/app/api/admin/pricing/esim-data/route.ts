import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function verifyAdmin() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value
  
  if (!sessionToken) return null
  
  const sessions = await sql`
    SELECT s.user_id, u.role 
    FROM auth_sessions s
    JOIN users u ON s.user_id::text = u.id::text
    WHERE s.token = ${sessionToken}
    AND s.expires_at > NOW()
    LIMIT 1
  `
  
  if (sessions.length === 0) return null
  
  const session = sessions[0] as { user_id: string; role: string }
  if (session.role !== 'admin' && session.role !== 'ADMIN') return null
  
  return session.user_id
}

export async function GET() {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const packages = await sql`
      SELECT 
        id, country, country_code, flag, data_allowance, validity,
        price, network, speed, region, is_active, sort_order
      FROM esim_data_packages
      ORDER BY region ASC, sort_order ASC
    `

    return NextResponse.json({
      success: true,
      data: packages.map((p: any) => ({
        id: p.id, country: p.country, countryCode: p.country_code, flag: p.flag,
        dataAllowance: p.data_allowance, validity: p.validity,
        price: parseFloat(p.price), network: p.network, speed: p.speed,
        region: p.region, isActive: p.is_active, sortOrder: p.sort_order,
      }))
    })
  } catch (error) {
    console.error("Admin eSIM data API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch data packages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, country, countryCode, flag, dataAllowance, validity, price, network, speed, region, isActive = true, sortOrder = 0 } = body

    if (!id || !country || !dataAllowance || price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    await sql`
      INSERT INTO esim_data_packages (id, country, country_code, flag, data_allowance, validity, price, network, speed, region, is_active, sort_order)
      VALUES (${id}, ${country}, ${countryCode}, ${flag}, ${dataAllowance}, ${validity}, ${price}, ${network}, ${speed}, ${region}, ${isActive}, ${sortOrder})
      ON CONFLICT (id) DO UPDATE SET
        country = EXCLUDED.country, country_code = EXCLUDED.country_code, flag = EXCLUDED.flag,
        data_allowance = EXCLUDED.data_allowance, validity = EXCLUDED.validity, price = EXCLUDED.price,
        network = EXCLUDED.network, speed = EXCLUDED.speed, region = EXCLUDED.region,
        is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order, updated_at = NOW()
    `

    return NextResponse.json({ success: true, message: "Data package saved successfully" })
  } catch (error) {
    console.error("Admin eSIM data POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to save data package" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing package ID" }, { status: 400 })
    }

    await sql`DELETE FROM esim_data_packages WHERE id = ${id}`

    return NextResponse.json({ success: true, message: "Data package deleted successfully" })
  } catch (error) {
    console.error("Admin eSIM data DELETE error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete data package" }, { status: 500 })
  }
}
