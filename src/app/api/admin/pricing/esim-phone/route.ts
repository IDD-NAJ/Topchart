import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Verify admin authentication
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

// GET - Fetch all eSIM phone plans (admin view)
export async function GET() {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const plans = await sql`
      SELECT 
        id,
        name,
        price,
        minutes,
        sms,
        validity_days,
        features,
        is_active,
        popular,
        sort_order,
        created_at,
        updated_at
      FROM esim_phone_plans
      ORDER BY sort_order ASC, price ASC
    `

    return NextResponse.json({
      success: true,
      data: plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        minutes: p.minutes,
        sms: p.sms,
        validityDays: p.validity_days,
        features: p.features || [],
        isActive: p.is_active,
        popular: p.popular,
        sortOrder: p.sort_order,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    })
  } catch (error) {
    console.error("Admin eSIM phone plans API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch phone plans" },
      { status: 500 }
    )
  }
}

// POST - Create or update eSIM phone plan
export async function POST(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      id, 
      name, 
      price, 
      minutes = 0, 
      sms = 0, 
      validityDays = 30, 
      features = [], 
      isActive = true,
      popular = false,
      sortOrder = 0 
    } = body

    if (!id || !name || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, name, price" },
        { status: 400 }
      )
    }

    await sql`
      INSERT INTO esim_phone_plans (
        id, name, price, minutes, sms, validity_days, features, is_active, popular, sort_order
      ) VALUES (
        ${id}, ${name}, ${price}, ${minutes}, ${sms}, ${validityDays}, 
        ${JSON.stringify(features)}::jsonb, ${isActive}, ${popular}, ${sortOrder}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        minutes = EXCLUDED.minutes,
        sms = EXCLUDED.sms,
        validity_days = EXCLUDED.validity_days,
        features = EXCLUDED.features,
        is_active = EXCLUDED.is_active,
        popular = EXCLUDED.popular,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: "Phone plan saved successfully"
    })
  } catch (error) {
    console.error("Admin eSIM phone plans POST error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save phone plan" },
      { status: 500 }
    )
  }
}

// DELETE - Delete eSIM phone plan
export async function DELETE(request: Request) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing plan ID" },
        { status: 400 }
      )
    }

    await sql`DELETE FROM esim_phone_plans WHERE id = ${id}`

    return NextResponse.json({
      success: true,
      message: "Phone plan deleted successfully"
    })
  } catch (error) {
    console.error("Admin eSIM phone plans DELETE error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete phone plan" },
      { status: 500 }
    )
  }
}
