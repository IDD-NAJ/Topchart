import { getPvadealsEnv, isPvadealsConfigured } from "@/lib/env";

// Lazy config loading - prevents startup crashes if env not set
function getPvadealsConfig() {
  const env = getPvadealsEnv();
  return {
    baseUrl: env.PVADEALS_BASE_URL || "https://prod-v3.pvadeals.com",
    apiKey: env.PVADEALS_API_KEY,
    markupPercent: parseFloat(env.PVADEALS_MARKUP_PERCENT || "40"),
    exchangeRate: parseFloat(env.USD_TO_GHS_RATE || "15.5"),
  };
}

export interface PVAService {
  _id: string;
  name: string;
  picture: string;
  country: string;
  STRprice: number;
  LTR3price: number;
  LTR7price: number;
  LTR14price: number;
  LTR30price: number;
}

export interface PVARequest {
  _id: string;
  serviceName: string;
  serviceId: string;
  number: string;
  status: "RESERVED" | "COMPLETED" | "FLAGGED" | "EXPIRED";
  country: string;
  amount: number;
  numberType: "STR" | "LTR";
  allowFlag: boolean;
  allowReuse: boolean;
  reuseCounter?: number;
  autoRenewEnable?: boolean;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
  messageCounter?: number;
}

export interface PVABalance {
  credits: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface PvaRequestOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  retries?: number;
}

/**
 * Make a request to the PVAdeals API with retry and timeout support.
 */
async function pvaRequest<T>(
  endpoint: string,
  options: PvaRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 30000, retries = 2, ...fetchOptions } = options;

  // Check if configured before making any request
  if (!isPvadealsConfigured()) {
    return { 
      success: false, 
      error: "PVADeals API key not configured. Set PVADEALS_API_KEY in environment variables." 
    };
  }

  const config = getPvadealsConfig();
  const url = `${config.baseUrl}${endpoint}`;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeout);

      let json: any;
      try {
        json = await response.json();
      } catch {
        const errMsg = `API returned non-JSON response (${response.status})`;
        console.error(`[PVADeals] ${errMsg} ${endpoint}`);
        return { success: false, error: errMsg };
      }

      if (!response.ok) {
        const errMsg = json?.message || json?.error || `API error ${response.status}`;
        console.error(`[PVADeals] API error (${response.status}) ${endpoint}:`, errMsg);
        
        // Don't retry on 4xx client errors (except 429 rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return { success: false, error: errMsg };
        }
        
        lastError = errMsg;
        
        // Continue to retry for 5xx or 429
        if (attempt < retries) {
          const backoffMs = 1000 * Math.pow(2, attempt);
          console.log(`[PVADeals] Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${retries})`);
          await new Promise(r => setTimeout(r, backoffMs));
          continue;
        }
        
        return { success: false, error: lastError };
      }

      return { success: true, data: json?.data, message: json?.message };
    } catch (err) {
      clearTimeout(timeout);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          lastError = `Request timed out after ${timeoutMs}ms`;
        } else {
          lastError = err.message;
        }
      } else {
        lastError = "Request failed";
      }
      
      console.error(`[PVADeals] Request failed (attempt ${attempt + 1}/${retries + 1}):`, lastError);
      
      if (attempt < retries) {
        const backoffMs = 1000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }
    }
  }

  return { success: false, error: lastError || "Request failed after retries" };
}

export async function getBalance(): Promise<ApiResponse<PVABalance>> {
  const res = await pvaRequest<{ credits: number }>("/v3/api/balance");
  return res;
}

export async function getAllServices(): Promise<ApiResponse<{ services: PVAService[] }>> {
  return pvaRequest<{ services: PVAService[] }>("/v3/api/services/all");
}

export interface AreaCodeInfo {
  code: string;
  state: string;
  available?: boolean;
}

export async function getServiceAreaCodes(serviceId: string): Promise<ApiResponse<{ areaCodes: AreaCodeInfo[] }>> {
  return pvaRequest<{ areaCodes: AreaCodeInfo[] }>(`/v3/api/services/${serviceId}/area-codes`);
}

export async function getAllAreaCodes(): Promise<ApiResponse<{ areaCodes: AreaCodeInfo[] }>> {
  return pvaRequest<{ areaCodes: AreaCodeInfo[] }>("/v3/api/area-codes");
}

export async function getPopularServiceAreaCodes(): Promise<ApiResponse<{ areaCodes: AreaCodeInfo[] }>> {
  console.log("[PVADeals] Fetching all services to find area codes");
  const allServicesResult = await getAllServices();
  
  if (!allServicesResult.success) {
    console.error("[PVADeals] Failed to fetch services for area codes:", allServicesResult.error);
    return { success: false, error: allServicesResult.error || "Failed to fetch services" };
  }
  
  const services = allServicesResult.data?.services || [];
  console.log(`[PVADeals] Trying ${services.length} services for area codes`);
  
  if (services.length === 0) {
    console.error("[PVADeals] No services available");
    return { success: false, error: "No services available" };
  }
  
  const popularServices = services.slice(0, 5);
  
  for (const service of popularServices) {
    try {
      console.log(`[PVADeals] Fetching area codes for service: ${service.name} (${service._id})`);
      const result = await getServiceAreaCodes(service._id);
      console.log(`[PVADeals] Area codes result for ${service.name}:`, result.success, result.data?.areaCodes?.length || 0);
      if (result.success && result.data?.areaCodes && result.data.areaCodes.length > 0) {
        console.log(`[PVADeals] Found ${result.data.areaCodes.length} area codes from service ${service.name}`);
        return result;
      }
    } catch (error) {
      console.log(`[PVADeals] Failed to fetch area codes for service ${service.name}:`, error);
      continue;
    }
  }
  
  console.error("[PVADeals] No area codes available from any service");
  return { success: false, error: "No area codes available from any service" };
}

export interface STRPurchaseResult {
  requests: PVARequest[];
}

export async function purchaseSTR(
  serviceId: string,
  areaCode?: string
): Promise<ApiResponse<STRPurchaseResult>> {
  return pvaRequest<STRPurchaseResult>("/v3/api/purchase", {
    method: "POST",
    body: JSON.stringify({
      services: [{ serviceId, areaCode: areaCode || "" }],
    }),
  });
}

export type LTRDuration = 3 | 7 | 14 | 28 | 30;

export async function purchaseLTR(
  serviceId: string,
  duration: LTRDuration,
  areaCode?: string
): Promise<ApiResponse<PVARequest>> {
  return pvaRequest<PVARequest>("/v3/api/purchase-ltr", {
    method: "POST",
    body: JSON.stringify({
      duration,
      serviceId,
      areaCode: areaCode || "",
    }),
  });
}

export async function flagNumber(requestId: string): Promise<ApiResponse<boolean>> {
  const res = await pvaRequest<boolean>(`/v3/api/flag/${requestId}`, { method: "POST" });
  return res;
}

export async function reuseNumber(requestId: string): Promise<ApiResponse<PVARequest>> {
  return pvaRequest<PVARequest>(`/v3/api/reuse/${requestId}`, { method: "POST" });
}

export async function toggleAutoRenew(requestId: string): Promise<ApiResponse<PVARequest>> {
  return pvaRequest<PVARequest>(`/v3/api/renew-ltr/${requestId}`, { method: "POST" });
}

export interface RequestsPage {
  data: {
    edges: Array<{
      cursor: string;
      node: PVARequest;
    }>;
    pageInfo?: {
      endCursor: string;
      hasNextPage: boolean;
    };
  };
}

export async function listRequests(
  first = 20,
  after?: string
): Promise<ApiResponse<RequestsPage>> {
  const params = new URLSearchParams({
    first: String(first),
    orderField: "_id",
    orderBy: "desc",
  });
  if (after) params.set("after", after);
  return pvaRequest<RequestsPage>(`/v3/api/requests?${params.toString()}`);
}

export async function getRequest(requestId: string): Promise<ApiResponse<PVARequest>> {
  return pvaRequest<PVARequest>(`/v3/api/request/${requestId}`);
}

export function getPriceForType(
  service: PVAService,
  type: "STR" | "LTR",
  ltrDays?: LTRDuration
): number {
  if (type === "STR") return service.STRprice;
  switch (ltrDays) {
    case 3:  return service.LTR3price;
    case 7:  return service.LTR7price;
    case 14: return service.LTR14price;
    case 28:
    case 30: return service.LTR30price;
    default: return service.LTR3price;
  }
}

export function calculateUserPrice(
  pvaDealsPriceUSD: number,
  usdToGhsRate: number,
  markupPercent: number
): number {
  const ghsBase = pvaDealsPriceUSD * usdToGhsRate;
  const withMarkup = ghsBase * (1 + markupPercent / 100);
  return Math.ceil(withMarkup * 100) / 100;
}

export function mapCategoryByName(name: string): string {
  const lower = name.toLowerCase();
  if (/whatsapp|telegram|facebook|instagram|twitter|tiktok|snapchat|google|gmail|microsoft|discord|slack|signal|viber|line|wechat|skype|zoom/.test(lower))
    return "social_media";
  if (/amazon|ebay|paypal|venmo|cashapp|stripe|shopify|etsy|walmart|alibaba|bank|finance|crypto|coinbase/.test(lower))
    return "ecommerce_financial";
  if (/linkedin|github|dropbox|adobe|salesforce|hubspot|trello|notion|figma|jira/.test(lower))
    return "professional_tools";
  if (/netflix|spotify|youtube|hulu|disney|twitch|tidal|deezer|apple|steam|gaming/.test(lower))
    return "streaming_entertainment";
  return "social_media";
}

// Lazy-loaded exchange rate and markup values
export function getUsdToGhsRate(): number {
  if (!isPvadealsConfigured()) return 15.5;
  return getPvadealsConfig().exchangeRate;
}

export function getDefaultMarkupPercent(): number {
  if (!isPvadealsConfigured()) return 40;
  return getPvadealsConfig().markupPercent;
}

// Legacy exports for backward compatibility
export const USD_TO_GHS_RATE = 15.5;
export const DEFAULT_MARKUP_PERCENT = 40;
