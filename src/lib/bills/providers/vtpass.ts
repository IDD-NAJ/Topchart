import { getVtpassEnv } from "@/lib/env";
import { providerRequest } from "@/lib/providers/http-client";
import type {
  BillCategory,
  BillProviderInterface,
  BillService,
  BillVariation,
  BillValidationResult,
  BillPaymentRequest,
  BillPaymentResult,
  BillProvider,
} from "../types";

const DEFAULT_BASE_URL = "https://api.vtpass.com/api";
const SANDBOX_BASE_URL = "https://sandbox.vtpass.com/api";
const REQUEST_TIMEOUT_MS = 15000;

interface VtpassConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
}

function getVtpassConfig(): VtpassConfig {
  const env = getVtpassEnv();
  const isSandbox = env.VTPASS_SANDBOX === "true";
  return {
    baseUrl: env.VTPASS_BASE_URL || (isSandbox ? SANDBOX_BASE_URL : DEFAULT_BASE_URL),
    apiKey: env.VTPASS_API_KEY,
    secretKey: env.VTPASS_SECRET_KEY,
  };
}

interface VtpassService {
  identifier: string;
  name: string;
}

interface VtpassServiceResponse {
  response_description: string;
  content: VtpassService[];
}

interface VtpassVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
}

interface VtpassVariationsResponse {
  response_description: string;
  content: {
    ServiceName: string;
    variations: VtpassVariation[];
  };
}

interface VtpassValidationRequest {
  billersCode: string;
  serviceID: string;
  type?: string;
}

interface VtpassValidationResponse {
  code: string;
  content: {
    Customer_Name?: string;
    Customer_Address?: string;
    Customer_Arrears?: string;
    Due_Date?: string;
    Invalid?: boolean;
    error?: string;
  };
}

interface VtpassPaymentRequest {
  request_id: string;
  serviceID: string;
  billersCode: string;
  variation_code?: string;
  amount?: number;
  phone: string;
}

interface VtpassPaymentResponse {
  code: string;
  response_description: string;
  requestId: string;
  transactionId: string;
  amount: string;
  status: string;
  purchased_code?: string;
  content?: {
    transactions?: {
      status: string;
      product_name: string;
      unique_element: string;
      unit_price: string;
      quantity: string;
      service_verification: string | null;
      channel: string;
      commission: string;
      total_amount: string;
      discount: string | null;
      type: string;
      email: string;
      phone: string;
      name: string | null;
      product_code: string;
      token?: string;
    };
    Customer_Name?: string;
    error?: string;
  };
}

const CATEGORY_MAP: Record<string, BillCategory> = {
  dstv: "tv",
  gotv: "tv",
  startimes: "tv",
  "mtn-fibre": "internet",
  "telecel-broadband": "internet",
  "ecg-prepaid": "electricity",
  "ecg-postpaid": "electricity",
  gwcl: "water",
};

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  dstv: "DSTV",
  gotv: "GOtv",
  startimes: "StarTimes",
  "mtn-fibre": "MTN Fibre",
  "telecel-broadband": "Telecel Broadband",
  "ecg-prepaid": "ECG Prepaid",
  "ecg-postpaid": "ECG Postpaid",
  gwcl: "Ghana Water (GWCL)",
};

const SERVICE_ACCOUNT_LABELS: Record<string, string> = {
  dstv: "Smart Card Number",
  gotv: "ICU Number",
  startimes: "Smart Card Number",
  "mtn-fibre": "Account Number",
  "telecel-broadband": "Account Number",
  "ecg-prepaid": "Meter Number",
  "ecg-postpaid": "Account Number",
  gwcl: "Account Number",
};

const SERVICE_ACCOUNT_PLACEHOLDERS: Record<string, string> = {
  dstv: "e.g., 2012345678",
  gotv: "e.g., 2012345678",
  startimes: "e.g., 2012345678",
  "mtn-fibre": "e.g., 024XXXXXXX",
  "telecel-broadband": "e.g., 020XXXXXXX",
  "ecg-prepaid": "e.g., 1234567890",
  "ecg-postpaid": "e.g., 9876543210",
  gwcl: "e.g., 1234567",
};

const MIN_AMOUNTS: Record<string, number> = {
  dstv: 25,
  gotv: 20,
  startimes: 25,
  "mtn-fibre": 50,
  "telecel-broadband": 50,
  "ecg-prepaid": 10,
  "ecg-postpaid": 10,
  gwcl: 10,
};

const MAX_AMOUNTS: Record<string, number> = {
  dstv: 500,
  gotv: 300,
  startimes: 500,
  "mtn-fibre": 500,
  "telecel-broadband": 500,
  "ecg-prepaid": 500,
  "ecg-postpaid": 5000,
  gwcl: 1000,
};

export class VtpassProvider implements BillProviderInterface {
  readonly name: BillProvider = "vtpass";

  async isAvailable(): Promise<boolean> {
    try {
      const config = getVtpassConfig();
      const result = await providerRequest<VtpassServiceResponse>(
        "vtpass",
        config.baseUrl,
        "/services",
        {
          method: "GET",
          timeoutMs: 5000,
          retries: 1,
          headers: {
            "api-key": config.apiKey,
            "secret-key": config.secretKey,
          },
        }
      );
      return result.success;
    } catch {
      return false;
    }
  }

  async getServices(category?: BillCategory): Promise<BillService[]> {
    const config = getVtpassConfig();
    const result = await providerRequest<VtpassServiceResponse>(
      "vtpass",
      config.baseUrl,
      "/services",
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 2,
        headers: {
          "api-key": config.apiKey,
          "secret-key": config.secretKey,
        },
      }
    );

    if (!result.success || !result.data) {
      throw new Error("Failed to fetch VTpass services");
    }

    const services: BillService[] = [];

    for (const service of result.data.content) {
      const mappedCategory = CATEGORY_MAP[service.identifier];
      if (!mappedCategory) continue;
      if (category && mappedCategory !== category) continue;

      const variations = await this.getVariations(service.identifier);

      services.push({
        id: service.identifier,
        name: SERVICE_DISPLAY_NAMES[service.identifier] || service.name,
        category: mappedCategory,
        provider: this.name,
        minAmount: MIN_AMOUNTS[service.identifier] || 10,
        maxAmount: MAX_AMOUNTS[service.identifier] || 5000,
        accountLabel: SERVICE_ACCOUNT_LABELS[service.identifier] || "Account Number",
        accountPlaceholder: SERVICE_ACCOUNT_PLACEHOLDERS[service.identifier],
        variations,
      });
    }

    return services;
  }

  private async getVariations(serviceId: string): Promise<BillVariation[] | undefined> {
    const config = getVtpassConfig();
    const result = await providerRequest<VtpassVariationsResponse>(
      "vtpass",
      config.baseUrl,
      `/service-variations?serviceID=${encodeURIComponent(serviceId)}`,
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 1,
        headers: {
          "api-key": config.apiKey,
          "secret-key": config.secretKey,
        },
      }
    );

    if (!result.success || !result.data?.content?.variations) {
      return undefined;
    }

    return result.data.content.variations.map((v) => ({
      code: v.variation_code,
      name: v.name,
      amount: parseFloat(v.variation_amount) || 0,
    }));
  }

  async validateAccount(serviceId: string, accountNumber: string): Promise<BillValidationResult> {
    const config = getVtpassConfig();

    const body: VtpassValidationRequest = {
      billersCode: accountNumber,
      serviceID: serviceId,
    };

    if (serviceId === "ecg-postpaid") {
      body.type = "Postpaid";
    } else if (serviceId === "ecg-prepaid") {
      body.type = "Prepaid";
    }

    const result = await providerRequest<VtpassValidationResponse>(
      "vtpass",
      config.baseUrl,
      "/merchant-verify",
      {
        method: "POST",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 0,
        headers: {
          "api-key": config.apiKey,
          "secret-key": config.secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!result.success || !result.data) {
      return {
        valid: false,
        message: result.error?.message || "Validation failed",
      };
    }

    const content = result.data.content;

    if (content.Invalid === true || content.error) {
      return {
        valid: false,
        message: content.error || "Invalid account number",
      };
    }

    return {
      valid: true,
      customerName: content.Customer_Name,
      customerAddress: content.Customer_Address,
      dueAmount: content.Customer_Arrears ? parseFloat(content.Customer_Arrears) : undefined,
      dueDate: content.Due_Date,
    };
  }

  async pay(request: BillPaymentRequest): Promise<BillPaymentResult> {
    const config = getVtpassConfig();

    const requestId = request.reference || this.generateRequestId();

    const body: VtpassPaymentRequest = {
      request_id: requestId,
      serviceID: request.serviceId,
      billersCode: request.accountNumber,
      phone: request.phoneNumber,
    };

    if (request.variationCode) {
      body.variation_code = request.variationCode;
    }

    if (request.amount) {
      body.amount = request.amount;
    }

    const result = await providerRequest<VtpassPaymentResponse>(
      "vtpass",
      config.baseUrl,
      "/pay",
      {
        method: "POST",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 0,
        skipRetry: true,
        headers: {
          "api-key": config.apiKey,
          "secret-key": config.secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!result.success || !result.data) {
      return {
        status: "failed",
        provider: this.name,
        service: request.serviceId,
        amount: request.amount,
        reference: requestId,
        message: result.error?.message || "Payment failed",
        raw: result,
      };
    }

    const response = result.data;
    const transaction = response.content?.transactions;

    let status: "success" | "pending" | "failed";
    if (response.status === "delivered" || response.code === "000") {
      status = "success";
    } else if (response.status === "initiated" || response.status === "pending") {
      status = "pending";
    } else {
      status = "failed";
    }

    return {
      status,
      provider: this.name,
      service: request.serviceId,
      customerName: response.content?.Customer_Name || transaction?.name || undefined,
      amount: parseFloat(response.amount) || request.amount,
      reference: requestId,
      transactionId: response.transactionId,
      message: response.response_description || "Payment processed",
      raw: response,
    };
  }

  async checkStatus(reference: string): Promise<BillPaymentResult> {
    const config = getVtpassConfig();

    const result = await providerRequest<VtpassPaymentResponse>(
      "vtpass",
      config.baseUrl,
      `/requery?request_id=${encodeURIComponent(reference)}`,
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 1,
        headers: {
          "api-key": config.apiKey,
          "secret-key": config.secretKey,
        },
      }
    );

    if (!result.success || !result.data) {
      return {
        status: "failed",
        provider: this.name,
        service: "unknown",
        amount: 0,
        reference,
        message: result.error?.message || "Status check failed",
        raw: result,
      };
    }

    const response = result.data;
    const transaction = response.content?.transactions;

    let status: "success" | "pending" | "failed";
    if (response.status === "delivered" || response.code === "000") {
      status = "success";
    } else if (response.status === "initiated" || response.status === "pending") {
      status = "pending";
    } else {
      status = "failed";
    }

    return {
      status,
      provider: this.name,
      service: response.content?.transactions?.product_name || "unknown",
      customerName: response.content?.Customer_Name || transaction?.name || undefined,
      amount: parseFloat(response.amount) || 0,
      reference,
      transactionId: response.transactionId,
      message: response.response_description || "Status retrieved",
      raw: response,
    };
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `vt_${timestamp}_${random}`;
  }
}

export const vtpassProvider = new VtpassProvider();
