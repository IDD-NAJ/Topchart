export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { sqlUnsafe } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = 'SELECT * FROM esim_products WHERE 1=1'
    const params: any[] = []

    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')'
      params.push(`%${search}%`)
    }
    if (country) {
      query += ' AND country = $' + (params.length + 1)
      params.push(country)
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(limit, offset)

    const result = await sqlUnsafe(query, params)
    const countResult = await sqlUnsafe('SELECT COUNT(*) FROM esim_products WHERE 1=1' + (search ? ' AND name ILIKE $1' : '') + (country ? ' AND country = $' + (search ? '2' : '1') : ''), params.slice(0, -2))

    return NextResponse.json({
      success: true,
      data: result as unknown[],
      total: parseInt((countResult[0] as any)?.count || 0),
      limit,
      offset,
    })
  } catch (error) {
    console.error('Admin eSIM GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch eSIM products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { name, country, region, data_volume, validity_days, price, description, is_active } = body

    if (!name || !country || !data_volume || price == null) {
      return NextResponse.json({ success: false, error: 'name, country, data_volume, price required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await sqlUnsafe(
      `INSERT INTO esim_products (id, name, country, region, data_volume, validity_days, price, description, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [id, name, country, region || null, data_volume, validity_days || null, Number(price), description || null, is_active ?? true]
    )

    return NextResponse.json({ success: true, message: 'eSIM product created', id })
  } catch (error) {
    console.error('Admin eSIM POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create eSIM product' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { id, name, country, region, data_volume, validity_days, price, description, is_active } = body

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await sqlUnsafe(
      `UPDATE esim_products SET name = COALESCE($2, name), country = COALESCE($3, country), region = COALESCE($4, region), 
        data_volume = COALESCE($5, data_volume), validity_days = COALESCE($6, validity_days), price = COALESCE($7, price),
        description = COALESCE($8, description), is_active = COALESCE($9, is_active), updated_at = NOW()
       WHERE id = $1`,
      [id, name, country, region, data_volume, validity_days, price ? Number(price) : null, description, is_active]
    )

    return NextResponse.json({ success: true, message: 'eSIM product updated' })
  } catch (error) {
    console.error('Admin eSIM PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update eSIM product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await sqlUnsafe('DELETE FROM esim_products WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'eSIM product deleted' })
  } catch (error) {
    console.error('Admin eSIM DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete eSIM product' }, { status: 500 })
  }
}
