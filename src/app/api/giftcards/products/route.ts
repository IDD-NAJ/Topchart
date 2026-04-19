import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch all active gift card products
export async function GET() {
  try {
    const products = await sql`
      SELECT 
        id,
        brand,
        category,
        region,
        denominations,
        image,
        markup_percentage,
        is_active,
        sort_order
      FROM gift_card_products
      WHERE is_active = true
      ORDER BY category ASC, sort_order ASC
    `

    return NextResponse.json({
      success: true,
      data: products.map((p: any) => ({
        id: p.id,
        brand: p.brand,
        category: p.category,
        region: p.region,
        denominations: p.denominations || [],
        image: p.image,
        markupPercentage: parseFloat(p.markup_percentage),
      }))
    })
  } catch (error) {
    console.error("Gift cards API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch gift cards" },
      { status: 500 }
    )
  }
}
