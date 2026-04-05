/**
 * Textverified API Client
 * 
 * Integration with Textverified.com for phone number verification services
 * API Documentation: https://docs.textverified.com
 */

const TEXTVERIFIED_API_URL = process.env.TEXTVERIFIED_API_URL || "https://api.textverified.com";
const TEXTVERIFIED_API_KEY = process.env.TEXTVERIFIED_API_KEY || "";

interface TextverifiedService {
  id: string;
  name: string;
  description: string;
  price: number;
  country: string;
  category?: string;
}

interface TextverifiedNumber {
  order_id: string;
  target_id: string;
  number: string;
  service: string;
  expires_at: string;
  status: "active" | "completed" | "cancelled" | "expired";
}

interface TextverifiedSMS {
  id: string;
  from: string;
  message: string;
  received_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make authenticated request to Textverified API
 */
async function textverifiedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!TEXTVERIFIED_API_KEY) {
    return { success: false, error: "Textverified API key not configured" };
  }

  try {
    const url = `${TEXTVERIFIED_API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${TEXTVERIFIED_API_KEY}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Textverified API error (${response.status}):`, errorText);
      return {
        success: false,
        error: `API error: ${response.status} - ${errorText || response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Textverified API request failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/**
 * Get available services from Textverified
 */
export async function getAvailableServices(): Promise<ApiResponse<TextverifiedService[]>> {
  return textverifiedRequest<TextverifiedService[]>("/services");
}

/**
 * Get specific service details
 */
export async function getService(serviceId: string): Promise<ApiResponse<TextverifiedService>> {
  return textverifiedRequest<TextverifiedService>(`/services/${serviceId}`);
}

/**
 * Purchase/rent a phone number for verification
 * 
 * @param serviceId - The service to verify with (e.g., 'whatsapp', 'telegram')
 * @param type - 'onetime' or 'rental'
 * @param durationHours - For rentals, duration in hours (default 24)
 */
export async function purchaseNumber(
  serviceId: string,
  type: "onetime" | "rental" = "onetime",
  durationHours: number = 24
): Promise<ApiResponse<TextverifiedNumber>> {
  const endpoint = type === "rental" 
    ? `/rentals?service=${serviceId}&hours=${durationHours}`
    : `/purchases?service=${serviceId}`;
  
  return textverifiedRequest<TextverifiedNumber>(endpoint, {
    method: "POST",
  });
}

/**
 * Check SMS messages for a number/order
 */
export async function checkSMS(orderId: string): Promise<ApiResponse<TextverifiedSMS[]>> {
  return textverifiedRequest<TextverifiedSMS[]>(`/orders/${orderId}/sms`);
}

/**
 * Get single SMS message by ID
 */
export async function getSMS(smsId: string): Promise<ApiResponse<TextverifiedSMS>> {
  return textverifiedRequest<TextverifiedSMS>(`/sms/${smsId}`);
}

/**
 * Cancel an active order/number
 */
export async function cancelOrder(orderId: string): Promise<ApiResponse<{ cancelled: boolean }>> {
  return textverifiedRequest<{ cancelled: boolean }>(`/orders/${orderId}/cancel`, {
    method: "POST",
  });
}

/**
 * Extend a rental
 * 
 * @param orderId - The rental order ID
 * @param extensionHours - Hours to extend (1, 6, 12, 24, 72, 168)
 */
export async function extendRental(
  orderId: string,
  extensionHours: number
): Promise<ApiResponse<{ new_expires_at: string; extension_price: number }>> {
  return textverifiedRequest<{ new_expires_at: string; extension_price: number }>(
    `/rentals/${orderId}/extend`,
    {
      method: "POST",
      body: JSON.stringify({ hours: extensionHours }),
    }
  );
}

/**
 * Get order status and details
 */
export async function getOrderStatus(orderId: string): Promise<ApiResponse<TextverifiedNumber>> {
  return textverifiedRequest<TextverifiedNumber>(`/orders/${orderId}`);
}

/**
 * Get balance information
 */
export async function getBalance(): Promise<ApiResponse<{ balance: number; currency: string }>> {
  return textverifiedRequest<{ balance: number; currency: string }>("/account/balance");
}

/**
 * Calculate final price with markup
 */
export function calculatePrice(baseCost: number, markupPercentage: number): number {
  const markup = baseCost * (markupPercentage / 100);
  return Number((baseCost + markup).toFixed(2));
}

/**
 * Calculate rental price based on duration
 */
export function calculateRentalPrice(
  baseCost: number,
  markupPercentage: number,
  rentalMultiplier: number,
  durationHours: number
): number {
  const hourlyRate = baseCost * rentalMultiplier;
  const totalBase = hourlyRate * (durationHours / 24);
  return calculatePrice(totalBase, markupPercentage);
}

/**
 * Map Textverified service category to our categories
 */
export function mapCategory(textverifiedCategory: string): string {
  const categoryMap: Record<string, string> = {
    "social": "social_media",
    "messaging": "social_media",
    "financial": "ecommerce_financial",
    "payment": "ecommerce_financial",
    "shopping": "ecommerce_financial",
    "professional": "professional_tools",
    "entertainment": "streaming_entertainment",
    "streaming": "streaming_entertainment",
  };

  return categoryMap[textverifiedCategory.toLowerCase()] || "social_media";
}

export type {
  TextverifiedService,
  TextverifiedNumber,
  TextverifiedSMS,
  ApiResponse,
};
