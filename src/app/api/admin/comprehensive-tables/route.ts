export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { sqlUnsafe } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Comprehensive endpoint to fetch from any of the 93 database tables
 * Used as fallback for tables without dedicated admin pages
 */

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const searchParams = request.nextUrl.searchParams
    const table = searchParams.get('table') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || ''

    // Whitelist of tables accessible via this endpoint
    const allowedTables = [
      'giftcard_orders', 'promo_codes', 'promo_redemptions', 'proxy_orders', 'proxy_pricing',
      'payment_events', 'marketing_assets', 'kyc_reviews', 'favorites', 'permissions', 'roles',
      'datamart_bulk_batches', 'datamart_bulk_order_items', 'smspva_availability', 'custom_form_fields',
      'datamart_webhook_logs', 'rate_limit_violations'
    ]

    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ success: false, error: 'Invalid or missing table parameter' }, { status: 400 })
    }

    // Build dynamic query with basic security
    let query = `SELECT * FROM "${table}"` 
    const params: any[] = []

    if (search && ['name', 'title', 'code', 'description'].includes(searchParams.get('searchField') || 'name')) {
      const field = searchParams.get('searchField') || 'name'
      query += ` WHERE "${field}" ILIKE $${params.length + 1}`
      params.push(`%${search}%`)
    }

    if (filter) {
      const filterField = searchParams.get('filterField') || 'status'
      query += params.length > 0 ? ' AND ' : ' WHERE '
      query += `"${filterField}" = $${params.length + 1}`
      params.push(filter)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await sqlUnsafe(query, params)
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM "${table}"`
    const countParams: any[] = []
    if (params.length > 2) {
      // Reuse filter from main query
      countQuery = query.split('ORDER BY')[0].replace(`LIMIT $${params.length - 1} OFFSET $${params.length}`, '')
      // Already has WHERE clause
    }
    
    const countResult = await sqlUnsafe(countQuery, countParams)

    return NextResponse.json({
      success: true,
      table,
      data: Array.isArray(result) ? result : result.rows || [],
      total: parseInt((Array.isArray(countResult) ? countResult[0] : countResult.rows?.[0])?.count || 0),
      limit,
      offset,
    })
  } catch (error) {
    console.error('Comprehensive table GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch table data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { table, data } = body

    if (!table || !data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'table and data object required' }, { status: 400 })
    }

    const columns = Object.keys(data).filter(k => k !== 'id' && data[k] != null)
    const values = columns.map(col => data[col])
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const id = crypto.randomUUID()

    const query = `INSERT INTO "${table}" (id, ${columns.map(c => `"${c}"`).join(', ')}, created_at, updated_at)
                   VALUES ($${columns.length + 1}, ${placeholders}, NOW(), NOW())`

    await sqlUnsafe(query, [id, ...values])

    return NextResponse.json({ success: true, message: 'Record created', id })
  } catch (error) {
    console.error('Comprehensive table POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create record' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { table, id, data } = body

    if (!table || !id || !data) {
      return NextResponse.json({ success: false, error: 'table, id, and data required' }, { status: 400 })
    }

    const updates = Object.entries(data)
      .filter(([_, v]) => v != null)
      .map(([k, v], i) => `"${k}" = $${i + 1}`)
      .join(', ')

    const query = `UPDATE "${table}" SET ${updates}, updated_at = NOW() WHERE id = $${Object.keys(data).length + 1}`
    const values = [...Object.values(data).filter(v => v != null), id]

    await sqlUnsafe(query, values)

    return NextResponse.json({ success: true, message: 'Record updated' })
  } catch (error) {
    console.error('Comprehensive table PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const { table, id } = await request.json()
    if (!table || !id) return NextResponse.json({ success: false, error: 'table and id required' }, { status: 400 })

    await sqlUnsafe(`DELETE FROM "${table}" WHERE id = $1`, [id])
    return NextResponse.json({ success: true, message: 'Record deleted' })
  } catch (error) {
    console.error('Comprehensive table DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete record' }, { status: 500 })
  }
}
