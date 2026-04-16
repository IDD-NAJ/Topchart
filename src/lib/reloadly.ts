import { getReloadlyEnv } from "@/lib/env";

// Token cache with expiration
type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export interface ReloadlyOperator {
  id: number;
  name: string;
  countryCode: string;
  countryName: string;
  bundle: boolean;
  data: boolean;
  pin: boolean;
  supportsLocalAmounts: boolean;
  supportsGeographicalRechargePlans: boolean;
  denominationType: string;
  senderCurrencyCode: string;
  senderCurrencyName: string;
  destinationCurrencyCode: string;
  destinationCurrencyName: string;
  commission: number;
  internationalDiscount: number;
  localDiscount: number;
  mostPopularAmount: number | null;
  mostPopularLocalAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  localMinAmount: number | null;
  localMaxAmount: number | null;
  fxRate: number;
  logoUrls: string[];
  fixedAmounts: number[];
  fixedAmountsDescriptions: Record<string, string>;
  localFixedAmounts: number[];
  localFixedAmountsDescriptions: Record<string, string>;
  suggestedAmounts: number[];
  suggestedAmountsMap: Record<string, number>;
  fees: number;
  geographicalRechargePlans: unknown[];
  promotions: unknown[];
  status: string;
}

export interface ReloadlyAirtimeRequest {
  operatorId: number;
  amount: number;
  recipientPhone: string;
  senderPhone?: string;
  customIdentifier?: string;
}

export interface ReloadlyAirtimeResult {
  transactionId: number;
  status: "SUCCESSFUL" | "PENDING" | "FAILED";
  operatorTransactionId?: string;
  recipientPhone: string;
  recipientEmail?: string;
  senderPhone: string;
  countryCode: string;
  operatorId: number;
  operatorName: string;
  discount: number;
  requestedAmount: number;
  deliveredAmount: number;
  currencyCode: string;
  fee: number;
  customIdentifier?: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ReloadlyBalance {
  balance: number;
  currencyCode: string;
  currencyName: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  statusCode?: number;
}

// Ghana operator mappings - these should be verified with Reloadly API
const GHANA_OPERATOR_IDS: Record<string, number> = {
  MTN: 179,
  VODAFONE: 180,
  TELECEL: 180, // Vodafone rebranded as Telecel
  AIRTELTIGO: 181,
  AIRTEL: 181,
  TIGO: 181,
};

function getReloadlyConfig() {
  const env = getReloadlyEnv();
  return {
    baseUrl: env.RELOADLY_BASE_URL || "https://airtime.reloadly.com",
    authUrl: env.RELOADLY_AUTH_URL || "https://auth.reloadly.com/oauth/token",
    clientId: env.RELOADLY_CLIENT_ID,
    clientSecret: env.RELOADLY_CLIENT_SECRET,
  };
}

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const config = getReloadlyConfig();

  try {
    const response = await fetch(config.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "client_credentials",
        audience: config.baseUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Authentication failed: ${error}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 3600; // Default 1 hour

    // Cache token with 5 minute buffer before expiration
    tokenCache = {
      accessToken,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    return accessToken;
  } catch (error) {
    console.error("Reloadly authentication error:", error);
    throw error;
  }
}

async function reloadlyRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAccessToken();
    const config = getReloadlyConfig();

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorCode = "RELOADLY_API_ERROR";

      // Map HTTP status codes to error codes
      if (response.status === 401) errorCode = "RELOADLY_AUTH_FAILED";
      else if (response.status === 400) errorCode = "RELOADLY_INVALID_REQUEST";
      else if (response.status === 404) errorCode = "RELOADLY_OPERATOR_NOT_FOUND";
      else if (response.status === 402) errorCode = "RELOADLY_INSUFFICIENT_BALANCE";
      else if (response.status === 422) errorCode = "RELOADLY_INVALID_PHONE";

      return {
        success: false,
        error: errorText,
        errorCode,
        statusCode: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Reloadly request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
      errorCode: "RELOADLY_REQUEST_FAILED",
    };
  }
}

export async function getBalance(): Promise<ApiResponse<ReloadlyBalance>> {
  return reloadlyRequest<ReloadlyBalance>("/accounts/balance");
}

export async function getOperators(countryCode?: string): Promise<ApiResponse<ReloadlyOperator[]>> {
  const endpoint = countryCode
    ? `/operators?countryCode=${countryCode}&includeBundles=true&includeData=true&includePin=true`
    : "/operators?includeBundles=true&includeData=true&includePin=true";

  return reloadlyRequest<ReloadlyOperator[]>(endpoint);
}

export async function getGhanaOperators(): Promise<ApiResponse<ReloadlyOperator[]>> {
  return getOperators("GH");
}

export function getOperatorId(networkName: string): number | null {
  const normalized = networkName.toUpperCase().replace(/[^A-Z]/g, "");

  // Direct match
  if (GHANA_OPERATOR_IDS[normalized]) {
    return GHANA_OPERATOR_IDS[normalized];
  }

  // Partial matches
  if (normalized.includes("MTN")) return GHANA_OPERATOR_IDS.MTN;
  if (normalized.includes("VODAFONE") || normalized.includes("TELECEL")) return GHANA_OPERATOR_IDS.VODAFONE;
  if (normalized.includes("AIRTEL") || normalized.includes("TIGO")) return GHANA_OPERATOR_IDS.AIRTELTIGO;

  return null;
}

export async function purchaseAirtime(
  params: ReloadlyAirtimeRequest
): Promise<ApiResponse<ReloadlyAirtimeResult>> {
  const config = getReloadlyConfig();

  const payload: Record<string, unknown> = {
    operatorId: params.operatorId,
    amount: params.amount,
    recipientPhone: {
      countryCode: "GH",
      number: params.recipientPhone.replace(/\D/g, ""),
    },
  };

  if (params.senderPhone) {
    payload.senderPhone = {
      countryCode: "GH",
      number: params.senderPhone.replace(/\D/g, ""),
    };
  }

  if (params.customIdentifier) {
    payload.customIdentifier = params.customIdentifier;
  }

  return reloadlyRequest<ReloadlyAirtimeResult>("/topups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTransactionStatus(
  transactionId: number
): Promise<ApiResponse<ReloadlyAirtimeResult>> {
  return reloadlyRequest<ReloadlyAirtimeResult>(`/topups/${transactionId}/status`);
}

// Auto-detect operator by phone number (for Ghana)
export function detectOperatorByPhone(phone: string): number | null {
  const cleanPhone = phone.replace(/\D/g, "");

  // MTN: starts with 024, 025, 054, 055, 059
  if (/^(024|025|054|055|059)/.test(cleanPhone)) {
    return GHANA_OPERATOR_IDS.MTN;
  }

  // Vodafone/Telecel: starts with 020, 050
  if (/^(020|050)/.test(cleanPhone)) {
    return GHANA_OPERATOR_IDS.VODAFONE;
  }

  // AirtelTigo: starts with 026, 027, 056, 057
  if (/^(026|027|056|057)/.test(cleanPhone)) {
    return GHANA_OPERATOR_IDS.AIRTELTIGO;
  }

  return null;
}

// Clear token cache (useful for testing or when token is revoked)
export function clearTokenCache(): void {
  tokenCache = null;
}
