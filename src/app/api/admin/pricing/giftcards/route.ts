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

    const products = await sql`
      SELECT id, brand, category, region, denominations, image, markup_percentage, is_active, sort_order
      FROM gift_card_products
      ORDER BY category ASC, sort_order ASC
    `

    return NextResponse.json({
      success: true,
      data: products.map((p: any) => ({
        id: p.id, brand: p.brand, category: p.category, region: p.region,
        denominations: p.denominations || [], image: p.image,
        markupPercentage: parseFloat(p.markup_percentage),
        isActive: p.is_active, sortOrder: p.sort_order,
      }))
    })
  } catch (error) {
    console.error("Admin gift cards API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch gift cards" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, brand, category, region, denominations, image, markupPercentage = 0, isActive = true, sortOrder = 0 } = body

    if (!id || !brand || !category) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    await sql`
      INSERT INTO gift_card_products (id, brand, category, region, denominations, image, markup_percentage, is_active, sort_order)
      VALUES (${id}, ${brand}, ${category}, ${region}, ${JSON.stringify(denominations)}::jsonb, ${image}, ${markupPercentage}, ${isActive}, ${sortOrder})
      ON CONFLICT (id) DO UPDATE SET
        brand = EXCLUDED.brand, category = EXCLUDED.category, region = EXCLUDED.region,
        denominations = EXCLUDED.denominations, image = EXCLUDED.image,
        markup_percentage = EXCLUDED.markup_percentage, is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order, updated_at = NOW()
    `

    return NextResponse.json({ success: true, message: "Gift card product saved successfully" })
  } catch (error) {
    console.error("Admin gift cards POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to save gift card" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "Missing product ID" }, { status: 400 })

    await sql`DELETE FROM gift_card_products WHERE id = ${id}`
    return NextResponse.json({ success: true, message: "Gift card product deleted successfully" })
  } catch (error) {
    console.error("Admin gift cards DELETE error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete gift card" }, { status: 500 })
  }
}
