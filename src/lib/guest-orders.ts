import { sql, sqlUnsafe } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductType =
  | "data_bundle"
  | "airtime"
  | "bill_payment"
  | "esim"
  | "foreign_number";

export type PaymentStatus = "pending" | "success" | "failed" | "abandoned";
export type FulfillmentStatus = "pending" | "processing" | "completed" | "failed";

export interface GuestOrder {
  id: string;
  tracking_number: string;
  paystack_reference: string | null;
  paystack_webhook_data: Record<string, unknown> | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  product_type: ProductType;
  product_details: Record<string, unknown>;
  amount_ghs: number;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  datamart_order_reference: string | null;
  datamart_purchase_id: string | null;
  datamart_order_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestOrderInput {
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  product_type: ProductType;
  product_details: Record<string, unknown>;
  amount_ghs: number;
}

// ─── Tracking Number Generator ───────────────────────────────────────────────

function generateTrackingNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TCG-${date}-${rand}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createGuestOrder(
  input: CreateGuestOrderInput
): Promise<GuestOrder> {
  let trackingNumber = generateTrackingNumber();

  // Ensure uniqueness with up to 5 retries
  for (let i = 0; i < 5; i++) {
    const existing = await sql`
      SELECT id FROM guest_orders WHERE tracking_number = ${trackingNumber} LIMIT 1
    `;
    if (existing.length === 0) break;
    trackingNumber = generateTrackingNumber();
  }

  const rows = await sql`
    INSERT INTO guest_orders (
      tracking_number,
      customer_email,
      customer_name,
      customer_phone,
      product_type,
      product_details,
      amount_ghs
    ) VALUES (
      ${trackingNumber},
      ${input.customer_email},
      ${input.customer_name ?? null},
      ${input.customer_phone ?? null},
      ${input.product_type},
      ${JSON.stringify(input.product_details)}::jsonb,
      ${input.amount_ghs}
    )
    RETURNING *
  `;

  return rows[0] as GuestOrder;
}

export async function getGuestOrderByTracking(
  trackingNumber: string
): Promise<GuestOrder | null> {
  const rows = await sql`
    SELECT * FROM guest_orders WHERE tracking_number = ${trackingNumber} LIMIT 1
  `;
  return (rows[0] as GuestOrder) ?? null;
}

export async function getGuestOrderByPaystackRef(
  paystackReference: string
): Promise<GuestOrder | null> {
  const rows = await sql`
    SELECT * FROM guest_orders WHERE paystack_reference = ${paystackReference} LIMIT 1
  `;
  return (rows[0] as GuestOrder) ?? null;
}

export async function setGuestOrderPaystackRef(
  id: string,
  paystackReference: string
): Promise<void> {
  await sql`
    UPDATE guest_orders
    SET paystack_reference = ${paystackReference},
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateGuestOrderPayment(
  id: string,
  paymentStatus: PaymentStatus,
  webhookData?: Record<string, unknown>
): Promise<void> {
  if (webhookData) {
    await sql`
      UPDATE guest_orders
      SET payment_status = ${paymentStatus},
          paystack_webhook_data = ${JSON.stringify(webhookData)}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE guest_orders
      SET payment_status = ${paymentStatus},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  }
}

export async function updateGuestOrderFulfillment(
  id: string,
  fulfillmentStatus: FulfillmentStatus,
  extra?: {
    datamartOrderReference?: string;
    datamartPurchaseId?: string;
    datamartOrderStatus?: string;
    notes?: string;
  }
): Promise<void> {
  const params: unknown[] = [
    fulfillmentStatus,
    extra?.datamartOrderReference ?? null,
    extra?.datamartPurchaseId ?? null,
    extra?.datamartOrderStatus ?? null,
    extra?.notes ?? null,
    id,
  ];

  await sqlUnsafe(
    `UPDATE guest_orders
     SET fulfillment_status = $1,
         datamart_order_reference = COALESCE($2, datamart_order_reference),
         datamart_purchase_id = COALESCE($3, datamart_purchase_id),
         datamart_order_status = COALESCE($4, datamart_order_status),
         notes = COALESCE($5, notes),
         updated_at = NOW()
     WHERE id = $6`,
    params
  );
}

export async function adminUpdateGuestOrder(
  id: string,
  patch: {
    fulfillment_status?: FulfillmentStatus;
    payment_status?: PaymentStatus;
    notes?: string;
    datamart_order_status?: string;
  }
): Promise<GuestOrder | null> {
  const setClauses: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [];

  if (patch.fulfillment_status !== undefined) {
    params.push(patch.fulfillment_status);
    setClauses.push(`fulfillment_status = $${params.length}`);
  }
  if (patch.payment_status !== undefined) {
    params.push(patch.payment_status);
    setClauses.push(`payment_status = $${params.length}`);
  }
  if (patch.notes !== undefined) {
    params.push(patch.notes);
    setClauses.push(`notes = $${params.length}`);
  }
  if (patch.datamart_order_status !== undefined) {
    params.push(patch.datamart_order_status);
    setClauses.push(`datamart_order_status = $${params.length}`);
  }

  params.push(id);
  const rows = await sqlUnsafe(
    `UPDATE guest_orders SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );

  return (rows[0] as GuestOrder) ?? null;
}

export interface ListGuestOrdersOptions {
  page?: number;
  limit?: number;
  payment_status?: string;
  fulfillment_status?: string;
  product_type?: string;
  search?: string;
}

export interface ListGuestOrdersResult {
  orders: GuestOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listGuestOrders(
  opts: ListGuestOrdersOptions = {}
): Promise<ListGuestOrdersResult> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (opts.payment_status) {
    params.push(opts.payment_status);
    whereClauses.push(`payment_status = $${params.length}`);
  }
  if (opts.fulfillment_status) {
    params.push(opts.fulfillment_status);
    whereClauses.push(`fulfillment_status = $${params.length}`);
  }
  if (opts.product_type) {
    params.push(opts.product_type);
    whereClauses.push(`product_type = $${params.length}`);
  }
  if (opts.search) {
    const term = `%${opts.search.toLowerCase()}%`;
    params.push(term);
    whereClauses.push(
      `(lower(customer_email) LIKE $${params.length} OR lower(customer_name) LIKE $${params.length} OR lower(tracking_number) LIKE $${params.length})`
    );
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countRows = await sqlUnsafe(
    `SELECT COUNT(*) as total FROM guest_orders ${where}`,
    params
  ) as { total: string }[];

  const total = parseInt(countRows[0]?.total ?? "0", 10);

  params.push(limit);
  params.push(offset);
  const rows = await sqlUnsafe(
    `SELECT * FROM guest_orders ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    orders: rows as GuestOrder[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getGuestOrderStats(): Promise<{
  total: number;
  paymentPending: number;
  paymentSuccess: number;
  fulfillmentPending: number;
  fulfillmentCompleted: number;
  fulfillmentFailed: number;
  revenueGhs: number;
  todayCount: number;
  todayRevenue: number;
}> {
  const rows = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE payment_status = 'pending') as payment_pending,
      COUNT(*) FILTER (WHERE payment_status = 'success') as payment_success,
      COUNT(*) FILTER (WHERE fulfillment_status = 'pending' AND payment_status = 'success') as fulfillment_pending,
      COUNT(*) FILTER (WHERE fulfillment_status = 'completed') as fulfillment_completed,
      COUNT(*) FILTER (WHERE fulfillment_status = 'failed') as fulfillment_failed,
      COALESCE(SUM(amount_ghs) FILTER (WHERE payment_status = 'success'), 0) as revenue_ghs,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as today_count,
      COALESCE(SUM(amount_ghs) FILTER (WHERE payment_status = 'success' AND created_at >= NOW() - INTERVAL '1 day'), 0) as today_revenue
    FROM guest_orders
  `;

  const r = rows[0] as Record<string, string>;
  return {
    total: parseInt(r.total, 10),
    paymentPending: parseInt(r.payment_pending, 10),
    paymentSuccess: parseInt(r.payment_success, 10),
    fulfillmentPending: parseInt(r.fulfillment_pending, 10),
    fulfillmentCompleted: parseInt(r.fulfillment_completed, 10),
    fulfillmentFailed: parseInt(r.fulfillment_failed, 10),
    revenueGhs: parseFloat(r.revenue_ghs),
    todayCount: parseInt(r.today_count, 10),
    todayRevenue: parseFloat(r.today_revenue),
  };
}
