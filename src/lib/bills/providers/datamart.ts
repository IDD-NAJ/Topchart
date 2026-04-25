import { getDatamartEnv } from "@/lib/env";
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

const DEVELOPER_API_PREFIX = "/api/developer";
const REQUEST_TIMEOUT_MS = 15000;

interface DatamartConfig {
  baseUrl: string;
  apiKey: string;
}

function getDatamartConfig(): DatamartConfig {
  const env = getDatamartEnv();
  return {
    baseUrl: env.DATAMART_BASE_URL || "https://api.datamartgh.shop",
    apiKey: env.DATAMART_API_KEY,
  };
}

interface DatamartApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

interface DatamartProviderInfo {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  accountLabel: string;
  requiresValidation: boolean;
}

interface DatamartValidationRequest {
  providerId: string;
  accountNumber: string;
}

interface DatamartValidationResponse {
  valid: boolean;
  customerName?: string;
  customerAddress?: string;
  dueAmount?: number;
  message?: string;
}

interface DatamartPaymentRequest {
  providerId: string;
  accountNumber: string;
  amount: number;
  variationCode?: string;
  phoneNumber: string;
  reference?: string;
}

interface DatamartPaymentResponse {
  transactionId: string;
  reference: string;
  status: "pending" | "waiting" | "processing" | "completed" | "failed" | "refunded";
  provider: string;
  service: string;
  customerName?: string;
  amount: number;
  message: string;
}

const CATEGORY_MAP: Record<string, BillCategory> = {
  electricity: "electricity",
  tv: "tv",
  internet: "internet",
  water: "water",
  cable: "tv",
  broadband: "internet",
};

export class DatamartBillProvider implements BillProviderInterface {
  readonly name: BillProvider = "datamart";
  private billEndpointsAvailable: boolean | null = null;

  async isAvailable(): Promise<boolean> {
    if (this.billEndpointsAvailable !== null) {
      return this.billEndpointsAvailable;
    }

    try {
      const config = getDatamartConfig();
      const result = await providerRequest<DatamartApiResponse<DatamartProviderInfo[]>>(
        "datamart",
        config.baseUrl,
        `${DEVELOPER_API_PREFIX}/bill/providers`,
        {
          method: "GET",
          timeoutMs: 5000,
          retries: 1,
          headers: {
            "X-API-Key": config.apiKey,
          },
        }
      );

      this.billEndpointsAvailable = result.success;
      return result.success;
    } catch {
      this.billEndpointsAvailable = false;
      return false;
    }
  }

  async getServices(category?: BillCategory): Promise<BillService[]> {
    if (!(await this.isAvailable())) {
      return [];
    }

    const config = getDatamartConfig();
    const result = await providerRequest<DatamartApiResponse<DatamartProviderInfo[]>>(
      "datamart",
      config.baseUrl,
      `${DEVELOPER_API_PREFIX}/bill/providers`,
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 2,
        headers: {
          "X-API-Key": config.apiKey,
        },
      }
    );

    if (!result.success || !result.data?.data) {
      return [];
    }

    const providerInfos = result.data.data;
    const services: BillService[] = [];

    for (const provider of providerInfos) {
      if (!provider.isActive) continue;

      const mappedCategory = CATEGORY_MAP[provider.category] || "electricity";
      if (category && mappedCategory !== category) continue;

      const variations = await this.getVariations(provider.id);

      services.push({
        id: provider.id,
        name: provider.name,
        category: mappedCategory,
        provider: this.name,
        minAmount: provider.minAmount || 10,
        maxAmount: provider.maxAmount || 5000,
        accountLabel: provider.accountLabel || "Account Number",
        variations,
      });
    }

    return services;
  }

  private async getVariations(providerId: string): Promise<BillVariation[] | undefined> {
    const config = getDatamartConfig();
    const result = await providerRequest<DatamartApiResponse<BillVariation[]>>(
      "datamart",
      config.baseUrl,
      `${DEVELOPER_API_PREFIX}/bill/providers/${encodeURIComponent(providerId)}/variations`,
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 1,
        headers: {
          "X-API-Key": config.apiKey,
        },
      }
    );

    if (!result.success || !result.data?.data) {
      return undefined;
    }

    return result.data.data;
  }

  async validateAccount(serviceId: string, accountNumber: string): Promise<BillValidationResult> {
    if (!(await this.isAvailable())) {
      return {
        valid: false,
        message: "Datamart bill services are not available",
      };
    }

    const config = getDatamartConfig();

    const body: DatamartValidationRequest = {
      providerId: serviceId,
      accountNumber,
    };

    const result = await providerRequest<DatamartApiResponse<DatamartValidationResponse>>(
      "datamart",
      config.baseUrl,
      `${DEVELOPER_API_PREFIX}/bill/validate`,
      {
        method: "POST",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 0,
        headers: {
          "X-API-Key": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!result.success || !result.data?.data) {
      return {
        valid: false,
        message: result.error?.message || "Validation failed",
      };
    }

    const response = result.data.data;

    return {
      valid: response.valid,
      customerName: response.customerName,
      customerAddress: response.customerAddress,
      dueAmount: response.dueAmount,
      message: response.message,
    };
  }

  async pay(request: BillPaymentRequest): Promise<BillPaymentResult> {
    if (!(await this.isAvailable())) {
      return {
        status: "failed",
        provider: this.name,
        service: request.serviceId,
        amount: request.amount,
        reference: request.reference || "",
        message: "Datamart bill services are not available",
        raw: null,
      };
    }

    const config = getDatamartConfig();

    const body: DatamartPaymentRequest = {
      providerId: request.serviceId,
      accountNumber: request.accountNumber,
      amount: request.amount,
      phoneNumber: request.phoneNumber,
      reference: request.reference,
    };

    if (request.variationCode) {
      body.variationCode = request.variationCode;
    }

    const result = await providerRequest<DatamartApiResponse<DatamartPaymentResponse>>(
      "datamart",
      config.baseUrl,
      `${DEVELOPER_API_PREFIX}/bill/pay`,
      {
        method: "POST",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 0,
        skipRetry: true,
        headers: {
          "X-API-Key": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!result.success || !result.data?.data) {
      return {
        status: "failed",
        provider: this.name,
        service: request.serviceId,
        amount: request.amount,
        reference: request.reference || "",
        message: result.error?.message || "Payment failed",
        raw: result,
      };
    }

    const response = result.data.data;

    let status: "success" | "pending" | "failed";
    if (response.status === "completed") {
      status = "success";
    } else if (["pending", "waiting", "processing"].includes(response.status)) {
      status = "pending";
    } else {
      status = "failed";
    }

    return {
      status,
      provider: this.name,
      service: request.serviceId,
      customerName: response.customerName,
      amount: response.amount,
      reference: response.reference,
      transactionId: response.transactionId,
      message: response.message || "Payment processed",
      raw: response,
    };
  }

  async checkStatus(reference: string): Promise<BillPaymentResult> {
    if (!(await this.isAvailable())) {
      return {
        status: "failed",
        provider: this.name,
        service: "unknown",
        amount: 0,
        reference,
        message: "Datamart bill services are not available",
        raw: null,
      };
    }

    const config = getDatamartConfig();

    const result = await providerRequest<DatamartApiResponse<DatamartPaymentResponse>>(
      "datamart",
      config.baseUrl,
      `${DEVELOPER_API_PREFIX}/bill/status/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 1,
        headers: {
          "X-API-Key": config.apiKey,
        },
      }
    );

    if (!result.success || !result.data?.data) {
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

    const response = result.data.data;

    let status: "success" | "pending" | "failed";
    if (response.status === "completed") {
      status = "success";
    } else if (["pending", "waiting", "processing"].includes(response.status)) {
      status = "pending";
    } else {
      status = "failed";
    }

    return {
      status,
      provider: this.name,
      service: response.service,
      customerName: response.customerName,
      amount: response.amount,
      reference,
      transactionId: response.transactionId,
      message: response.message || "Status retrieved",
      raw: response,
    };
  }
}

export const datamartBillProvider = new DatamartBillProvider();
