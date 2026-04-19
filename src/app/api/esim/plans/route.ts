import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch all active eSIM phone plans
export async function GET() {
  try {
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
        sort_order
      FROM esim_phone_plans
      WHERE is_active = true
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
        popular: p.popular,
      }))
    })
  } catch (error) {
    console.error("eSIM plans API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch phone plans" },
      { status: 500 }
    )
  }
}
