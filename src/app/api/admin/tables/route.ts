import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql, sqlUnsafe } from "@/lib/db"

const ALLOWED_TABLES = [
  "users",
  "auth_sessions",
  "wallets",
  "transactions",
  "payment_intents",
  "payment_events",
  "ledger_accounts",
  "ledger_entries",
  "airtime_purchases",
  "data_bundle_purchases",
  "networks",
  "data_bundles",
  "data_bundle_categories",
  "referrals",
  "referral_rewards",
  "referral_visits",
  "promo_codes",
  "promo_redemptions",
  "tickets",
  "ticket_messages",
  "disputes",
  "admin_users",
  "admin_action_logs",
  "roles",
  "permissions",
  "role_assignments",
  "role_permissions",
  "auth_credentials",
  "esim_orders",
  "proxy_orders",
  "giftcard_orders",
  "bill_payments",
  "verification_numbers",
  "datamart_orders",
  "datamart_bulk_batches",
  "datamart_bulk_order_items",
  "datamart_webhook_logs",
  "datamart_data_packages",
  "homepage_media",
  "bill_providers",
  "bill_provider_config",
  "bill_service_availability",
  "bill_daily_stats",
  "bill_transactions",
  "esim_phone_plans",
  "esim_data_packages",
  "gift_card_products",
  "proxy_pricing",
]

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value
  if (!sessionToken) return false

  const sessions = await sql`
    SELECT u.id, u.role FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `
  if (!sessions.length) return false
  const user = sessions[0] as { id: string; role: string }
  return user.role === "ADMIN"
}

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const table = searchParams.get("table")
  const page = parseInt(searchParams.get("page") || "1", 10)
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100)
  const orderBy = searchParams.get("orderBy") || "id"
  const orderDir = searchParams.get("orderDir") === "asc" ? "ASC" : "DESC"
  const search = searchParams.get("search") || ""
  const searchColumns = (searchParams.get("searchColumns") || "").split(",").filter(Boolean)

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ success: false, error: "Invalid table" }, { status: 400 })
  }

  const safeOrderBy = orderBy.replace(/[^a-zA-Z0-9_]/g, "")
  const offset = (page - 1) * pageSize

  try {
    let whereClause = ""
    const params: unknown[] = []
    
    if (search && searchColumns.length > 0) {
      const conditions = searchColumns.map((col, idx) => {
        const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "")
        params.push(`%${search}%`)
        return `CAST("${safeCol}" AS TEXT) ILIKE $${idx + 1}`
      })
      whereClause = `WHERE ${conditions.join(" OR ")}`
    }

    const countQuery = `SELECT COUNT(*) as count FROM "${table}" ${whereClause}`
    const countResult = await sqlUnsafe(countQuery, params) as any[]
    const totalRows = parseInt(countResult[0]?.count || "0", 10)
    const totalPages = Math.ceil(totalRows / pageSize)

    const dataParams = [...params, pageSize, offset]
    const dataQuery = `
      SELECT * FROM "${table}" 
      ${whereClause}
      ORDER BY "${safeOrderBy}" ${orderDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const data = await sqlUnsafe(dataQuery, dataParams)

    return NextResponse.json({
      success: true,
      data,
      totalRows,
      totalPages,
      page,
      pageSize,
    })
  } catch (error) {
    console.error("Table fetch error:", error)
    const errorMessage = error instanceof Error ? error.message : "Database error"
    if (errorMessage.includes('relation') && errorMessage.includes('Last Names not exist')) {
      return NextResponse.json({
        success: true,
        data: [],
        totalRows: 0,
        totalPages: 0,
        page,
        pageSize,
      })
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { table, data } = body

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ success: false, error: "Invalid table" }, { status: 400 })
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 })
    }

    const keys = Object.keys(data).filter(k => {
      const val = data[k]
      // For id, only include if it has a valid non-null value (let DB auto-generate otherwise)
      if (k === "id") return val && val !== null && val !== undefined && val !== ""
      // For other keys, filter out null/undefined
      return val !== null && val !== undefined
    })
    
    if (keys.length === 0) {
      return NextResponse.json({ success: false, error: "No valid data provided" }, { status: 400 })
    }
    
    const values = keys.map(k => data[k])
    
    const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, "")}"`).join(", ")
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
    
    const query = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`
    const result = await sqlUnsafe(query, values)

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Table insert error:", error)
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { table, id, ids, data } = body

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ success: false, error: "Invalid table" }, { status: 400 })
    }

    if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ success: false, error: "ID or IDs required" }, { status: 400 })
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 })
    }

    const keys = Object.keys(data).filter(k => k !== "id")
    const values = keys.map(k => data[k])
    
    const setClause = keys.map((k, i) => `"${k.replace(/[^a-zA-Z0-9_]/g, "")}" = $${i + 1}`).join(", ")
    
    // Handle batch update (ids array)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Use ANY with array for batch update
      const batchValues = [...values, ids]
      const query = `UPDATE "${table}" SET ${setClause} WHERE id::text = ANY($${values.length + 1}::text[]) RETURNING *`
      const result = await sqlUnsafe(query, batchValues)
      return NextResponse.json({ success: true, data: result, updated: result.length })
    }
    
    // Handle single update (id)
    values.push(id)
    const query = `UPDATE "${table}" SET ${setClause} WHERE id = $${values.length} RETURNING *`
    const result = await sqlUnsafe(query, values)

    if (!result.length) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Table update error:", error)
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const table = searchParams.get("table")
    const id = searchParams.get("id")
    const idsParam = searchParams.get("ids")

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ success: false, error: "Invalid table" }, { status: 400 })
    }

    // Handle batch delete (ids array)
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ success: false, error: "IDs required" }, { status: 400 })
      }
      const query = `DELETE FROM "${table}" WHERE id::text = ANY($1::text[]) RETURNING id`
      const result = await sqlUnsafe(query, [ids])
      return NextResponse.json({ success: true, deleted: result.length, ids: result.map((r: any) => r.id) })
    }

    // Handle single delete (id)
    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    }

    const query = `DELETE FROM "${table}" WHERE id = $1 RETURNING id`
    const result = await sqlUnsafe(query, [id])

    if (!result.length) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: id })
  } catch (error) {
    console.error("Table delete error:", error)
    
    // Check for foreign key constraint violations
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorCode = (error as any)?.code
    
    console.error("Error details:", { message: errorMessage, code: errorCode })
    
    const isForeignKeyError = 
      errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("violates foreign key") ||
      errorMessage.includes("is still referenced from table") ||
      errorMessage.includes("update or delete on table") ||
      errorCode === "23503" // PostgreSQL foreign_key_violation error code
    
    if (isForeignKeyError) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete: This record is referenced by other records (e.g., data bundles exist for this category). Please remove or reassign dependent records first." 
      }, { status: 409 })
    }
    
    return NextResponse.json({ success: false, error: `Database error: ${errorMessage.slice(0, 100)}` }, { status: 500 })
  }
}
