import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getDatamartConfig } from '@/lib/datamart'
import { providerRequest } from '@/lib/providers/http-client'

interface DatamartOrderStatus {
  orderId: string
  reference: string
  phoneNumber: string
  network: string
  capacity: number
  price: number
  orderStatus: 'pending' | 'waiting' | 'processing' | 'completed' | 'failed' | 'refunded'
  transactionReference: string
  deliveryTime?: string
  errorCode?: string
  errorMessage?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[DeliverySync] Starting delivery status sync from datamart API')

    const config = getDatamartConfig()
    if (!config.apiKey) {
      console.warn('[DeliverySync] DATAMART_API_KEY not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Datamart API key not configured',
        },
        { status: 400 }
      )
    }

    // Get all pending/processing datamart orders
    const pendingOrders = await sql`
      SELECT id, phone_number, network, capacity, order_reference, transaction_reference
      FROM datamart_orders
      WHERE status IN ('pending', 'processing', 'waiting')
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 500
    ` as Array<{
      id: string
      phone_number: string
      network: string
      capacity: string
      order_reference: string
      transaction_reference: string
    }>

    console.log(`[DeliverySync] Found ${pendingOrders.length} pending orders to check`)

    let totalUpdated = 0
    let totalCompleted = 0
    let totalFailed = 0

    // Check status for each pending order
    for (const order of pendingOrders) {
      try {
        // Query datamart API for order status
        const orderStatus = await getOrderStatusFromDatamart(
          config.baseUrl,
          config.apiKey,
          order.order_reference,
          order.phone_number
        )

        if (!orderStatus) {
          console.warn(`[DeliverySync] No status found for order ${order.order_reference}`)
          continue
        }

        // Update datamart_orders table
        const currentStatus = await sql`
          SELECT status FROM datamart_orders WHERE id = ${order.id}
        ` as Array<{ status: string }>

        const oldStatus = currentStatus[0]?.status

        if (oldStatus !== orderStatus.orderStatus) {
          await sql`
            UPDATE datamart_orders
            SET 
              status = ${orderStatus.orderStatus},
              error_code = ${orderStatus.errorCode || null},
              error_message = ${orderStatus.errorMessage || null},
              updated_at = NOW(),
              metadata = jsonb_set(metadata, '{deliveryTime}', to_jsonb(${orderStatus.deliveryTime || null}::text))
            WHERE id = ${order.id}
          `

          totalUpdated++

          if (orderStatus.orderStatus === 'completed') {
            totalCompleted++
          } else if (orderStatus.orderStatus === 'failed' || orderStatus.orderStatus === 'refunded') {
            totalFailed++
          }

          console.log(`[DeliverySync] Updated order ${order.order_reference}: ${oldStatus} -> ${orderStatus.orderStatus}`)
        }
      } catch (err) {
        console.error(`[DeliverySync] Error checking status for order ${order.order_reference}:`, err)
      }
    }

    console.log(
      `[DeliverySync] Delivery sync completed: ${totalUpdated} updated, ${totalCompleted} completed, ${totalFailed} failed`
    )

    return NextResponse.json({
      success: true,
      message: 'Delivery status sync completed',
      stats: {
        checked: pendingOrders.length,
        updated: totalUpdated,
        completed: totalCompleted,
        failed: totalFailed,
      },
    })
  } catch (error) {
    console.error('[DeliverySync] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync delivery status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function getOrderStatusFromDatamart(
  baseUrl: string,
  apiKey: string,
  orderReference: string,
  phoneNumber: string
): Promise<DatamartOrderStatus | null> {
  try {
    const response = await providerRequest({
      url: `${baseUrl}/api/v1/order/status`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: {
        orderReference,
        phoneNumber,
      },
      timeout: 10000,
    })

    if (response.status !== 200) {
      console.warn(`[DeliverySync] Datamart API returned status ${response.status}`)
      return null
    }

    const data = response.data as any
    if (!data || data.status === 'error') {
      console.warn(`[DeliverySync] Datamart API error: ${data?.message}`)
      return null
    }

    // Map datamart response to our interface
    const orderData = data.data || {}
    return {
      orderId: orderData.orderId || orderReference,
      reference: orderData.reference || orderReference,
      phoneNumber: orderData.phoneNumber || phoneNumber,
      network: orderData.network || '',
      capacity: orderData.capacity || 0,
      price: orderData.price || 0,
      orderStatus: (orderData.orderStatus || 'pending') as DatamartOrderStatus['orderStatus'],
      transactionReference: orderData.transactionReference || '',
      deliveryTime: orderData.deliveryTime,
      errorCode: orderData.errorCode,
      errorMessage: orderData.errorMessage,
    }
  } catch (error) {
    console.error('[DeliverySync] Error querying datamart API:', error)
    return null
  }
}
