import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  console.error("PAYSTACK_SECRET_KEY environment variable is not set");
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned" | "pending";
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      user_id?: string;
      transaction_type?: string;
      custom_fields?: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: PaystackVerifyResponse["data"];
}

// Generate a unique reference for transactions
export function generatePaystackReference(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `Topchart_${timestamp}_${randomStr}`.toUpperCase();
}

// Initialize a Paystack transaction
export async function initializePaystackTransaction(
  email: string,
  amount: number, // Amount in pesewas (GHS * 100)
  reference: string,
  metadata: Record<string, unknown> = {},
  callbackUrl?: string
): Promise<{ success: boolean; data?: PaystackInitializeResponse["data"]; error?: string }> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return { success: false, error: "Paystack configuration error - secret key not set" };
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        currency: "GHS",
        callback_url: callbackUrl,
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "Topchart Ghana",
            },
          ],
        },
      }),
    });

    const result: PaystackInitializeResponse = await response.json();

    if (!result.status) {
      return { success: false, error: result.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return { success: false, error: "Failed to initialize payment" };
  }
}

// Verify a Paystack transaction
export async function verifyPaystackTransaction(
  reference: string
): Promise<{ success: boolean; data?: PaystackVerifyResponse["data"]; error?: string }> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: PaystackVerifyResponse = await response.json();

    if (!result.status) {
      return { success: false, error: result.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Paystack verification error:", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

// List transactions from Paystack
export async function listPaystackTransactions(
  perPage: number = 50,
  page: number = 1,
  status?: string
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      perPage: perPage.toString(),
      page: page.toString(),
    });
    
    if (status) {
      params.append("status", status);
    }

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!result.status) {
      return { success: false, error: result.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Paystack list transactions error:", error);
    return { success: false, error: "Failed to list transactions" };
  }
}

// Get a single transaction
export async function getPaystackTransaction(
  transactionId: number
): Promise<{ success: boolean; data?: PaystackVerifyResponse["data"]; error?: string }> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: PaystackVerifyResponse = await response.json();

    if (!result.status) {
      return { success: false, error: result.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Paystack get transaction error:", error);
    return { success: false, error: "Failed to get transaction" };
  }
}
