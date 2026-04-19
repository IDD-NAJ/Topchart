import { getReloadlyEnv } from "@/lib/env";

const REQUEST_TIMEOUT_MS = 15_000;
const TOPUP_TIMEOUT_MS = 30_000;
const AUTH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;
const TOKEN_EXPIRY_BUFFER_S = 300;

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;
let tokenRefreshPromise: Promise<string> | null = null;
let configValidated = false;

// ─── OpenAPI 3.1 Spec-derived Types ───────────────────────────────────────────

export interface AccessTokenRequest {
  client_id: string;
  client_secret: string;
  grant_type: "client_credentials";
  audience: string;
}

export interface AccessTokenResponse200 {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}

export interface ApiErrorResponse {
  timeStamp?: string;
  message?: string;
  path?: string;
  errorCode?: string | null;
  infoLink?: string | null;
  details?: unknown[];
  status?: number;
  error?: string;
}

export interface AccountsBalanceResponse {
  balance: number;
  currencyCode: string;
  currencyName: string;
  updatedAt: string;
}

export interface CountryResponse {
  isoName: string;
  name: string;
  continent: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  flag: string;
  callingCodes: string[];
}

export interface OperatorFees {
  international: number;
  internationalPercentage: number;
  local: number;
  localPercentage: number;
}

export interface OperatorResponse {
  operatorId: number;
  name: string;
  bundle: boolean;
  data: boolean;
  comboProduct: boolean;
  pin: boolean;
  supportsLocalAmounts: boolean;
  denominationType: "RANGE" | "FIXED";
  senderCurrencyCode: string;
  senderCurrencySymbol: string;
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  commission: number;
  internationalDiscount: number;
  localDiscount: number;
  mostPopularAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  localMinAmount: number | null;
  localMaxAmount: number | null;
  country: { isoName: string; name: string };
  fx: { rate: number; currencyCode: string };
  logoUrls: string[];
  fixedAmounts: number[];
  fixedAmountsDescriptions: string[];
  localFixedAmounts: number[];
  localFixedAmountsDescriptions: string[];
  suggestedAmounts: number[];
  suggestedAmountsMap: Record<string, number>;
  promotions: unknown[];
  fees?: OperatorFees;
}

export interface FxRateRequest {
  operatorId: number;
  amount: number;
}

export interface FxRateResponse {
  id?: number;
  name?: string;
  fxRate: number;
  currencyCode: string;
}

export interface CommissionOperator {
  operatorId: number;
  name: string;
  countryCode: string;
  status: boolean;
  bundle: boolean;
  data: boolean;
}

export interface CommissionResponse {
  operator: CommissionOperator;
  percentage: number;
  internationalPercentage: number;
  localPercentage: number;
  updatedAt: number;
}

export interface PromotionResponse {
  promotionId: number;
  operatorId: number;
  title1: string;
  title2: string;
  description: string;
  startDate: string;
  endDate: string;
  denominations: string;
  localDenominations: string | null;
}

export interface TopUpsRequest {
  operatorId: string;
  amount: string;
  useLocalAmount?: boolean;
  customIdentifier?: string;
  recipientEmail?: string;
  recipientPhone: {
    countryCode: string;
    number: string;
  };
  senderPhone?: {
    countryCode: string;
    number: string;
  };
}

export interface PinDetail {
  serial: number | string | null;
  info?: string | null;
  info1?: string | null;
  info2?: string | null;
  info3?: string | null;
  value: string | null;
  code: number | string | null;
  ivr: string | null;
  validity: string | null;
}

export interface BalanceInfo {
  oldBalance: number;
  newBalance: number;
  currencyCode: string;
  currencyName: string;
  updatedAt: string;
  cost?: number;
}

export interface TopUpsResponse200 {
  transactionId: number;
  status: string;
  operatorTransactionId: string | null;
  customIdentifier: string | null;
  recipientPhone: number | string;
  recipientEmail?: string | null;
  senderPhone: string;
  countryCode: string;
  operatorId: number;
  operatorName: string;
  discount: number;
  discountCurrencyCode: string;
  requestedAmount: number;
  requestedAmountCurrencyCode: string;
  deliveredAmount: number;
  deliveredAmountCurrencyCode: string;
  transactionDate: string;
  fee: number;
  pinDetail: PinDetail | null;
  balanceInfo: BalanceInfo | null;
}

export interface TopUpsAsyncResponse200 {
  transactionId: number;
}

export interface TopUpsStatusResponse200 {
  code: string | null;
  message: string | null;
  status: "SUCCESSFUL" | "PROCESSING" | "REFUNDED" | "FAILED";
  transaction: TopUpsResponse200;
}

export interface TransactionResponse extends TopUpsResponse200 {}

export interface NumberLookupRequest {
  number: string;
  countryCode: string;
}

// ─── Backward-compatible legacy types ─────────────────────────────────────────

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

// ─── Config ───────────────────────────────────────────────────────────────────
const GHANA_OPERATOR_IDS: Record<string, number> = {
  MTN: 179,
  VODAFONE: 180,
  TELECEL: 180,
  AIRTELTIGO: 181,
  AIRTEL: 181,
  TIGO: 181,
};

function validateReloadlyConfig(env: ReturnType<typeof getReloadlyEnv>) {
  const placeholders = ["your_", "xxx", "test_", "placeholder", "changeme", "example"];
  const clientId = env.RELOADLY_CLIENT_ID.toLowerCase();
  const clientSecret = env.RELOADLY_CLIENT_SECRET.toLowerCase();

  for (const p of placeholders) {
    if (clientId.startsWith(p) || clientSecret.startsWith(p)) {
      throw new Error(
        `[Reloadly Config] Credentials appear to be placeholder values (starts with "${p}"). ` +
        `Set valid RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET in your environment.`
      );
    }
  }

  if (clientId.length < 10 || clientSecret.length < 10) {
    throw new Error(
      `[Reloadly Config] Credentials appear too short to be valid. ` +
      `RELOADLY_CLIENT_ID length: ${clientId.length}, RELOADLY_CLIENT_SECRET length: ${clientSecret.length}. ` +
      `Check your Reloadly dashboard for correct values.`
    );
  }

  const isSandbox =
    env.RELOADLY_BASE_URL?.includes("sandbox") ||
    env.RELOADLY_SANDBOX === "true" ||
    false;

  if (env.RELOADLY_AUTH_URL && isSandbox && !env.RELOADLY_AUTH_URL.includes("sandbox")) {
    console.warn(
      "[Reloadly Config] Sandbox mode detected but RELOADLY_AUTH_URL does not contain 'sandbox'. " +
      "Ensure sandbox credentials are used with sandbox endpoints."
    );
  }

  configValidated = true;
}

function getReloadlyConfig() {
  const env = getReloadlyEnv();

  if (!configValidated) {
    validateReloadlyConfig(env);
  }

  const isSandbox = env.RELOADLY_BASE_URL?.includes("sandbox") ||
                    env.RELOADLY_SANDBOX === "true" ||
                    false;

  const baseUrl = isSandbox
    ? "https://topups-sandbox.reloadly.com"
    : "https://topups.reloadly.com";

  const audience = isSandbox
    ? "https://topups-sandbox.reloadly.com"
    : "https://topups.reloadly.com";

  return {
    baseUrl,
    audience,
    authUrl: env.RELOADLY_AUTH_URL || "https://auth.reloadly.com/oauth/token",
    clientId: env.RELOADLY_CLIENT_ID,
    clientSecret: env.RELOADLY_CLIENT_SECRET,
    isSandbox,
  };
}

export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    const config = getReloadlyConfig();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
      const payload: AccessTokenRequest = {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "client_credentials",
        audience: config.audience,
      };

      const response = await fetch(config.authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let isInvalidCredentials = false;
        try {
          const parsed = JSON.parse(errorText);
          isInvalidCredentials = parsed.errorCode === "INVALID_CREDENTIALS" || parsed.message === "Access Denied";
        } catch { /* not JSON */ }

        if (isInvalidCredentials) {
          const err = new Error(`Reloadly authentication failed: INVALID_CREDENTIALS. Verify RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET match the ${config.isSandbox ? "sandbox" : "production"} environment.`);
          (err as any).code = "INVALID_CREDENTIALS";
          (err as any).retryable = false;
          throw err;
        }

        throw new Error(`Authentication failed: ${errorText}`);
      }

      const data: AccessTokenResponse200 = await response.json();
      const expiresIn = data.expires_in || 3600;

      tokenCache = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000,
      };

      return data.access_token;
    } catch (error) {
      if (error instanceof Error && (error as any).code !== "INVALID_CREDENTIALS") {
        console.error("[Reloadly Auth] error:", error.message);
      }
      throw error;
    } finally {
      clearTimeout(timer);
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

function isRetryable(status: number | undefined, error?: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") return false;
  if (error instanceof Error && (error as any).code === "INVALID_CREDENTIALS") return false;
  if (status === 401) return false;
  if (!status) return true;
  if (status >= 500) return true;
  if (status === 429) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildErrorResult(errorText: string, status: number): ApiResponse<never> {
  let errorCode = "RELOADLY_API_ERROR";
  let parsedError: ApiErrorResponse | null = null;

  try {
    parsedError = JSON.parse(errorText);
  } catch {
    // not JSON
  }

  if (parsedError?.errorCode === "INVALID_CREDENTIALS" || parsedError?.message === "Access Denied") {
    errorCode = "RELOADLY_INVALID_CREDENTIALS";
  } else if (status === 401) errorCode = "RELOADLY_AUTH_FAILED";
  else if (status === 400) errorCode = "RELOADLY_INVALID_REQUEST";
  else if (status === 404) errorCode = "RELOADLY_OPERATOR_NOT_FOUND";
  else if (status === 402) errorCode = "RELOADLY_INSUFFICIENT_BALANCE";
  else if (status === 422) errorCode = "RELOADLY_INVALID_PHONE";
  else if (status === 429) errorCode = "RELOADLY_RATE_LIMITED";
  else if (status === 500) errorCode = "RELOADLY_SERVER_ERROR";

  const errorMessage =
    parsedError?.message ||
    parsedError?.error ||
    errorText ||
    `HTTP ${status}`;

  return {
    success: false,
    error: errorMessage,
    errorCode,
    statusCode: status,
  };
}

async function reloadlyRequest<T>(
  endpoint: string,
  options: RequestInit & { skipRetry?: boolean; isMutating?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { skipRetry, isMutating, ...fetchOptions } = options;
  const config = getReloadlyConfig();
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const timeoutMs = isMutating ? TOPUP_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const maxAttempts = skipRetry ? 1 : MAX_RETRIES;
  let lastError: ApiResponse<T> | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const token = await getAccessToken(attempt > 1);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/com.reloadly.topups-v1+json",
          ...fetchOptions.headers,
        },
      });

      if (response.status === 401) {
        tokenCache = null;
        const errorText = await response.text();
        lastError = buildErrorResult(errorText, response.status);

        if (attempt < maxAttempts) {
          const jitter = Math.floor(Math.random() * 250);
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
          console.warn(`[Reloadly] 401 on ${endpoint}, invalidating token, retry ${attempt}/${maxAttempts} after ${delay}ms`);
          await sleep(delay);
          continue;
        }
        return lastError;
      }

      if (!response.ok) {
        const errorText = await response.text();
        lastError = buildErrorResult(errorText, response.status);

        if (!isRetryable(response.status) || skipRetry) {
          return lastError;
        }

        if (attempt < maxAttempts) {
          const jitter = Math.floor(Math.random() * 250);
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
          console.warn(`[Reloadly] Retrying ${endpoint} after ${delay}ms (attempt ${attempt}/${maxAttempts})`);
          await sleep(delay);
          continue;
        }
        return lastError;
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timer);

      const isAbort = error instanceof Error && error.name === "AbortError";
      const isInvalidCreds = error instanceof Error && (error as any).code === "INVALID_CREDENTIALS";
      const errorCode = isAbort
        ? (isMutating ? "RELOADLY_TIMEOUT_RECONCILIATION" : "RELOADLY_TIMEOUT")
        : isInvalidCreds
          ? "RELOADLY_INVALID_CREDENTIALS"
          : "RELOADLY_REQUEST_FAILED";
      const errorMsg = isAbort
        ? `Request to ${endpoint} timed out after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : "Request failed";

      lastError = {
        success: false,
        error: errorMsg,
        errorCode,
      };

      if (!isRetryable(undefined, error) || skipRetry || isAbort || isInvalidCreds) {
        return lastError;
      }

      if (attempt < maxAttempts) {
        const jitter = Math.floor(Math.random() * 250);
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
        console.warn(`[Reloadly] Retrying ${endpoint} after ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await sleep(delay);
        continue;
      }
      return lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  return lastError!;
}

// ─── Spec-driven API functions ────────────────────────────────────────────────

export async function getBalance(): Promise<ApiResponse<AccountsBalanceResponse>> {
  return reloadlyRequest<AccountsBalanceResponse>("/accounts/balance");
}

export async function getCountries(): Promise<ApiResponse<CountryResponse[]>> {
  return reloadlyRequest<CountryResponse[]>("/countries");
}

export async function getCountryByIso(
  isoCode: string
): Promise<ApiResponse<CountryResponse[]>> {
  return reloadlyRequest<CountryResponse[]>(`/countries/${isoCode}`);
}

export interface GetOperatorsParams {
  includeBundles?: boolean;
  includeData?: boolean;
  suggestedAmountsMap?: boolean;
  size?: number;
  page?: number;
  includeCombo?: boolean;
  comboOnly?: boolean;
  bundlesOnly?: boolean;
  dataOnly?: boolean;
  pinOnly?: boolean;
}

export async function getOperators(
  params?: GetOperatorsParams
): Promise<ApiResponse<{ content: OperatorResponse[] }>> {
  const query = new URLSearchParams();
  if (params?.includeBundles !== undefined) query.set("includeBundles", String(params.includeBundles));
  if (params?.includeData !== undefined) query.set("includeData", String(params.includeData));
  if (params?.suggestedAmountsMap !== undefined) query.set("suggestedAmountsMap", String(params.suggestedAmountsMap));
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.includeCombo !== undefined) query.set("includeCombo", String(params.includeCombo));
  if (params?.comboOnly !== undefined) query.set("comboOnly", String(params.comboOnly));
  if (params?.bundlesOnly !== undefined) query.set("bundlesOnly", String(params.bundlesOnly));
  if (params?.dataOnly !== undefined) query.set("dataOnly", String(params.dataOnly));
  if (params?.pinOnly !== undefined) query.set("pinOnly", String(params.pinOnly));
  const qs = query.toString();
  return reloadlyRequest<{ content: OperatorResponse[] }>(`/operators${qs ? `?${qs}` : ""}`);
}

export async function getOperatorById(
  operatorId: number
): Promise<ApiResponse<OperatorResponse>> {
  return reloadlyRequest<OperatorResponse>(`/operators/${operatorId}`);
}

export async function autoDetectOperator(
  phone: string | number,
  countryIsoCode: string,
  params?: { suggestedAmountsMap?: boolean; suggestedAmounts?: boolean }
): Promise<ApiResponse<OperatorResponse>> {
  const query = new URLSearchParams();
  if (params?.suggestedAmountsMap !== undefined) query.set("suggestedAmountsMap", String(params.suggestedAmountsMap));
  if (params?.suggestedAmounts !== undefined) query.set("suggestedAmounts", String(params.suggestedAmounts));
  const qs = query.toString();
  return reloadlyRequest<OperatorResponse>(
    `/operators/auto-detect/phone/${phone}/countries/${countryIsoCode}${qs ? `?${qs}` : ""}`
  );
}

export interface GetOperatorsByCountryParams {
  suggestedAmountsMap?: boolean;
  suggestedAmounts?: boolean;
  includePin?: boolean;
  includeData?: boolean;
  includeBundles?: boolean;
  includeCombo?: boolean;
  comboOnly?: boolean;
  bundlesOnly?: boolean;
  dataOnly?: boolean;
  pinOnly?: boolean;
}

export async function getOperatorsByCountry(
  countryCode: string,
  params?: GetOperatorsByCountryParams
): Promise<ApiResponse<{ content: OperatorResponse[] }>> {
  const query = new URLSearchParams();
  if (params?.suggestedAmountsMap !== undefined) query.set("suggestedAmountsMap", String(params.suggestedAmountsMap));
  if (params?.suggestedAmounts !== undefined) query.set("suggestedAmounts", String(params.suggestedAmounts));
  if (params?.includePin !== undefined) query.set("includePin", String(params.includePin));
  if (params?.includeData !== undefined) query.set("includeData", String(params.includeData));
  if (params?.includeBundles !== undefined) query.set("includeBundles", String(params.includeBundles));
  if (params?.includeCombo !== undefined) query.set("includeCombo", String(params.includeCombo));
  if (params?.comboOnly !== undefined) query.set("comboOnly", String(params.comboOnly));
  if (params?.bundlesOnly !== undefined) query.set("bundlesOnly", String(params.bundlesOnly));
  if (params?.dataOnly !== undefined) query.set("dataOnly", String(params.dataOnly));
  if (params?.pinOnly !== undefined) query.set("pinOnly", String(params.pinOnly));
  const qs = query.toString();
  return reloadlyRequest<{ content: OperatorResponse[] }>(`/operators/countries/${countryCode}${qs ? `?${qs}` : ""}`);
}

export async function getFxRate(
  params: FxRateRequest
): Promise<ApiResponse<FxRateResponse>> {
  return reloadlyRequest<FxRateResponse>("/operators/fx-rate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getCommissions(
  params?: { size?: number; page?: number }
): Promise<ApiResponse<{ content: CommissionResponse[] }>> {
  const query = new URLSearchParams();
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.page !== undefined) query.set("page", String(params.page));
  const qs = query.toString();
  return reloadlyRequest<{ content: CommissionResponse[] }>(`/operators/commissions${qs ? `?${qs}` : ""}`);
}

export async function getCommissionByOperatorId(
  operatorId: number
): Promise<ApiResponse<CommissionResponse>> {
  return reloadlyRequest<CommissionResponse>(`/operators/${operatorId}/commissions`);
}

export async function getPromotions(
  params?: { size?: number; page?: number; languageCode?: string }
): Promise<ApiResponse<{ content: PromotionResponse[] }>> {
  const query = new URLSearchParams();
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.languageCode) query.set("languageCode", params.languageCode);
  const qs = query.toString();
  return reloadlyRequest<{ content: PromotionResponse[] }>(`/promotions${qs ? `?${qs}` : ""}`);
}

export async function getPromotionById(
  promotionId: number,
  languageCode?: string
): Promise<ApiResponse<{ content: PromotionResponse }>> {
  const query = new URLSearchParams();
  if (languageCode) query.set("languageCode", languageCode);
  const qs = query.toString();
  return reloadlyRequest<{ content: PromotionResponse }>(`/promotions/${promotionId}${qs ? `?${qs}` : ""}`);
}

export async function getPromotionsByCountry(
  countryCode: string,
  languageCode?: string
): Promise<ApiResponse<{ content: PromotionResponse[] }>> {
  const query = new URLSearchParams();
  if (languageCode) query.set("languageCode", languageCode);
  const qs = query.toString();
  return reloadlyRequest<{ content: PromotionResponse[] }>(`/promotions/country-codes/${countryCode}${qs ? `?${qs}` : ""}`);
}

export async function getPromotionsByOperatorId(
  operatorId: number,
  languageCode?: string
): Promise<ApiResponse<{ content: PromotionResponse[] }>> {
  const query = new URLSearchParams();
  if (languageCode) query.set("languageCode", languageCode);
  const qs = query.toString();
  return reloadlyRequest<{ content: PromotionResponse[] }>(`/promotions/operators/${operatorId}${qs ? `?${qs}` : ""}`);
}

export async function makeTopup(
  params: TopUpsRequest
): Promise<ApiResponse<TopUpsResponse200>> {
  return reloadlyRequest<TopUpsResponse200>("/topups", {
    method: "POST",
    body: JSON.stringify(params),
    skipRetry: true,
    isMutating: true,
  });
}

export async function makeTopupAsync(
  params: TopUpsRequest
): Promise<ApiResponse<TopUpsAsyncResponse200>> {
  return reloadlyRequest<TopUpsAsyncResponse200>("/topups-async", {
    method: "POST",
    body: JSON.stringify(params),
    skipRetry: true,
    isMutating: true,
  });
}

export async function getTopupStatus(
  transactionId: number
): Promise<ApiResponse<TopUpsStatusResponse200>> {
  return reloadlyRequest<TopUpsStatusResponse200>(`/topups/${transactionId}/status`);
}

export interface GetTransactionsParams {
  size?: number;
  page?: number;
  countryCode?: string;
  operatorId?: string;
  operatorName?: string;
  customIdentifier?: string;
  startDate?: string;
  endDate?: string;
}

export async function getTransactions(
  params?: GetTransactionsParams
): Promise<ApiResponse<{ content: TransactionResponse[] }>> {
  const query = new URLSearchParams();
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.countryCode) query.set("countryCode", params.countryCode);
  if (params?.operatorId) query.set("operatorId", params.operatorId);
  if (params?.operatorName) query.set("operatorName", params.operatorName);
  if (params?.customIdentifier) query.set("customIdentifier", params.customIdentifier);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return reloadlyRequest<{ content: TransactionResponse[] }>(`/topups/reports/transactions${qs ? `?${qs}` : ""}`);
}

export async function getTransactionById(
  transactionId: number
): Promise<ApiResponse<TransactionResponse>> {
  return reloadlyRequest<TransactionResponse>(`/topups/reports/transactions/${transactionId}`);
}

export async function mnpLookupGet(
  phone: string | number,
  countryCode: string,
  params?: { suggestedAmountsMap?: boolean; suggestedAmounts?: boolean }
): Promise<ApiResponse<OperatorResponse>> {
  const query = new URLSearchParams();
  if (params?.suggestedAmountsMap !== undefined) query.set("suggestedAmountsMap", String(params.suggestedAmountsMap));
  if (params?.suggestedAmounts !== undefined) query.set("suggestedAmounts", String(params.suggestedAmounts));
  const qs = query.toString();
  return reloadlyRequest<OperatorResponse>(
    `/operators/mnp-lookup/phone/${phone}/countries/${countryCode}${qs ? `?${qs}` : ""}`
  );
}

export async function mnpLookupPost(
  params: NumberLookupRequest
): Promise<ApiResponse<OperatorResponse>> {
  return reloadlyRequest<OperatorResponse>("/mnp-lookup/operators", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getGhanaOperators(): Promise<ApiResponse<ReloadlyOperator[]>> {
  const result = await getOperatorsByCountry("GH", {
    includeBundles: true,
    includeData: true,
    includePin: true,
  });

  if (!result.success || !result.data) return result as unknown as ApiResponse<ReloadlyOperator[]>;

  const mapped: ReloadlyOperator[] = (result.data.content || []).map((op) => ({
    id: op.operatorId,
    name: op.name,
    countryCode: op.country.isoName,
    countryName: op.country.name,
    bundle: op.bundle,
    data: op.data,
    pin: op.pin,
    supportsLocalAmounts: op.supportsLocalAmounts,
    supportsGeographicalRechargePlans: false,
    denominationType: op.denominationType,
    senderCurrencyCode: op.senderCurrencyCode,
    senderCurrencyName: op.senderCurrencySymbol,
    destinationCurrencyCode: op.destinationCurrencyCode,
    destinationCurrencyName: op.destinationCurrencySymbol,
    commission: op.commission,
    internationalDiscount: op.internationalDiscount,
    localDiscount: op.localDiscount,
    mostPopularAmount: op.mostPopularAmount,
    mostPopularLocalAmount: null,
    minAmount: op.minAmount,
    maxAmount: op.maxAmount,
    localMinAmount: op.localMinAmount,
    localMaxAmount: op.localMaxAmount,
    fxRate: op.fx.rate,
    logoUrls: op.logoUrls,
    fixedAmounts: op.fixedAmounts,
    fixedAmountsDescriptions: Object.fromEntries(op.fixedAmountsDescriptions.map((d, i) => [i, d])),
    localFixedAmounts: op.localFixedAmounts,
    localFixedAmountsDescriptions: Object.fromEntries(op.localFixedAmountsDescriptions.map((d, i) => [i, d])),
    suggestedAmounts: op.suggestedAmounts,
    suggestedAmountsMap: op.suggestedAmountsMap,
    fees: op.fees?.international ?? 0,
    geographicalRechargePlans: [],
    promotions: op.promotions,
    status: "ACTIVE",
  }));

  return { success: true, data: mapped };
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
  const normalizedPhone = params.recipientPhone.replace(/\D/g, "");

  console.log("[Reloadly] purchaseAirtime START:", {
    operatorId: params.operatorId,
    amount: params.amount,
    phoneOriginal: params.recipientPhone,
    phoneNormalized: normalizedPhone,
    customIdentifier: params.customIdentifier,
  });

  const topupPayload: TopUpsRequest = {
    operatorId: String(params.operatorId),
    amount: String(params.amount),
    recipientPhone: {
      countryCode: "GH",
      number: normalizedPhone,
    },
  };

  if (params.senderPhone) {
    topupPayload.senderPhone = {
      countryCode: "GH",
      number: params.senderPhone.replace(/\D/g, ""),
    };
  }

  if (params.customIdentifier) {
    topupPayload.customIdentifier = params.customIdentifier;
  }

  const result = await makeTopup(topupPayload);

  if (!result.success || !result.data) {
    return result as unknown as ApiResponse<ReloadlyAirtimeResult>;
  }

  const d = result.data;
  const mapped: ReloadlyAirtimeResult = {
    transactionId: d.transactionId,
    status: d.status === "SUCCESSFUL" ? "SUCCESSFUL" : d.status === "FAILED" ? "FAILED" : "PENDING",
    operatorTransactionId: d.operatorTransactionId ?? undefined,
    recipientPhone: String(d.recipientPhone),
    recipientEmail: d.recipientEmail ?? undefined,
    senderPhone: d.senderPhone,
    countryCode: d.countryCode,
    operatorId: d.operatorId,
    operatorName: d.operatorName,
    discount: d.discount,
    requestedAmount: d.requestedAmount,
    deliveredAmount: d.deliveredAmount,
    currencyCode: d.deliveredAmountCurrencyCode,
    fee: d.fee,
    customIdentifier: d.customIdentifier ?? undefined,
  };

  console.log("[Reloadly] purchaseAirtime SUCCESS:", {
    transactionId: mapped.transactionId,
    status: mapped.status,
    recipientPhone: mapped.recipientPhone,
  });

  return { success: true, data: mapped };
}

export async function getTransactionStatus(
  transactionId: number
): Promise<ApiResponse<ReloadlyAirtimeResult>> {
  const result = await getTopupStatus(transactionId);

  if (!result.success || !result.data) {
    return result as unknown as ApiResponse<ReloadlyAirtimeResult>;
  }

  const t = result.data.transaction;
  const mapped: ReloadlyAirtimeResult = {
    transactionId: t.transactionId,
    status: result.data.status === "SUCCESSFUL" ? "SUCCESSFUL" : result.data.status === "FAILED" ? "FAILED" : "PENDING",
    operatorTransactionId: t.operatorTransactionId ?? undefined,
    recipientPhone: String(t.recipientPhone),
    recipientEmail: t.recipientEmail ?? undefined,
    senderPhone: t.senderPhone,
    countryCode: t.countryCode,
    operatorId: t.operatorId,
    operatorName: t.operatorName,
    discount: t.discount,
    requestedAmount: t.requestedAmount,
    deliveredAmount: t.deliveredAmount,
    currencyCode: t.deliveredAmountCurrencyCode,
    fee: t.fee,
    customIdentifier: t.customIdentifier ?? undefined,
  };

  return { success: true, data: mapped };
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
  tokenRefreshPromise = null;
  configValidated = false;
}
