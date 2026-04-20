import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const providers = await sql`
      SELECT 
        id,
        name,
        category,
        icon,
        color,
        account_label,
        account_placeholder,
        min_amount,
        max_amount,
        is_active,
        sort_order
      FROM bill_providers
      WHERE is_active = true
      ORDER BY category ASC, sort_order ASC
    `

    return NextResponse.json({
      success: true,
      data: providers.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        icon: p.icon,
        color: p.color,
        accountLabel: p.account_label,
        accountPlaceholder: p.account_placeholder,
        minAmount: parseFloat(p.min_amount),
        maxAmount: parseFloat(p.max_amount),
      }))
    })
  } catch (error) {
    console.error("Bill providers API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch bill providers" },
      { status: 500 }
    )
  }
}
