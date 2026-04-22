import { getDatamartEnv } from "@/lib/env";
import { providerRequest, type ProviderHttpError } from "@/lib/providers/http-client";

const DEVELOPER_API_PREFIX = "/api/developer";

function normalizeDatamartBaseUrl(rawBaseUrl?: string): string {
  const fallback = "https://api.datamartgh.shop";
  const candidate = rawBaseUrl?.trim() || fallback;
  try {
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "www.datamartgh.shop" || hostname === "datamartgh.shop") {
      parsed.hostname = "api.datamartgh.shop";
    }
    return parsed.origin;
  } catch {
    return fallback;
  }
}

function getDatamartConfig() {
  const env = getDatamartEnv();
  return {
    baseUrl: normalizeDatamartBaseUrl(env.DATAMART_BASE_URL),
    apiKey: env.DATAMART_API_KEY,
  };
}

export type DatamartNetworkCode = "YELLO" | "TELECEL" | "AT_PREMIUM" | "at";

export interface DatamartDataPackage {
  capacity: string;
  mb: string;
  price: string;
  network: string;
  inStock: boolean;
}

export interface DatamartDataPackagesResponse {
  status: "success" | "error";
  pricingTier: string;
  data: DatamartDataPackage[] | Record<string, DatamartDataPackage[]>;
}

export interface DatamartBalanceData {
  balance: number;
  currency: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

export interface DatamartPurchaseData {
  purchaseId: string;
  orderReference: string;
  transactionReference: string;
  network: string;
  capacity: number;
  price: number;
  balanceBefore: number;
  balanceAfter: number;
  orderStatus: "pending" | "waiting" | "processing" | "completed" | "failed" | "refunded";
  processingMethod: string;
}

export interface DatamartBulkPurchaseSummary {
  total: number;
  successful: number;
  failed: number;
  invalid: number;
  totalCharged: number;
  remainingBalance: number;
}

export interface DatamartBulkPurchaseResult {
  index: number;
  ref?: string;
  phoneNumber: string;
  network: string;
  capacity: string;
  price: number;
  status: string;
  purchaseId: string;
  orderReference: string;
  transactionReference: string;
  balanceBefore: number;
  balanceAfter: number;
}

export interface DatamartOrderStatusData {
  orderId: string;
  reference: string;
  phoneNumber: string;
  network: string;
  capacity: number;
  price: number;
  orderStatus: "pending" | "waiting" | "processing" | "completed" | "failed" | "refunded";
  processingMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatamartTransaction {
  _id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  balanceChange: number;
  isCredit: boolean;
  status: string;
  reference: string;
  gateway: string;
  description: string;
  relatedPurchase?: {
    _id: string;
    phoneNumber: string;
    network: string;
    capacity: number;
  };
  createdAt: string;
}

export interface DatamartUsageStats {
  today: { orders: number; spent: number };
  thisMonth: { orders: number; spent: number };
  allTime: { orders: number; spent: number };
  statusBreakdown: Record<string, number>;
  networkBreakdown: Array<{ network: string; count: number; spent: number }>;
  apiKey: {
    name: string;
    createdAt: string;
    lastUsed: string;
    expiresAt: string | null;
  };
}

export interface DatamartDeliveryTrackerData {
  message: string;
  scanner: { active: boolean; waiting: boolean; waitSeconds: number };
  stats: { checked: number; delivered: number; partial: number; pending: number; failed: number };
  lastDelivered: {
    trackingId: number;
    batchNumber: number;
    placedAt: string;
    deliveredAt: string;
    summary: string;
  } | null;
  checkingNow: { batchNumber: number; summary: string } | null;
  yourOrders: {
    inCurrentBatch: Array<{ phone: string; network: string; capacity: number; deliveryStatus: string }> | null;
    inLastDeliveredBatch: Array<{ phone: string; network: string; capacity: number; deliveryStatus: string }> | null;
  };
  startedAt: string;
}

export interface DatamartWebhookStatus {
  configured: boolean;
  message: string;
  url?: string;
  events?: string[];
}

export interface DatamartRateLimit {
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

interface DatamartApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  rateLimit?: DatamartRateLimit;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  errorCode?: ProviderHttpError["code"];
  attempts?: number;
  rateLimit?: DatamartRateLimit;
}

const NETWORK_MAP: Record<string, DatamartNetworkCode> = {
  mtn: "YELLO",
  mtngh: "YELLO",
  "mtn-": "YELLO",
  yello: "YELLO",
  vodafone: "TELECEL",
  voda: "TELECEL",
  "vodafone-": "TELECEL",
  telecel: "TELECEL",
  tigo: "AT_PREMIUM",
  airteltigo: "AT_PREMIUM",
  "airtel-tigo": "AT_PREMIUM",
  at: "AT_PREMIUM",
  "atpremium": "AT_PREMIUM",
};

const NETWORK_DISPLAY_MAP: Record<string, string> = {
  YELLO: "MTN",
  TELECEL: "Telecel",
  AT_PREMIUM: "AirtelTigo",
  at: "AirtelTigo",
};

async function datamartRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number; retries?: number; retryDelayMs?: number } = {}
): Promise<ApiResponse<T>> {
  let config: { baseUrl: string; apiKey: string };
  try {
    config = getDatamartConfig();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "DataMart configuration error",
      errorCode: "PROVIDER_BAD_RESPONSE",
    };
  }

  const { timeoutMs, retries, retryDelayMs, ...fetchOptions } = options;
  const result = await providerRequest<DatamartApiResponse<T>>(
    "datamart",
    config.baseUrl,
    endpoint,
    {
      ...fetchOptions,
      timeoutMs: timeoutMs ?? 30000,
      retries: retries ?? 3,
      retryDelayMs: retryDelayMs ?? 1000,
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    }
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error?.message || "DataMart request failed",
      statusCode: result.statusCode,
      errorCode: result.error?.code,
      attempts: result.attempts,
    };
  }

  const apiResponse = result.data;
  if (apiResponse?.status === "error") {
    return {
      success: false,
      error: apiResponse.message || "DataMart API error",
      statusCode: result.statusCode,
      attempts: result.attempts,
    };
  }

  return {
    success: true,
    data: apiResponse?.data as T,
    statusCode: result.statusCode,
    attempts: result.attempts,
    rateLimit: apiResponse?.rateLimit,
  };
}

export async function getBalance(): Promise<ApiResponse<DatamartBalanceData>> {
  return datamartRequest<DatamartBalanceData>(`${DEVELOPER_API_PREFIX}/balance`);
}

export async function getDataPackages(
  network?: string
): Promise<ApiResponse<DatamartDataPackage[]>> {
  const endpoint = network
    ? `${DEVELOPER_API_PREFIX}/data-packages?network=${encodeURIComponent(network)}`
    : `${DEVELOPER_API_PREFIX}/data-packages`;
  return datamartRequest<DatamartDataPackage[]>(endpoint);
}

export async function purchaseDataBundle(params: {
  phoneNumber: string;
  network: string;
  capacity: string;
  gateway?: string;
}): Promise<ApiResponse<DatamartPurchaseData>> {
  const resolvedNetwork = resolveNetworkCode(params.network);
  return datamartRequest<DatamartPurchaseData>(`${DEVELOPER_API_PREFIX}/purchase`, {
    method: "POST",
    body: JSON.stringify({
      phoneNumber: params.phoneNumber,
      network: resolvedNetwork,
      capacity: params.capacity,
      gateway: params.gateway || "wallet",
    }),
    retries: 0,
  });
}

export async function bulkPurchaseData(params: {
  orders: Array<{
    phoneNumber: string;
    network: string;
    capacity: string;
    ref?: string;
  }>;
}): Promise<ApiResponse<{ summary: DatamartBulkPurchaseSummary; results: DatamartBulkPurchaseResult[] }>> {
  const resolvedOrders = params.orders.map((order) => ({
    ...order,
    network: resolveNetworkCode(order.network),
  }));
  return datamartRequest(`${DEVELOPER_API_PREFIX}/bulk-purchase`, {
    method: "POST",
    body: JSON.stringify({ orders: resolvedOrders }),
    retries: 0,
  });
}

export async function getOrderStatus(
  orderReference: string
): Promise<ApiResponse<DatamartOrderStatusData>> {
  return datamartRequest<DatamartOrderStatusData>(
    `${DEVELOPER_API_PREFIX}/order-status/${encodeURIComponent(orderReference)}`
  );
}

export async function getTransactions(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ transactions: DatamartTransaction[]; pagination: { currentPage: number; totalPages: number; totalItems: number } }>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return datamartRequest(`${DEVELOPER_API_PREFIX}/transactions?page=${page}&limit=${limit}`);
}

export async function getUsageStats(): Promise<ApiResponse<DatamartUsageStats>> {
  return datamartRequest<DatamartUsageStats>(`${DEVELOPER_API_PREFIX}/usage/stats`);
}

export async function getDeliveryTracker(): Promise<ApiResponse<DatamartDeliveryTrackerData>> {
  return datamartRequest<DatamartDeliveryTrackerData>(`${DEVELOPER_API_PREFIX}/delivery-tracker`);
}

export async function getWebhookStatus(): Promise<ApiResponse<DatamartWebhookStatus>> {
  return datamartRequest<DatamartWebhookStatus>(`${DEVELOPER_API_PREFIX}/webhook/status`);
}

export async function configureWebhook(url: string, events?: string[]): Promise<ApiResponse<{ configured: boolean; url: string }>> {
  return datamartRequest(`${DEVELOPER_API_PREFIX}/webhook/configure`, {
    method: "POST",
    body: JSON.stringify({ url, events: events || ["order.completed", "order.failed"] }),
    retries: 0,
  });
}

export async function testWebhook(): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return datamartRequest(`${DEVELOPER_API_PREFIX}/webhook/test`, {
    method: "POST",
    retries: 0,
  });
}

export async function deleteWebhook(): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return datamartRequest(`${DEVELOPER_API_PREFIX}/webhook`, {
    method: "DELETE",
    retries: 0,
  });
}

export interface DatamartWithdrawalLimits {
  walletBalance: number;
  feePercent: number;
  singleTxnLimit: number;
  dailyLimit: number;
  todayWithdrawn: number;
  todayRemaining: number;
  totalWithdrawn: number;
  hmacRequired: boolean;
}

export interface DatamartWithdrawalData {
  reference: string;
  clientRef?: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  amount: number;
  fee: number;
  feePercent: number;
  totalCharged: number;
  recipient: { phone: string; network: string; name?: string };
  provider: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

function createHmacSignature(
  timestamp: string,
  method: string,
  path: string,
  rawBody: string,
  signingSecret: string
): string {
  const crypto = require("crypto") as typeof import("crypto");
  const payload = `${timestamp}.${method}.${path}.${rawBody}`;
  return crypto.createHmac("sha256", signingSecret).update(payload).digest("hex");
}

export async function getWithdrawalLimits(): Promise<ApiResponse<DatamartWithdrawalLimits>> {
  return datamartRequest<DatamartWithdrawalLimits>(
    "/api/developer/v1/withdrawals/meta/limits"
  );
}

export async function createWithdrawal(params: {
  amount: number;
  phoneNumber: string;
  network: "MTN" | "TELECEL" | "AIRTELTIGO";
  recipientName?: string;
  clientRef?: string;
  idempotencyKey: string;
}): Promise<ApiResponse<DatamartWithdrawalData>> {
  const path = "/api/developer/v1/withdrawals";
  const body = {
    amount: params.amount,
    phoneNumber: params.phoneNumber,
    network: params.network,
    ...(params.recipientName && { recipientName: params.recipientName }),
    ...(params.clientRef && { clientRef: params.clientRef }),
  };
  const rawBody = JSON.stringify(body);

  const signingSecret = process.env.DATAMART_SIGNING_SECRET;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Idempotency-Key": params.idempotencyKey,
  };

  if (signingSecret) {
    const timestamp = Date.now().toString();
    const signature = createHmacSignature(timestamp, "POST", path, rawBody, signingSecret);
    headers["X-Signature"] = signature;
    headers["X-Timestamp"] = timestamp;
  }

  return datamartRequest<DatamartWithdrawalData>(path, {
    method: "POST",
    body: rawBody,
    headers,
    retries: 0,
  });
}

export async function getWithdrawalStatus(
  reference: string
): Promise<ApiResponse<DatamartWithdrawalData>> {
  return datamartRequest<DatamartWithdrawalData>(
    `/api/developer/v1/withdrawals/${encodeURIComponent(reference)}`
  );
}

export async function listWithdrawals(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ withdrawals: DatamartWithdrawalData[]; pagination: { currentPage: number; totalPages: number; totalItems: number } }>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  let path = `/api/developer/v1/withdrawals?page=${page}&limit=${limit}`;
  if (params?.status) path += `&status=${encodeURIComponent(params.status)}`;
  return datamartRequest(path);
}

export async function getPurchaseHistory(
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<{ transactions: DatamartTransaction[]; pagination: { currentPage: number; totalPages: number; totalItems: number } }>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return datamartRequest(`${DEVELOPER_API_PREFIX}/purchase-history/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`);
}

export function extractRateLimitInfo(response: ApiResponse<unknown>): DatamartRateLimit | undefined {
  return response.rateLimit;
}

export function resolveNetworkCode(value: string): DatamartNetworkCode {
  if (!value) return value as DatamartNetworkCode;
  const normalized = value.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (normalized in NETWORK_MAP) {
    return NETWORK_MAP[normalized];
  }
  const upper = value.trim().toUpperCase();
  if (upper === "YELLO" || upper === "TELECEL" || upper === "AT_PREMIUM" || upper === "AT") {
    return upper as DatamartNetworkCode;
  }
  return value.trim() as DatamartNetworkCode;
}

export function getNetworkDisplayName(code: string): string {
  return NETWORK_DISPLAY_MAP[code] || code;
}

export function datamartNetworkMatches(planNetwork: string, selectedNetwork: string): boolean {
  if (!planNetwork || !selectedNetwork) return false;
  const plan = planNetwork.toLowerCase();
  const selected = selectedNetwork.toLowerCase();
  if (plan === selected || plan.includes(selected) || selected.includes(plan)) return true;
  const resolvedPlan = resolveNetworkCode(planNetwork).toLowerCase();
  const resolvedSelected = resolveNetworkCode(selectedNetwork).toLowerCase();
  if (resolvedPlan === resolvedSelected) return true;
  return false;
}

export async function getAccountInfo(): Promise<ApiResponse<DatamartBalanceData>> {
  return getBalance();
}

export async function getNetworks(): Promise<ApiResponse<Array<{ id: string; name: string; code: DatamartNetworkCode }>>> {
  const result = await getDataPackages();
  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Failed to fetch networks" };
  }
  const packages_ = result.data;
  const seen = new Set<string>();
  const networks: Array<{ id: string; name: string; code: DatamartNetworkCode }> = [];
  for (const pkg of packages_) {
    const code = resolveNetworkCode(pkg.network);
    if (!seen.has(code)) {
      seen.add(code);
      networks.push({
        id: code,
        name: getNetworkDisplayName(code),
        code,
      });
    }
  }
  return { success: true, data: networks };
}

export async function getDataPlans(
  network?: string
): Promise<ApiResponse<DatamartDataPackage[]>> {
  return getDataPackages(network ? resolveNetworkCode(network) : undefined);
}

export async function getDataOrderStatus(
  orderId: string
): Promise<ApiResponse<DatamartOrderStatusData>> {
  return getOrderStatus(orderId);
}

export async function purchaseAirtime(): Promise<ApiResponse<never>> {
  return {
    success: false,
    error: "DataMart does not support airtime purchases. Only data bundles are available.",
    errorCode: "PROVIDER_UNSUPPORTED_OPERATION",
    statusCode: 404,
  };
}

export function clearTokenCache(): void {}
