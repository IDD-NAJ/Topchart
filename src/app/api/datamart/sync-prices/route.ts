import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getDataPackages, getNetworkDisplayName } from '@/lib/datamart'
import type { DatamartNetworkCode } from '@/lib/datamart'

const NETWORK_CODES: DatamartNetworkCode[] = ['YELLO', 'TELECEL', 'AT_PREMIUM']

const DATAMART_TO_DB_NETWORK: Record<string, string> = {
  YELLO: 'MTN',
  TELECEL: 'Telecel',
  AT_PREMIUM: 'AirtelTigo',
  at: 'AirtelTigo',
}

const NETWORK_NAMES_TO_UUID: Record<string, string> = {
  MTN: 'a1b2c3d4-0001-0000-0000-000000000001',
  TELECEL: 'a1b2c3d4-0002-0000-0000-000000000002',
  AIRTELTIGO: 'a1b2c3d4-0003-0000-0000-000000000003',
}

export async function POST(request: NextRequest) {
  try {
    console.log('[DatamartSync] Starting price sync from datamart API')

    // Get network UUID map from database
    let networkMap = NETWORK_NAMES_TO_UUID
    try {
      const rows = await sql`SELECT id, name FROM networks` as Array<{ id: string; name: string }>
      networkMap = {}
      for (const row of rows) {
        const name = String(row.name || '').toUpperCase()
        networkMap[name] = row.id
      }
    } catch (err) {
      console.warn('[DatamartSync] Failed to fetch network map, using defaults')
    }

    let totalUpdated = 0
    let totalCreated = 0
    let totalErrors = 0

    // Fetch packages for each network
    for (const networkCode of NETWORK_CODES) {
      try {
        console.log(`[DatamartSync] Fetching ${networkCode} packages from datamart`)

        const packageResponse = await getDataPackages(networkCode)
        const packages = packageResponse.data
        if (!packageResponse.success || !packages?.length) {
          console.warn(
            `[DatamartSync] No packages found for ${networkCode}: ${packageResponse.error || 'empty response'}`
          )
          continue
        }

        const dbNetworkName = DATAMART_TO_DB_NETWORK[networkCode] || networkCode
        const networkId = networkMap[dbNetworkName.toUpperCase()]

        if (!networkId) {
          console.error(`[DatamartSync] Network ID not found for ${dbNetworkName}`)
          totalErrors++
          continue
        }

        // Process each package
        for (const pkg of packages) {
          try {
            const price = parseFloat(pkg.price)
            const sizeMb = parseInt(pkg.mb)

            if (!Number.isFinite(price) || !Number.isFinite(sizeMb)) {
              console.warn(`[DatamartSync] Invalid price or size for ${pkg.capacity}`)
              continue
            }

            // Upsert bundle into database
            await sql`
              INSERT INTO data_bundles (
                network_id,
                name,
                "sizeMb",
                price,
                "isFeatured",
                "isActive",
                "isPopular",
                "datamart_capacity",
                created_at,
                updated_at
              ) VALUES (
                ${networkId},
                ${pkg.capacity},
                ${sizeMb},
                ${price},
                true,
                true,
                false,
                ${pkg.capacity},
                NOW(),
                NOW()
              )
              ON CONFLICT (network_id, "datamart_capacity") DO UPDATE SET
                name = EXCLUDED.name,
                "sizeMb" = EXCLUDED."sizeMb",
                price = EXCLUDED.price,
                "isActive" = true,
                updated_at = NOW()
            `

            totalUpdated++
          } catch (err) {
            console.error(`[DatamartSync] Error upserting package ${pkg.capacity}:`, err)
            totalErrors++
          }
        }
      } catch (err) {
        console.error(`[DatamartSync] Error fetching packages for ${networkCode}:`, err)
        totalErrors++
      }
    }

    console.log(`[DatamartSync] Price sync completed: ${totalUpdated} updated, ${totalCreated} created, ${totalErrors} errors`)

    return NextResponse.json({
      success: true,
      message: 'Price sync completed',
      stats: {
        updated: totalUpdated,
        created: totalCreated,
        errors: totalErrors,
      },
    })
  } catch (error) {
    console.error('[DatamartSync] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync prices',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
