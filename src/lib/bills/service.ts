import { vtpassProvider } from "./providers/vtpass";
import { datamartBillProvider } from "./providers/datamart";
import type {
  BillCategory,
  BillProviderInterface,
  BillService,
  BillValidationResult,
  BillPaymentRequest,
  BillPaymentResult,
  BillProvider,
} from "./types";

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 10000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class UnifiedBillService {
  private providers: Map<BillProvider, BillProviderInterface>;
  private providerOrder: BillProvider[] = ["vtpass", "datamart"];

  constructor() {
    this.providers = new Map<BillProvider, BillProviderInterface>([
      ["vtpass", vtpassProvider],
      ["datamart", datamartBillProvider],
    ]);
  }

  private async getAvailableProviders(): Promise<BillProviderInterface[]> {
    const available: BillProviderInterface[] = [];

    for (const providerId of this.providerOrder) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          available.push(provider);
        }
      } catch {
        continue;
      }
    }

    return available;
  }

  private async retryWithProvider<T>(
    provider: BillProviderInterface,
    operation: () => Promise<T>,
    maxRetries = RETRY_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await sleep(RETRY_CONFIG.retryDelayMs * (i + 1));
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }

  async getServices(category?: BillCategory): Promise<BillService[]> {
    const availableProviders = await this.getAvailableProviders();
    const allServices: BillService[] = [];
    const seenIds = new Set<string>();

    for (const provider of availableProviders) {
      try {
        const services = await this.retryWithProvider(provider, () =>
          provider.getServices(category)
        );

        for (const service of services) {
          if (!seenIds.has(service.id)) {
            seenIds.add(service.id);
            allServices.push(service);
          }
        }
      } catch {
        continue;
      }
    }

    return allServices.sort((a, b) => a.name.localeCompare(b.name));
  }

  async validateAccount(serviceId: string, accountNumber: string): Promise<BillValidationResult> {
    const availableProviders = await this.getAvailableProviders();

    for (const provider of availableProviders) {
      try {
        const result = await this.retryWithProvider(provider, () =>
          provider.validateAccount(serviceId, accountNumber)
        );

        if (result.valid) {
          return result;
        }
      } catch {
        continue;
      }
    }

    return {
      valid: false,
      message: "Unable to validate account with any provider",
    };
  }

  async pay(request: BillPaymentRequest): Promise<BillPaymentResult> {
    const availableProviders = await this.getAvailableProviders();

    if (availableProviders.length === 0) {
      return {
        status: "failed",
        provider: "vtpass",
        service: request.serviceId,
        amount: request.amount,
        reference: request.reference || "",
        message: "No bill payment providers are available",
        raw: null,
      };
    }

    const errors: { provider: BillProvider; error: string }[] = [];

    for (const provider of availableProviders) {
      try {
        const result = await this.retryWithProvider(provider, () =>
          provider.pay(request)
        );

        if (result.status === "success" || result.status === "pending") {
          return result;
        }

        errors.push({
          provider: provider.name,
          error: result.message,
        });
      } catch (error) {
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      status: "failed",
      provider: "vtpass",
      service: request.serviceId,
      amount: request.amount,
      reference: request.reference || "",
      message: `All providers failed: ${errors.map((e) => `${e.provider}: ${e.error}`).join(", ")}`,
      raw: { errors },
    };
  }

  async checkStatus(reference: string): Promise<BillPaymentResult> {
    const availableProviders = await this.getAvailableProviders();

    for (const provider of availableProviders) {
      try {
        const result = await this.retryWithProvider(provider, () =>
          provider.checkStatus(reference)
        );

        if (result.status !== "failed" || result.transactionId) {
          return result;
        }
      } catch {
        continue;
      }
    }

    return {
      status: "failed",
      provider: "vtpass",
      service: "unknown",
      amount: 0,
      reference,
      message: "Unable to check status with any provider",
      raw: null,
    };
  }

  async getProviderStatus(): Promise<
    { provider: BillProvider; available: boolean; error?: string }[]
  > {
    const results: { provider: BillProvider; available: boolean; error?: string }[] = [];

    for (const providerId of this.providerOrder) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        results.push({
          provider: providerId,
          available: false,
          error: "Provider not configured",
        });
        continue;
      }

      try {
        const isAvailable = await provider.isAvailable();
        results.push({
          provider: providerId,
          available: isAvailable,
        });
      } catch (error) {
        results.push({
          provider: providerId,
          available: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }
}

export const billService = new UnifiedBillService();
