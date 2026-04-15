import { getDatamartEnv } from "@/lib/env";
import { providerRequest, type ProviderHttpError } from "@/lib/providers/http-client";

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

export interface DatamartNetwork {
  id: string;
  name: string;
  network_type?: string;
}

export interface DatamartDataPlan {
  id: string;
  data_plan: string;
  plan_network: string;
  month_validate: string;
  plan_amount: string;
  plan_type?: string;
}

export interface DatamartUserInfo {
  username: string;
  wallet_balance: string;
  email: string;
}

export interface DatamartOrderResult {
  id?: number;
  Status: "successful" | "failed" | "pending";
  plan_network?: string;
  mobile_number?: string;
  plan_amount?: string;
  plan_name?: string;
  ident?: string;
  api_response?: string;
  message?: string;
  error?: string;
}

export interface DatamartAirtimeResult {
  Status: "successful" | "failed" | "pending";
  mobile_number?: string;
  amount?: string;
  network?: string;
  message?: string;
  error?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  errorCode?: ProviderHttpError["code"];
  attempts?: number;
}

const NETWORK_MAP: Record<string, string> = {
  mtn: "MTN",
  vodafone: "Vodafone",
  telecel: "Telecel",
  airteltigo: "AirtelTigo",
  at: "AirtelTigo",
};

async function datamartRequest<T>(
  endpoint: string,
  options: RequestInit = {}
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

  const result = await providerRequest<T>("datamart", config.baseUrl, endpoint, {
    ...options,
    timeoutMs: 12000,
    retries: 2,
    retryDelayMs: 500,
    headers: {
      Authorization: `Token ${config.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!result.success) {
    return {
      success: false,
      error: result.error?.message || "DataMart request failed",
      statusCode: result.statusCode,
      errorCode: result.error?.code,
      attempts: result.attempts,
    };
  }
  return { success: true, data: result.data, statusCode: result.statusCode, attempts: result.attempts };
}

function ensureArray<T>(value: unknown, fallbackMessage: string): ApiResponse<T[]> {
  if (Array.isArray(value)) {
    return { success: true, data: value as T[] };
  }
  return { success: false, error: fallbackMessage, errorCode: "PROVIDER_BAD_RESPONSE" };
}

export async function getAccountInfo(): Promise<ApiResponse<DatamartUserInfo>> {
  // Updated endpoint - DataMart API changed from /api/user/ to /api/v1/me
  return datamartRequest<DatamartUserInfo>("/api/v1/me/");
}

export async function getNetworks(): Promise<ApiResponse<DatamartNetwork[]>> {
  return datamartRequest<DatamartNetwork[]>("/api/v1/networks/");
}

export async function getDataPlans(
  network?: string
): Promise<ApiResponse<DatamartDataPlan[]>> {
  const endpoint = network ? `/api/v1/data-plans/?network=${network}` : "/api/v1/data-plans/";
  return datamartRequest<DatamartDataPlan[]>(endpoint);
}

export async function purchaseDataBundle(params: {
  networkCode: string;
  phoneNumber: string;
  planId: string;
  bypassPortedNumber?: boolean;
}): Promise<ApiResponse<DatamartOrderResult>> {
  return datamartRequest<DatamartOrderResult>("/api/v1/data/", {
    method: "POST",
    body: JSON.stringify({
      network: params.networkCode,
      mobile_number: params.phoneNumber,
      plan_id: params.planId,
      bypass_ported_number: params.bypassPortedNumber || false,
    }),
  });
}

export async function purchaseAirtime(params: {
  networkCode: string;
  phoneNumber: string;
  amount: number;
  bypassPortedNumber?: boolean;
}): Promise<ApiResponse<DatamartAirtimeResult>> {
  return datamartRequest<DatamartAirtimeResult>("/api/v1/airtime/", {
    method: "POST",
    body: JSON.stringify({
      network: params.networkCode,
      mobile_number: params.phoneNumber,
      amount: params.amount,
      bypass_ported_number: params.bypassPortedNumber || false,
    }),
  });
}

export async function getDataOrderStatus(
  orderId: string | number
): Promise<ApiResponse<DatamartOrderResult>> {
  return datamartRequest<DatamartOrderResult>(`/api/v1/data/${orderId}/`);
}

export function resolveNetworkCode(internalId: string): string {
  return NETWORK_MAP[internalId.toLowerCase()] || internalId;
}

export function datamartNetworkMatches(planNetwork: string, selectedNetwork: string): boolean {
  const plan = planNetwork.toLowerCase();
  const selected = selectedNetwork.toLowerCase();
  if (plan.includes(selected) || selected.includes(plan)) return true;
  if (selected.includes("airtel") && plan.includes("at")) return true;
  if (selected.includes("telecel") && (plan.includes("voda") || plan.includes("vodafone"))) return true;
  if (selected.includes("vodafone") && plan.includes("telecel")) return true;
  return false;
}
