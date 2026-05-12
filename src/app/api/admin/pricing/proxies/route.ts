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
    SELECT s.user_id, u.role FROM auth_sessions s
    JOIN users u ON s.user_id::text = u.id::text
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
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
    if (!adminId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const pricing = await sql`
      SELECT proxy_type, label, description, price_per_port, is_active
      FROM proxy_pricing
      ORDER BY proxy_type ASC
    `

    return NextResponse.json({
      success: true,
      data: pricing.map((p: any) => ({
        proxyType: p.proxy_type,
        label: p.label,
        description: p.description,
        pricePerPort: parseFloat(p.price_per_port),
        isActive: p.is_active,
      }))
    })
  } catch (error) {
    console.error("Admin proxy pricing API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch proxy pricing" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { proxyType, label, description, pricePerPort, isActive = true } = body

    if (proxyType === undefined || !label || pricePerPort === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    await sql`
      INSERT INTO proxy_pricing (proxy_type, label, description, price_per_port, is_active)
      VALUES (${proxyType}, ${label}, ${description}, ${pricePerPort}, ${isActive})
      ON CONFLICT (proxy_type) DO UPDATE SET
        label = EXCLUDED.label, description = EXCLUDED.description,
        price_per_port = EXCLUDED.price_per_port, is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `

    return NextResponse.json({ success: true, message: "Proxy pricing saved successfully" })
  } catch (error) {
    console.error("Admin proxy pricing POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to save proxy pricing" }, { status: 500 })
  }
}
