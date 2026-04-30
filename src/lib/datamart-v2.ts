import crypto from "crypto";
import { getDatamartEnv } from "@/lib/env";
import { sql, sqlUnsafe, withTransaction } from "@/lib/db";
import { logger } from "@/lib/logger";

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 750;
export const DATA_PACKAGE_TTL_MS = 10 * 60 * 1000; // 10 minutes within the 5–15 minute budget

export type DatamartNetworkCode = "YELLO" | "TELECEL" | "AT_PREMIUM";

export interface NormalizedDataPackage {
  network: DatamartNetworkCode;
  capacity: string;
  mb: number;
  price: number;
}

export interface DatamartPurchaseSuccess {
  purchaseId: string;
  orderReference: string;
  transactionReference: string;
  price: number;
  balanceBefore: number;
  balanceAfter: number;
  orderStatus: "pending" | "waiting" | "processing" | "completed" | "failed" | "refunded";
  processingMethod: string;
}

export interface DatamartBulkSummary {
  total: number;
  successful: number;
  failed: number;
  totalCharged: number;
  shortfall?: number;
  remainingBalance?: number;
}

export interface DatamartBulkResultItem {
  ref?: string;
  phoneNumber: string;
  network: DatamartNetworkCode;
  capacity: string;
  price: number;
  status: string;
  purchaseId?: string;
  orderReference?: string;
  transactionReference?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export interface DatamartOrderStatusPayload {
  orderStatus: "pending" | "waiting" | "processing" | "completed" | "failed" | "refunded";
  purchaseId?: string;
  orderReference: string;
  transactionReference?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  price?: number;
  processingMethod?: string;
  updatedAt?: string;
}

export interface DatamartDeliveryTrackerPayload {
  stats: {
    delivered: number;
    pending: number;
    failed: number;
  };
  lastDelivered?: Record<string, unknown> | null;
  checkingNow?: Record<string, unknown> | null;
  yourOrders?: Record<string, unknown> | null;
  message?: string;
}

interface DatamartApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  raw?: unknown;
  code?: string;
}

interface CachedPackageRow {
  network: string;
  capacity: string;
  mb: number;
  price: string | number;
  fetched_at: string;
}

const NETWORK_CODES: Record<string, DatamartNetworkCode> = {
  yello: "YELLO",
  mtn: "YELLO",
  mtngh: "YELLO",
  telecel: "TELECEL",
  vodafone: "TELECEL",
  voda: "TELECEL",
  at: "AT_PREMIUM",
  atpremium: "AT_PREMIUM",
  airteltigo: "AT_PREMIUM",
  airtel: "AT_PREMIUM",
  tigo: "AT_PREMIUM",
};

function normalizeDatamartBaseUrl(raw?: string): string {
  const fallback = "https://api.datamartgh.shop";
  const desiredPath = "/api/developer";
  const candidate = raw?.trim() || fallback;
  try {
    const parsed = new URL(candidate);
    const normalizedPath = parsed.pathname.replace(/\/$/, "");
    if (!normalizedPath.includes("/api")) {
      parsed.pathname = desiredPath;
    } else if (!normalizedPath.includes("/api/developer")) {
      parsed.pathname = `${normalizedPath}${normalizedPath.endsWith("/api") ? "/developer" : ""}`;
      if (!parsed.pathname.includes("/api/developer")) {
        parsed.pathname = desiredPath;
      }
    }
    if (!parsed.pathname.includes("/api/developer")) {
      parsed.pathname = desiredPath;
    }
    return parsed.origin + parsed.pathname;
  } catch (error) {
    logger.warn({ message: "Invalid DATAMART_BASE_URL provided, falling back", error: error instanceof Error ? error.message : error });
    return `${fallback}${desiredPath}`;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  idempotencyKey?: string;
  timeoutMs?: number;
  retries?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function datamartRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<DatamartApiResult<T>> {
  const { DATAMART_API_KEY, DATAMART_BASE_URL } = getDatamartEnv();
  const baseUrl = normalizeDatamartBaseUrl(DATAMART_BASE_URL);
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? MAX_RETRIES;

  if (!DATAMART_API_KEY) {
    return { ok: false, status: 401, message: "DATAMART_API_KEY is not configured", code: "CONFIG" };
  }

  const headers: Record<string, string> = {
    "X-API-Key": DATAMART_API_KEY,
    "Content-Type": "application/json",
  };

  if (options.idempotencyKey) {
    headers["X-Idempotency-Key"] = options.idempotencyKey;
  }

  const bodyPayload = options.body ? JSON.stringify(options.body) : undefined;
  let lastError: DatamartApiResult<T> | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${baseUrl}${endpoint}`;

    try {
      logger.info({ message: `[DataMart] Request`, method, endpoint, attempt, idempotencyKey: options.idempotencyKey });
      const response = await fetch(url, {
        method,
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const status = response.status;
      const text = await response.text();
      let json: unknown = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch (error) {
          logger.error({ message: "[DataMart] Failed to parse JSON response", endpoint, status, error });
        }
      }

      const payload = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
      const message = typeof payload.message === "string" ? payload.message : undefined;
      const statusField = typeof payload.status === "string" ? payload.status : undefined;

      if (!response.ok) {
        const result: DatamartApiResult<T> = {
          ok: false,
          status,
          data: undefined,
          message: message || `HTTP ${status}`,
          raw: payload,
          code: typeof payload.code === "string" ? payload.code : undefined,
        };

        if (status === 409) {
          logger.warn({ message: "[DataMart] Request in progress", endpoint, idempotencyKey: options.idempotencyKey });
          return { ...result, code: result.code || "REQUEST_IN_PROGRESS" };
        }

        if (status >= 500 || status === 429) {
          lastError = result;
          if (attempt < retries) {
            const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 250, 5000);
            logger.warn({ message: "[DataMart] Retryable error", endpoint, status, delay });
            await sleep(delay);
            continue;
          }
        }

        logger.error({ message: "[DataMart] Request failed", endpoint, status, payload, idempotencyKey: options.idempotencyKey });
        return result;
      }

      if (statusField === "error") {
        const result: DatamartApiResult<T> = {
          ok: false,
          status,
          message: message || "Provider returned error state",
          raw: payload,
        };
        return result;
      }

      return {
        ok: true,
        status,
        data: (payload.data as T) ?? (payload as unknown as T),
        raw: payload,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error({ message: "[DataMart] Network error", endpoint, attempt, error: error instanceof Error ? error.message : error });
      lastError = {
        ok: false,
        status: 0,
        message: error instanceof Error ? error.message : "Network error",
      };
      if (attempt < retries) {
        const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 250, 5000);
        await sleep(delay);
        continue;
      }
    }
  }

  return lastError ?? { ok: false, status: 0, message: "Unknown DataMart error" };
}

export function resolveNetworkCode(input: string): DatamartNetworkCode {
  const cleaned = input.trim().toLowerCase();
  if (NETWORK_CODES[cleaned]) return NETWORK_CODES[cleaned];
  const upper = input.trim().toUpperCase();
  if (upper === "YELLO" || upper === "TELECEL" || upper === "AT_PREMIUM") {
    return upper as DatamartNetworkCode;
  }
  throw new Error(`Unsupported network code: ${input}`);
}

export function isValidGhanaPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return true;
  if (digits.length === 10 && digits.startsWith("0")) return true;
  return false;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return `+233${digits}`;
}

function toLocalGhanaFormat(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits.startsWith("0") ? digits : `0${digits}`;
}

function parseCapacityToMb(capacity: string): number {
  const value = capacity.trim().toUpperCase();
  const match = value.match(/([0-9]+(?:\.[0-9]+)?)(\s*)(TB|GB|MB|KB)/);
  if (!match) {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? Math.round(numeric) : 0;
  }
  const amount = parseFloat(match[1]);
  const unit = match[3];
  if (unit === "TB") return Math.round(amount * 1024 * 1024);
  if (unit === "GB") return Math.round(amount * 1024);
  if (unit === "MB") return Math.round(amount);
  if (unit === "KB") return Math.round(amount / 1024);
  return Math.round(amount);
}

async function readCachedPackages(network?: DatamartNetworkCode): Promise<{ packages: NormalizedDataPackage[]; fresh: boolean; fetchedAt?: Date }> {
  const rows = (await (network
    ? sqlUnsafe(
        `SELECT network, capacity, mb, price, fetched_at FROM datamart_data_packages WHERE network = $1 ORDER BY price ASC`,
        [network]
      )
    : sqlUnsafe(`SELECT network, capacity, mb, price, fetched_at FROM datamart_data_packages ORDER BY network, price ASC`))) as CachedPackageRow[];

  if (!rows || rows.length === 0) {
    return { packages: [], fresh: false };
  }

  const fetchedAt = rows.reduce<Date | undefined>((acc, row) => {
    const date = new Date(row.fetched_at);
    if (!acc || date < acc) return date;
    return acc;
  }, undefined);

  const packages: NormalizedDataPackage[] = rows.map((row) => ({
    network: resolveNetworkCode(row.network),
    capacity: row.capacity,
    mb: Number(row.mb),
    price: typeof row.price === "string" ? Number(row.price) : Number(row.price),
  }));

  const fresh = fetchedAt ? Date.now() - fetchedAt.getTime() < DATA_PACKAGE_TTL_MS : false;

  return { packages, fresh, fetchedAt };
}

async function persistPackages(packages: NormalizedDataPackage[]): Promise<void> {
  if (packages.length === 0) return;

  const networks = Array.from(new Set(packages.map((pkg) => pkg.network)));

  await withTransaction(async (query) => {
    if (networks.length === 1) {
      await query(`DELETE FROM datamart_data_packages WHERE network = $1`, [networks[0]]);
    } else {
      await query(`DELETE FROM datamart_data_packages WHERE network = ANY($1::text[])`, [networks]);
    }

    for (const pkg of packages) {
      await query(
        `INSERT INTO datamart_data_packages (id, network, capacity, mb, price, fetched_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
         ON CONFLICT (network, capacity)
         DO UPDATE SET mb = EXCLUDED.mb, price = EXCLUDED.price, fetched_at = NOW()`,
        [pkg.network, pkg.capacity, pkg.mb, pkg.price]
      );
    }
  });
}

export async function fetchAndCachePackages(network?: DatamartNetworkCode): Promise<NormalizedDataPackage[]> {
  const endpoint = network ? `/data-packages?network=${encodeURIComponent(network)}` : `/data-packages`;
  const result = await datamartRequest<Array<Record<string, unknown>>>(endpoint, { method: "GET", retries: 2 });
  if (!result.ok || !Array.isArray(result.data)) {
    throw new Error(result.message || "Failed to fetch data packages from DataMart");
  }

  const packages = result.data
    .map((pkg) => {
      const networkRaw = typeof pkg.network === "string" ? pkg.network : network || "";
      const capacity = typeof pkg.capacity === "string" ? pkg.capacity : String(pkg.capacity ?? "");
      const priceRaw = typeof pkg.price === "number" ? pkg.price : Number(pkg.price ?? 0);

      try {
        const resolvedNetwork = resolveNetworkCode(networkRaw);
        const mb = parseCapacityToMb(capacity);
        if (!Number.isFinite(priceRaw) || priceRaw <= 0 || !mb) return null;
        return {
          network: resolvedNetwork,
          capacity,
          mb,
          price: Number(priceRaw),
        } satisfies NormalizedDataPackage;
      } catch (error) {
        logger.warn({ message: "[DataMart] Skipping invalid package", network: networkRaw, capacity, error });
        return null;
      }
    })
    .filter(Boolean) as NormalizedDataPackage[];

  await persistPackages(packages);
  return packages;
}

export async function getPackages(options: { network?: DatamartNetworkCode; forceRefresh?: boolean } = {}): Promise<{ packages: NormalizedDataPackage[]; fromCache: boolean; fetchedAt?: Date }> {
  const { network, forceRefresh } = options;
  const cached = await readCachedPackages(network);

  if (!forceRefresh && cached.packages.length > 0 && cached.fresh) {
    return { packages: cached.packages, fromCache: true, fetchedAt: cached.fetchedAt };
  }

  try {
    const packages = await fetchAndCachePackages(network);
    return { packages, fromCache: false, fetchedAt: new Date() };
  } catch (error) {
    if (cached.packages.length > 0) {
      logger.warn({ message: "[DataMart] Falling back to cached packages", error });
      return { packages: cached.packages, fromCache: true, fetchedAt: cached.fetchedAt };
    }
    throw error;
  }
}

export async function createDatamartOrder(params: {
  phoneNumber: string;
  network: DatamartNetworkCode;
  capacity: string;
  gateway?: string;
  idempotencyKey?: string;
  userId?: string;
  price?: number;
}): Promise<{ id: string; idempotencyKey: string; price: number }> {
  const idempotencyKey = params.idempotencyKey || crypto.randomUUID();
  const gateway = params.gateway ?? "wallet";
  const { packages } = await getPackages({ network: params.network });
  const match = packages.find((pkg) => pkg.capacity === params.capacity);
  if (!match) {
    throw new Error(`Capacity ${params.capacity} is not available for ${params.network}`);
  }

  const price = params.price ?? match.price;

  let row: any;
  try {
    [row] = await sql`
      INSERT INTO datamart_orders (
        phone_number,
        network,
        capacity,
        price,
        gateway,
        status,
        idempotency_key,
        user_id,
        metadata
      ) VALUES (
        ${toE164(params.phoneNumber)},
        ${params.network},
        ${params.capacity},
        ${price},
        ${gateway},
        'pending',
        ${idempotencyKey},
        ${params.userId || null},
        ${JSON.stringify({ attempts: 0 })}::jsonb
      )
      RETURNING id
    `;
  } catch (err: any) {
    if (err?.message?.includes("user_id")) {
      [row] = await sql`
        INSERT INTO datamart_orders (
          phone_number,
          network,
          capacity,
          price,
          gateway,
          status,
          idempotency_key,
          metadata
        ) VALUES (
          ${toE164(params.phoneNumber)},
          ${params.network},
          ${params.capacity},
          ${price},
          ${gateway},
          'pending',
          ${idempotencyKey},
          ${JSON.stringify({ attempts: 0 })}::jsonb
        )
        RETURNING id
      `;
    } else {
      throw err;
    }
  }

  return { id: String(row.id), idempotencyKey, price };
}

export async function submitDatamartPurchase(params: {
  phoneNumber: string;
  network: DatamartNetworkCode;
  capacity: string;
  idempotencyKey: string;
}): Promise<DatamartPurchaseSuccess> {
  const payload = {
    phoneNumber: toLocalGhanaFormat(params.phoneNumber),
    network: params.network,
    capacity: params.capacity,
    gateway: "wallet",
  };

  const result = await datamartRequest<DatamartPurchaseSuccess>("/purchase", {
    method: "POST",
    body: payload,
    idempotencyKey: params.idempotencyKey,
    retries: MAX_RETRIES,
  });

  if (!result.ok || !result.data) {
    const errorMessage = result.message || "DataMart purchase failed";
    await sql`
      UPDATE datamart_orders
      SET status = 'failed',
          error_message = ${errorMessage},
          error_code = ${result.code || "PROVIDER_ERROR"},
          retry_count = retry_count + 1,
          last_attempt_at = NOW(),
          updated_at = NOW()
      WHERE idempotency_key = ${params.idempotencyKey}
    `;
    throw new Error(errorMessage);
  }

  const data = result.data;
  const normalizedStatus = data.orderStatus?.toLowerCase?.() ?? "pending";

  await sql`
    UPDATE datamart_orders
    SET status = ${normalizedStatus},
        order_reference = ${data.orderReference},
        transaction_reference = ${data.transactionReference},
        purchase_id = ${data.purchaseId},
        price = ${data.price},
        balance_before = ${data.balanceBefore},
        balance_after = ${data.balanceAfter},
        processing_method = ${data.processingMethod},
        last_attempt_at = NOW(),
        updated_at = NOW(),
        metadata = metadata || '{}'::jsonb || ${JSON.stringify({ lastResponse: data })}::jsonb
    WHERE idempotency_key = ${params.idempotencyKey}
  `;

  return data;
}

export async function recordBulkBatch(params: {
  batchId: string;
  idempotencyKey: string;
  orders: Array<{ ref?: string; phoneNumber: string; network: DatamartNetworkCode; capacity: string; price: number }>;
}): Promise<void> {
  await withTransaction(async (query) => {
    await query(
      `INSERT INTO datamart_bulk_batches (batch_id, idempotency_key, total, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [params.batchId, params.idempotencyKey, params.orders.length]
    );

    for (const order of params.orders) {
      await query(
        `INSERT INTO datamart_bulk_order_items (
          batch_id,
          ref,
          phone_number,
          network,
          capacity,
          price,
          status
        )
        SELECT id, $2, $3, $4, $5, $6, 'pending'
        FROM datamart_bulk_batches
        WHERE idempotency_key = $1
        LIMIT 1
      `,
        [params.idempotencyKey, order.ref || null, toE164(order.phoneNumber), order.network, order.capacity, order.price]
      );
    }
  });
}

export async function submitDatamartBulkPurchase(params: {
  orders: Array<{ phoneNumber: string; network: DatamartNetworkCode; capacity: string; ref?: string; price: number }>;
  idempotencyKey: string;
}): Promise<{ summary: DatamartBulkSummary; results: DatamartBulkResultItem[] }> {
  const payload = {
    orders: params.orders.map((order) => ({
      phoneNumber: toLocalGhanaFormat(order.phoneNumber),
      network: order.network,
      capacity: order.capacity,
      ...(order.ref ? { ref: order.ref } : {}),
    })),
  };

  const result = await datamartRequest<{ summary: DatamartBulkSummary; results: DatamartBulkResultItem[] }>("/bulk-purchase", {
    method: "POST",
    body: payload,
    idempotencyKey: params.idempotencyKey,
    retries: MAX_RETRIES,
  });

  if (!result.ok || !result.data) {
    const errorMessage = result.message || "Bulk purchase failed";
    await sql`
      UPDATE datamart_bulk_batches
      SET status = 'failed',
          metadata = metadata || '{}'::jsonb || ${JSON.stringify({ error: errorMessage })}::jsonb,
          updated_at = NOW()
      WHERE idempotency_key = ${params.idempotencyKey}
    `;
    throw new Error(errorMessage);
  }

  const batchSummary = result.data.summary;
  const items = (result.data.results || []).map((item) => ({
    ...item,
    status: item.status?.toLowerCase?.() ?? item.status,
  }));

  const normalizedSummary = {
    ...batchSummary,
    failed: Number(batchSummary.failed ?? 0),
    successful: Number(batchSummary.successful ?? 0),
    total: Number(batchSummary.total ?? params.orders.length),
    totalCharged: batchSummary.totalCharged ?? undefined,
    shortfall: batchSummary.shortfall ?? undefined,
    remainingBalance: batchSummary.remainingBalance ?? undefined,
  };

  await withTransaction(async (query) => {
    await query(
      `UPDATE datamart_bulk_batches
       SET status = CASE WHEN ($2::jsonb->>'failed')::int = 0 THEN 'completed' ELSE 'completed_with_errors' END,
           successful = ($2::jsonb->>'successful')::int,
           failed = ($2::jsonb->>'failed')::int,
           total_charged = ($2::jsonb->>'totalCharged')::numeric,
           shortfall = ($2::jsonb->>'shortfall')::numeric,
           wallet_balance = ($2::jsonb->>'remainingBalance')::numeric,
           metadata = metadata || $3::jsonb,
           updated_at = NOW()
       WHERE idempotency_key = $1`,
      [
        params.idempotencyKey,
        JSON.stringify(normalizedSummary),
        JSON.stringify({ summary: normalizedSummary }),
      ]
    );

    for (const item of items) {
      await query(
        `UPDATE datamart_bulk_order_items
         SET status = $1,
             purchase_id = $2,
             order_reference = $3,
             transaction_reference = $4,
             balance_before = $5,
             balance_after = $6,
             metadata = metadata || $7::jsonb,
             updated_at = NOW()
         WHERE batch_id = (SELECT id FROM datamart_bulk_batches WHERE idempotency_key = $8)
           AND ( ( $9 IS NULL AND ref IS NULL ) OR ref = $9 )
           AND phone_number = $10
           AND capacity = $11
         `,
        [
          item.status,
          item.purchaseId || null,
          item.orderReference || null,
          item.transactionReference || null,
          item.balanceBefore || null,
          item.balanceAfter || null,
          JSON.stringify({ provider: item }),
          params.idempotencyKey,
          item.ref || null,
          toE164(item.phoneNumber),
          item.capacity,
        ]
      );
    }
  });

  return { summary: normalizedSummary, results: items };
}

export async function refreshOrderStatus(orderReference: string): Promise<DatamartOrderStatusPayload | null> {
  const result = await datamartRequest<DatamartOrderStatusPayload>(`/order-status/${encodeURIComponent(orderReference)}`, {
    method: "GET",
    retries: MAX_RETRIES,
  });

  if (!result.ok || !result.data) {
    return null;
  }

  const data = result.data;

  const normalizedStatus = data.orderStatus?.toLowerCase?.() ?? data.orderStatus;

  await sql`
    UPDATE datamart_orders
    SET status = ${normalizedStatus},
        balance_before = COALESCE(balance_before, ${data.balanceBefore}),
        balance_after = COALESCE(balance_after, ${data.balanceAfter}),
        processing_method = COALESCE(processing_method, ${data.processingMethod}),
        updated_at = NOW(),
        metadata = metadata || '{}'::jsonb || ${JSON.stringify({ lastStatus: data })}::jsonb
    WHERE order_reference = ${orderReference}
  `;

  return data;
}

export async function fetchDeliveryTracker(): Promise<DatamartDeliveryTrackerPayload> {
  const result = await datamartRequest<DatamartDeliveryTrackerPayload>("/delivery-tracker", {
    method: "GET",
    retries: 1,
  });

  if (!result.ok || !result.data) {
    throw new Error(result.message || "Failed to fetch delivery tracker");
  }

  return result.data;
}

export async function persistWebhookEvent(event: string, signature: string | null, verified: boolean, payload: Record<string, unknown>): Promise<void> {
  const orderReference = typeof payload?.orderReference === "string" ? payload.orderReference : null;
  await sql`
    INSERT INTO datamart_webhook_logs (event, order_reference, payload, signature, verified)
    VALUES (${event}, ${orderReference}, ${JSON.stringify(payload)}::jsonb, ${signature}, ${verified})
  `;

  if (orderReference && payload?.status) {
    const normalized = String(payload.status).toLowerCase();
    await sql`
      UPDATE datamart_orders
      SET status = ${normalized},
          updated_at = NOW(),
          metadata = metadata || '{}'::jsonb || ${JSON.stringify({ webhook: payload })}::jsonb
      WHERE order_reference = ${orderReference}
    `;
  }
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
