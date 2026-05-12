/**
 * Airalo eSIM Partner API Client
 * Documentation: https://developers.partners.airalo.com/
 * 
 * Features:
 * - OAuth 2.0 authentication with automatic token refresh
 * - Browse eSIM packages by country/region
 * - Submit orders (sync and async)
 * - Get eSIM details and installation instructions
 * - Top-up existing eSIMs
 * - Webhook handling for order status updates
 */

import crypto from "crypto";
import { getAiraloEnv } from "./env";

const AIRALO_BASE_URL = "https://partners-api.airalo.com/v2";
const TOKEN_CACHE_KEY = "airalo_token_cache";
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

// Types
interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

interface AiraloAuthResponse {
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface AiraloPackage {
  id: string;
  slug: string;
  type: string;
  price: number;
  net_price: number;
  currency: string;
  title: string;
  data: string;
  validity: number;
  day: number;
  voice?: string;
  sms?: string;
  operators: Array<{
    id: number;
    name: string;
    network_type: string;
    cover: {
      countries: number;
      image: string;
    };
  }>;
  image: {
    width: number;
    height: number;
    url: string;
    thumbnail_url: string;
  };
  countries: string[];
  top_up_packages?: AiraloPackage[];
}

export interface AiraloOrderRequest {
  package_id: string;
  quantity?: number;
  type?: "sim" | "voucher";
  description?: string;
  brand_settings_name?: string;
  tos_consent?: boolean;
  customer_id?: string;
  esim_cloud?: number;
  start_date?: string; // ISO 8601 for future orders
}

export interface AiraloOrderResponse {
  data: {
    id: string;
    code: string;
    currency: string;
    quantity: number;
    type: string;
    package_id: string;
    data: string;
    validity: number;
    price: number;
    created_at: string;
    manual_install?: string;
    qrcode?: string;
    qrcode_data?: string;
    iccid?: string;
    lpa?: string;
    apn_type?: string;
    apn?: string;
    roaming?: boolean;
  };
}

export interface AiraloESim {
  iccid: string;
  lpa: string;
  code: string;
  apn_type?: string;
  apn?: string;
  qrcode?: string;
  qrcode_data?: string;
  manual_installation?: string;
}

export interface AiraloWebhookPayload {
  event: "order_completed" | "order_failed" | "esim_low_data" | "esim_zero_data" | "credit_limit_reached";
  data: {
    order_id?: string;
    iccid?: string;
    package_id?: string;
    timestamp: string;
  };
}

// Get credentials from environment
function getCredentials() {
  const env = getAiraloEnv();
  return {
    clientId: env.AIRALO_CLIENT_ID || "",
    clientSecret: env.AIRALO_CLIENT_SECRET || "",
    sandbox: env.AIRALO_SANDBOX === "true",
  };
}

// Token management (server-side only)
let serverTokenCache: TokenCache | null = null;

function getTokenCache(): TokenCache | null {
  if (typeof window === "undefined") {
    return serverTokenCache;
  }
  // Client-side: can't cache securely, return null
  return null;
}

function setTokenCache(cache: TokenCache | null): void {
  if (typeof window === "undefined") {
    serverTokenCache = cache;
  }
}

// Request access token
async function getAccessToken(): Promise<string> {
  const cache = getTokenCache();
  const now = Date.now();

  if (cache && cache.expiresAt > now + TOKEN_EXPIRY_BUFFER_MS) {
    return cache.accessToken;
  }

  const { clientId, clientSecret } = getCredentials();

  if (!clientId || !clientSecret) {
    throw new Error("Airalo credentials not configured");
  }

  const response = await fetch(`${AIRALO_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airalo auth failed: ${response.status} ${error}`);
  }

  const data: AiraloAuthResponse = await response.json();
  const expiresAt = now + data.data.expires_in * 1000;

  setTokenCache({
    accessToken: data.data.access_token,
    expiresAt,
  });

  return data.data.access_token;
}

// Make authenticated request
async function airaloRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const url = `${AIRALO_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airalo API error: ${response.status} ${error}`);
  }

  return response.json();
}

// Get all packages (with optional filters)
export async function getPackages(params?: {
  country?: string;
  type?: "local" | "global" | "regional";
  limit?: number;
  includeTopUp?: boolean;
}): Promise<{ data: AiraloPackage[]; meta: { last_page: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.country) searchParams.set("filter[country]", params.country);
  if (params?.type) searchParams.set("filter[type]", params.type);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.includeTopUp) searchParams.set("include", "top-up");

  const query = searchParams.toString();
  return airaloRequest(`/packages${query ? `?${query}` : ""}`);
}

// Submit order (synchronous)
export async function submitOrder(
  order: AiraloOrderRequest
): Promise<AiraloOrderResponse> {
  return airaloRequest("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

// Submit order (asynchronous - for large orders)
export async function submitOrderAsync(
  order: AiraloOrderRequest
): Promise<{ data: { order_id: string; status: string } }> {
  return airaloRequest("/orders/async", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

// Get order details
export async function getOrder(orderId: string): Promise<AiraloOrderResponse> {
  return airaloRequest(`/orders/${orderId}`);
}

// Get eSIM details
export async function getESim(iccid: string): Promise<{ data: AiraloESim }> {
  return airaloRequest(`/sims/${iccid}`);
}

// Get eSIM installation instructions
export async function getInstallationInstructions(
  iccid: string
): Promise<{
  data: {
    iccid: string;
    install_url: string;
    install_explanation: string[];
    qr_code_data: string;
    manual_installation: string;
  };
}> {
  return airaloRequest(`/sims/${iccid}/installations/instructions`);
}

// Get top-up packages for an eSIM
export async function getTopUpPackages(
  iccid: string
): Promise<{ data: AiraloPackage[] }> {
  return airaloRequest(`/sims/${iccid}/top-ups`);
}

// Submit top-up order
export async function submitTopUp(params: {
  iccid: string;
  package_id: string;
  description?: string;
}): Promise<AiraloOrderResponse> {
  return airaloRequest(`/sims/${params.iccid}/top-ups`, {
    method: "POST",
    body: JSON.stringify({
      package_id: params.package_id,
      description: params.description,
    }),
  });
}

// Get eSIM usage
export async function getESimUsage(iccid: string): Promise<{
  data: {
    iccid: string;
    status: string;
    remaining_data: string;
    remaining_voice?: string;
    remaining_sms?: string;
    total_data: string;
    total_voice?: string;
    total_sms?: string;
    expired_at: string;
  };
}> {
  return airaloRequest(`/sims/${iccid}/usage`);
}

// Get account balance
export async function getBalance(): Promise<{
  data: {
    currency: string;
    current_balance: number;
    available_balance: number;
    credit_limit: number;
  };
}> {
  return airaloRequest("/balance");
}

// Verify webhook signature (HMAC SHA256)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

// Parse webhook payload
export function parseWebhook(payload: string): AiraloWebhookPayload {
  return JSON.parse(payload);
}

// Sync packages to database (for caching/pricing)
export async function syncPackagesToDatabase(): Promise<{
  added: number;
  updated: number;
  errors: string[];
}> {
  const { sql } = await import("./db");
  const result = { added: 0, updated: 0, errors: [] as string[] };

  try {
    const { data: packages } = await getPackages({ limit: 100 });

    for (const pkg of packages) {
      try {
        // Extract country code and region from first operator
        const operator = pkg.operators?.[0];
        const country = pkg.countries?.[0] || "";

        // Determine region based on countries
        const regionMap: Record<string, string> = {
          GH: "africa",
          NG: "africa",
          KE: "africa",
          ZA: "africa",
          GB: "europe",
          DE: "europe",
          FR: "europe",
          US: "americas",
          CA: "americas",
          AE: "middle_east",
          IN: "asia",
          JP: "asia",
        };

        const region = regionMap[country] || "global";

        // Check if package exists
        const existing = await sql`
          SELECT id FROM esim_data_packages WHERE id = ${pkg.slug}
        `;

        if (existing.length > 0) {
          // Update existing
          await sql`
            UPDATE esim_data_packages SET
              country = ${country},
              country_code = ${country},
              data_allowance = ${pkg.data},
              validity = ${pkg.validity + " Days"},
              price = ${pkg.net_price},
              network = ${operator?.name || "Multiple"},
              speed = ${operator?.network_type || "4G/LTE"},
              region = ${region},
              updated_at = NOW()
            WHERE id = ${pkg.slug}
          `;
          result.updated++;
        } else {
          // Insert new
          await sql`
            INSERT INTO esim_data_packages (
              id, country, country_code, flag, data_allowance, validity,
              price, network, speed, region, is_active, sort_order
            ) VALUES (
              ${pkg.slug},
              ${country},
              ${country},
              ${"🌍"},
              ${pkg.data},
              ${pkg.validity + " Days"},
              ${pkg.net_price * 15.5}, // Convert to GHS with markup
              ${operator?.name || "Multiple"},
              ${operator?.network_type || "4G/LTE"},
              ${region},
              true,
              0
            )
          `;
          result.added++;
        }
      } catch (err: any) {
        result.errors.push(`Package ${pkg.slug}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Sync failed: ${err.message}`);
  }

  return result;
}
