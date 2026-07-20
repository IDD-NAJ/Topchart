import { sql } from "@/lib/db";

/**
 * Real database queries for guest checkout system
 */

export async function getGuestOrdersStats() {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN fulfillment_status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_orders,
        COALESCE(SUM(CAST(amount_ghs AS NUMERIC)), 0) as total_revenue,
        MAX(created_at) as latest_order
      FROM guest_orders
    `;

    if (result.length === 0) {
      return {
        total_orders: 0,
        paid_orders: 0,
        completed_orders: 0,
        pending_orders: 0,
        total_revenue: 0,
        latest_order: null,
      };
    }

    const row = result[0];
    return {
      total_orders: parseInt(row.total_orders) || 0,
      paid_orders: parseInt(row.paid_orders) || 0,
      completed_orders: parseInt(row.completed_orders) || 0,
      pending_orders: parseInt(row.pending_orders) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
      latest_order: row.latest_order,
    };
  } catch (error) {
    console.error("[DB] Error fetching guest orders stats:", error);
    return {
      total_orders: 0,
      paid_orders: 0,
      completed_orders: 0,
      pending_orders: 0,
      total_revenue: 0,
      latest_order: null,
    };
  }
}

export async function getGuestOrders(
  limit: number = 100,
  offset: number = 0,
  filters?: {
    payment_status?: string;
    fulfillment_status?: string;
    product_type?: string;
  }
) {
  try {
    let query = `
      SELECT 
        id, 
        tracking_number, 
        customer_email, 
        customer_name, 
        customer_phone,
        product_type, 
        product_details, 
        amount_ghs, 
        payment_status,
        fulfillment_status,
        datamart_order_status,
        notes,
        created_at,
        updated_at
      FROM guest_orders
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.payment_status) {
      query += ` AND payment_status = $${params.length + 1}`;
      params.push(filters.payment_status);
    }

    if (filters?.fulfillment_status) {
      query += ` AND fulfillment_status = $${params.length + 1}`;
      params.push(filters.fulfillment_status);
    }

    if (filters?.product_type) {
      query += ` AND product_type = $${params.length + 1}`;
      params.push(filters.product_type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);
    return result.rows || [];
  } catch (error) {
    console.error("[DB] Error fetching guest orders:", error);
    return [];
  }
}

export async function getGuestOrderByTracking(trackingNumber: string) {
  try {
    const result = await sql`
      SELECT *
      FROM guest_orders
      WHERE tracking_number = ${trackingNumber}
      LIMIT 1
    `;

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error fetching guest order by tracking:", error);
    return null;
  }
}

export async function getRevenueMetrics() {
  try {
    const result = await sql`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as orders_count,
        SUM(CAST(amount_ghs AS NUMERIC)) as daily_revenue,
        AVG(CAST(amount_ghs AS NUMERIC)) as avg_order_value
      FROM guest_orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `;

    return result || [];
  } catch (error) {
    console.error("[DB] Error fetching revenue metrics:", error);
    return [];
  }
}

export async function getProductTypeBreakdown() {
  try {
    const result = await sql`
      SELECT 
        product_type,
        COUNT(*) as count,
        SUM(CAST(amount_ghs AS NUMERIC)) as revenue
      FROM guest_orders
      GROUP BY product_type
      ORDER BY count DESC
    `;

    return result || [];
  } catch (error) {
    console.error("[DB] Error fetching product breakdown:", error);
    return [];
  }
}
