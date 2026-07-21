import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log('[DatamartSync] Starting comprehensive datamart sync')

    // Verify API key from request header (for webhook security)
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.DATAMART_SYNC_SECRET_KEY || process.env.DATAMART_API_KEY
    
    if (!expectedKey || !authHeader || authHeader !== `Bearer ${expectedKey}`) {
      console.warn('[DatamartSync] Unauthorized sync attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Sync bundle prices
    console.log('[DatamartSync] Step 1: Syncing bundle prices')
    let pricesSyncResult = { success: false, stats: { updated: 0, created: 0, errors: 0 } }
    try {
      const priceResponse = await fetch(`${baseUrl}/api/datamart/sync-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const pricesData = await priceResponse.json()
      if (pricesData.success) {
        pricesSyncResult = pricesData
      }
    } catch (err) {
      console.error('[DatamartSync] Error syncing prices:', err)
    }

    // Sync delivery status
    console.log('[DatamartSync] Step 2: Syncing delivery status')
    let deliverySyncResult = { success: false, stats: { checked: 0, updated: 0, completed: 0, failed: 0 } }
    try {
      const deliveryResponse = await fetch(`${baseUrl}/api/datamart/sync-delivery-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const deliveryData = await deliveryResponse.json()
      if (deliveryData.success) {
        deliverySyncResult = deliveryData
      }
    } catch (err) {
      console.error('[DatamartSync] Error syncing delivery status:', err)
    }

    console.log('[DatamartSync] Comprehensive sync completed')

    return NextResponse.json({
      success: pricesSyncResult.success || deliverySyncResult.success,
      timestamp: new Date().toISOString(),
      results: {
        prices: pricesSyncResult,
        delivery: deliverySyncResult,
      },
    })
  } catch (error) {
    console.error('[DatamartSync] Unexpected error in sync:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete datamart sync',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check and manual trigger
export async function GET(request: NextRequest) {
  try {
    const lastSync = await getLastSyncTime()
    return NextResponse.json({
      status: 'healthy',
      lastSync,
      message: 'Use POST to trigger sync. Requires DATAMART_SYNC_SECRET_KEY header.',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Datamart sync service error' },
      { status: 500 }
    )
  }
}

async function getLastSyncTime(): Promise<string | null> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/datamart/sync-status', {
      method: 'GET',
    })
    const data = await response.json()
    return data.lastSync || null
  } catch {
    return null
  }
}
