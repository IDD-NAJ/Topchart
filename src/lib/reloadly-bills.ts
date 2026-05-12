import { getReloadlyEnv } from "@/lib/env";

const UTILITIES_BASE_URL = "https://utilities.reloadly.com";
const UTILITIES_SANDBOX_URL = "https://utilities-sandbox.reloadly.com";
const AUTH_URL = "https://auth.reloadly.com/oauth/token";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

let utilitiesTokenCache: { token: string; expiresAt: number } | null = null;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

async function getUtilitiesAccessToken(): Promise<string> {
  if (utilitiesTokenCache && utilitiesTokenCache.expiresAt > Date.now()) {
    return utilitiesTokenCache.token;
  }

  const env = getReloadlyEnv();
  const isSandbox = env.RELOADLY_SANDBOX === "true";
  const audience = isSandbox 
    ? "https://utilities-sandbox.reloadly.com" 
    : "https://utilities.reloadly.com";

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.RELOADLY_CLIENT_ID,
      client_secret: env.RELOADLY_CLIENT_SECRET,
      grant_type: "client_credentials",
      audience,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Failed to get access token: ${res.status}`);
  }

  const data = await res.json();
  utilitiesTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

async function utilitiesRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<ApiResponse<T>> {
  const env = getReloadlyEnv();
  const isSandbox = env.RELOADLY_SANDBOX === "true";
  const baseUrl = isSandbox ? UTILITIES_SANDBOX_URL : UTILITIES_BASE_URL;

  try {
    const token = await getUtilitiesAccessToken();

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `API error ${res.status}: ${errorText.substring(0, 200)}`,
        statusCode: res.status,
      };
    }

    const data = await res.json();
    return { success: true, data, statusCode: res.status };
  } catch (err) {
    if (retries > 0 && (err as Error).message?.includes("timeout")) {
      await new Promise(r => setTimeout(r, 1000));
      return utilitiesRequest(endpoint, options, retries - 1);
    }
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

export interface ReloadlyBiller {
  id: number;
  name: string;
  countryCode: string;
  countryName: string;
  type: string;
  serviceType: string;
  localAmountSupported: boolean;
  localTransactionCurrencyCode: string;
  minLocalTransactionAmount: number;
  maxLocalTransactionAmount: number;
  localTransactionFee: number;
  localTransactionFeeCurrencyCode: string;
  localDiscountPercentage: number;
  internationalAmountSupported: boolean;
  internationalTransactionCurrencyCode: string;
  minInternationalTransactionAmount: number;
  maxInternationalTransactionAmount: number;
  internationalTransactionFee: number;
  internationalTransactionFeeCurrencyCode: string;
  internationalDiscountPercentage: number;
  fx?: { rate: number; currencyCode: string };
}

export interface BillersResponse {
  content: ReloadlyBiller[];
  pageable: {
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
    pageSize: number;
    pageNumber: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: { sorted: boolean; unsorted: boolean; empty: boolean };
  empty: boolean;
}

export type BillerType = 
  | "ELECTRICITY_BILL_PAYMENT"
  | "CABLE_TV_BILL_PAYMENT"
  | "INTERNET_BILL_PAYMENT"
  | "WATER_BILL_PAYMENT"
  | "GAS_BILL_PAYMENT"
  | "PHONE_BILL_PAYMENT"
  | "INSURANCE_BILL_PAYMENT"
  | "TAX_BILL_PAYMENT";

export const BILLER_TYPE_MAP: Record<string, string> = {
  electricity: "ELECTRICITY_BILL_PAYMENT",
  tv: "CABLE_TV_BILL_PAYMENT",
  internet: "INTERNET_BILL_PAYMENT",
  water: "WATER_BILL_PAYMENT",
  gas: "GAS_BILL_PAYMENT",
  phone: "PHONE_BILL_PAYMENT",
  insurance: "INSURANCE_BILL_PAYMENT",
  tax: "TAX_BILL_PAYMENT",
};

export const CATEGORY_TO_BILLER_TYPE: Record<string, BillerType[]> = {
  electricity: ["ELECTRICITY_BILL_PAYMENT"],
  tv: ["CABLE_TV_BILL_PAYMENT"],
  internet: ["INTERNET_BILL_PAYMENT"],
  water: ["WATER_BILL_PAYMENT"],
  utilities: ["GAS_BILL_PAYMENT", "PHONE_BILL_PAYMENT", "INSURANCE_BILL_PAYMENT", "TAX_BILL_PAYMENT"],
};

export async function getBillers(params?: {
  countryISOCode?: string;
  type?: BillerType;
  page?: number;
  size?: number;
}): Promise<ApiResponse<BillersResponse>> {
  const query = new URLSearchParams();
  if (params?.countryISOCode) query.set("countryISOCode", params.countryISOCode);
  if (params?.type) query.set("type", params.type);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));

  const qs = query.toString();
  return utilitiesRequest<BillersResponse>(`/billers${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getBillersByCountry(countryCode: string): Promise<ApiResponse<ReloadlyBiller[]>> {
  const result = await getBillers({ countryISOCode: countryCode, size: 100 });
  if (result.success && result.data) {
    return { success: true, data: result.data.content };
  }
  return { success: false, error: result.error || "Failed to fetch billers" };
}

export async function getBillerById(billerId: number): Promise<ApiResponse<ReloadlyBiller>> {
  return utilitiesRequest<ReloadlyBiller>(`/billers/${billerId}`, { method: "GET" });
}

export interface ValidateRequest {
  billerId: number;
  customerReference: string;
  amount?: number;
  currencyCode?: string;
}

export interface ValidateResponse {
  billerId: number;
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
  dueAmount?: number;
  dueDate?: string;
  billDetails?: Record<string, unknown>;
  reference?: string;
}

export async function validateBillPayment(
  payload: ValidateRequest
): Promise<ApiResponse<ValidateResponse>> {
  return utilitiesRequest<ValidateResponse>("/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PayBillRequest {
  billerId: number;
  customerReference: string;
  amount: number;
  currencyCode?: string;
  reference: string;
  useLocalAmount?: boolean;
  additionalInfo?: Record<string, unknown>;
}

export interface PayBillResponse {
  id: number;
  billerId: number;
  billerName: string;
  customerName: string;
  customerReference: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  reference: string;
  amount: number;
  currencyCode: string;
  localCurrencyCode: string;
  localCurrencyAmount: number;
  exchangeRate: number;
  totalFee: number;
  totalAmount: number;
  transactionFee: number;
  commission?: number;
  countryCode: string;
  discount?: number;
  appliedPromotions?: unknown[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  comment?: string;
}

export async function payBill(payload: PayBillRequest): Promise<ApiResponse<PayBillResponse>> {
  return utilitiesRequest<PayBillResponse>("/pay", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getBillStatus(
  transactionId: number | string
): Promise<ApiResponse<PayBillResponse>> {
  return utilitiesRequest<PayBillResponse>(`/transactions/${transactionId}`, { method: "GET" });
}

export interface BillTransaction {
  id: number;
  billerId: number;
  billerName: string;
  customerName: string;
  customerReference: string;
  status: string;
  reference: string;
  amount: number;
  currencyCode: string;
  localCurrencyCode: string;
  localCurrencyAmount: number;
  exchangeRate: number;
  totalFee: number;
  totalAmount: number;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  comment?: string;
}

export interface BillTransactionsResponse {
  content: BillTransaction[];
  pageable: {
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
    pageSize: number;
    pageNumber: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: { sorted: boolean; unsorted: boolean; empty: boolean };
  empty: boolean;
}

export async function getBillTransactions(params?: {
  page?: number;
  size?: number;
  status?: string;
  billerId?: number;
  reference?: string;
  from?: string;
  to?: string;
}): Promise<ApiResponse<BillTransactionsResponse>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.status) query.set("status", params.status);
  if (params?.billerId) query.set("billerId", String(params.billerId));
  if (params?.reference) query.set("reference", params.reference);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);

  const qs = query.toString();
  return utilitiesRequest<BillTransactionsResponse>(`/transactions${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export function clearUtilitiesTokenCache(): void {
  utilitiesTokenCache = null;
}
