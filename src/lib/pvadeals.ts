const PVADEALS_BASE_URL = process.env.PVADEALS_BASE_URL || "https://prod-v3.pvadeals.com";
const PVADEALS_API_KEY = process.env.PVADEALS_API_KEY || "";

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

async function pvaRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!PVADEALS_API_KEY) {
    return { success: false, error: "PVADeals API key not configured. Set PVADEALS_API_KEY in .env.local" };
  }

  try {
    const url = `${PVADEALS_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${PVADEALS_API_KEY}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const json = await response.json();

    if (!response.ok) {
      const errMsg = json?.message || json?.error || `API error ${response.status}`;
      console.error(`PVADeals API error (${response.status}) ${endpoint}:`, errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true, data: json.data, message: json.message };
  } catch (err) {
    console.error("PVADeals request failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
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

export const USD_TO_GHS_RATE = parseFloat(process.env.USD_TO_GHS_RATE || "15.5");
export const DEFAULT_MARKUP_PERCENT = parseFloat(process.env.PVADEALS_MARKUP_PERCENT || "40");
