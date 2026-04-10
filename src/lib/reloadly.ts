import { getServerEnv } from "@/lib/env";

const env = getServerEnv();
const RELOADLY_BASE_URL = env.RELOADLY_API_BASE_URL || "https://giftcards.reloadly.com";
const RELOADLY_CLIENT_ID = env.RELOADLY_CLIENT_ID || "";
const RELOADLY_CLIENT_SECRET = env.RELOADLY_CLIENT_SECRET || "";
const RELOADLY_SANDBOX = env.RELOADLY_SANDBOX === "true";

export interface ReloadlyProduct {
  productId: number;
  productName: string;
  brandName: string;
  countryIsoName: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  denominationType: string;
  minRecipientDenomination: number;
  maxRecipientDenomination: number;
  senderFee: number;
  discountPercentage: number;
  logoUrl: string;
  cardType: string;
  recipientCurrencyCode: string;
  fixedDenominations?: Array<{
    denomination: number;
    currencyCode: string;
  }>;
  fixedRecipientDenominations?: Array<{
    denomination: number;
    currencyCode: string;
  }>;
}

export interface ReloadlyOrder {
  orderId: number;
  status: string;
  customIdentifier: string;
  product: {
    productId: number;
    productName: string;
    brandName: string;
    countryIsoName: string;
    currencyCode: string;
  };
  recipientEmail: string;
  recipientPhone: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currencyCode: string;
  fee: number;
  discount: number;
  deliveryDate: string;
  expiryDate: string;
  cardNumber: string;
  cardPin: string;
  cardCode: string;
}

export interface ReloadlyBalance {
  balance: number;
  currencyCode: string;
}

export interface ReloadlyDiscount {
  productId: number;
  discountPercentage: number;
  validFrom: string;
  validTo: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!RELOADLY_CLIENT_ID || !RELOADLY_CLIENT_SECRET) {
    throw new Error("RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET must be set in environment variables");
  }

  const authUrl = RELOADLY_SANDBOX 
    ? "https://auth.reloadly.com/oauth/token"
    : "https://auth.reloadly.com/oauth/token";

  console.log("[Reloadly] Attempting authentication...", {
    sandbox: RELOADLY_SANDBOX,
    authUrl,
    hasClientId: !!RELOADLY_CLIENT_ID,
    hasClientSecret: !!RELOADLY_CLIENT_SECRET,
  });

  try {
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: RELOADLY_CLIENT_ID,
        client_secret: RELOADLY_CLIENT_SECRET,
        grant_type: "client_credentials",
        audience: "https://giftcards.reloadly.com",
      }),
    });

    console.log("[Reloadly] Auth response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Reloadly] Auth failed:", response.status, errorText);
      throw new Error(`Failed to authenticate with Reloadly: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("[Reloadly] Auth successful, token received");
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    
    if (!accessToken) {
      throw new Error("Failed to obtain access token from Reloadly");
    }
    
    return accessToken;
  } catch (error) {
    console.error("[Reloadly] Authentication error:", error);
    throw error;
  }
}

async function reloadlyRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAccessToken();
    const url = `${RELOADLY_BASE_URL}${endpoint}`;
    
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    });

    if (options.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => headers.set(key, value));
    }

    if (options.method && options.method !== 'GET') {
      headers.set("Content-Type", "application/json");
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      const errMsg = json?.message || json?.error || `API error ${response.status}`;
      console.error(`Reloadly API error (${response.status}) ${endpoint}:`, errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true, data: json, message: json?.message };
  } catch (err) {
    console.error("Reloadly request failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function getProducts(
  country?: string,
  category?: string
): Promise<ApiResponse<ReloadlyProduct[]>> {
  const params = new URLSearchParams();
  if (country) params.set("countryIsoName", country);
  if (category) params.set("category", category);
  
  console.log("[Reloadly] Fetching products with params:", {
    country,
    category,
    baseUrl: RELOADLY_BASE_URL,
    sandbox: RELOADLY_SANDBOX,
  });
  
  const endpoint = `/products?${params.toString()}`;
  console.log(`[Reloadly] Fetching from endpoint: ${endpoint}`);
  const result = await reloadlyRequest<ReloadlyProduct[]>(endpoint);

  console.log(`[Reloadly] Result:`, {
    success: result.success,
    hasData: !!result.data,
    error: result.error,
    dataLength: result.data?.length,
  });

  return result;
}

export async function getProductById(productId: string): Promise<ApiResponse<ReloadlyProduct>> {
  return reloadlyRequest<ReloadlyProduct>(`/products/${productId}`);
}

export async function getDiscounts(): Promise<ApiResponse<ReloadlyDiscount[]>> {
  return reloadlyRequest<ReloadlyDiscount[]>("/discounts");
}

export async function getDiscountByProductId(productId: string): Promise<ApiResponse<ReloadlyDiscount[]>> {
  return reloadlyRequest<ReloadlyDiscount[]>(`/discounts/products/${productId}`);
}

export interface PurchaseGiftCardParams {
  productId: string;
  quantity: number;
  recipientEmail: string;
  recipientPhone?: string;
  customIdentifier?: string;
  senderName?: string;
  senderMessage?: string;
}

export async function purchaseGiftCard(
  params: PurchaseGiftCardParams
): Promise<ApiResponse<ReloadlyOrder>> {
  return reloadlyRequest<ReloadlyOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getOrderDetails(orderId: string): Promise<ApiResponse<ReloadlyOrder>> {
  return reloadlyRequest<ReloadlyOrder>(`/orders/${orderId}`);
}

export async function getTransactionDetails(transactionId: string): Promise<ApiResponse<ReloadlyOrder>> {
  return reloadlyRequest<ReloadlyOrder>(`/transactions/${transactionId}`);
}

export async function getBalance(): Promise<ApiResponse<ReloadlyBalance>> {
  return reloadlyRequest<ReloadlyBalance>("/accounts/balance");
}

export function calculateUserPrice(
  reloadlyPriceUSD: number,
  usdToGhsRate: number,
  markupPercent: number
): number {
  const ghsBase = reloadlyPriceUSD * usdToGhsRate;
  const withMarkup = ghsBase * (1 + markupPercent / 100);
  return Math.ceil(withMarkup * 100) / 100;
}

export const USD_TO_GHS_RATE = parseFloat(env.USD_TO_GHS_RATE || "15.5");
export const DEFAULT_GIFTCARD_MARKUP = parseFloat(env.DEFAULT_GIFTCARD_MARKUP || "40");

export function mapCategoryByBrand(brandName: string): string {
  const brand = brandName.toLowerCase();
  
  const gamingBrands = [
    'steam', 'playstation', 'xbox', 'nintendo', 'epic games', 'ea', 'ubisoft',
    'blizzard', 'riot games', 'roblox', 'minecraft', 'fortnite', 'call of duty',
    'playstation store', 'xbox live', 'nintendo eshop', 'google play', 'apple itunes'
  ];
  
  const shoppingBrands = [
    'amazon', 'ebay', 'walmart', 'target', 'best buy', 'ikea', 'home depot',
    'lowes', 'macys', 'nordstrom', 'kohl', 'jcpenney', 'sephora', 'ulta'
  ];
  
  const entertainmentBrands = [
    'netflix', 'hulu', 'disney', 'hbo', 'spotify', 'apple music', 'youtube',
    'amazon prime', 'paramount', 'peacock', 'twitch', 'audible', 'kindle'
  ];
  
  const lifestyleBrands = [
    'starbucks', 'mcdonalds', 'subway', 'chipotle', 'uber', 'lyft', 'airbnb',
    'hotel', 'marriott', 'hilton', 'booking', 'expedia', 'groupon'
  ];
  
  const softwareBrands = [
    'microsoft', 'adobe', 'autodesk', 'intuit', 'quickbooks', 'turbotax',
    'norton', 'mcafee', 'avg', 'office 365', 'windows', 'google workspace'
  ];
  
  const foodBrands = [
    'doordash', 'grubhub', 'uber eats', 'instacart', 'whole foods', 'fresh direct',
    'blue apron', 'hellofresh', 'home chef', 'sunbasket'
  ];

  if (gamingBrands.some(b => brand.includes(b))) return 'gaming';
  if (shoppingBrands.some(b => brand.includes(b))) return 'shopping';
  if (entertainmentBrands.some(b => brand.includes(b))) return 'entertainment';
  if (lifestyleBrands.some(b => brand.includes(b))) return 'lifestyle';
  if (softwareBrands.some(b => brand.includes(b))) return 'software';
  if (foodBrands.some(b => brand.includes(b))) return 'food';
  
  return 'shopping';
}
