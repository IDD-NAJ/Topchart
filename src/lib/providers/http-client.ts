import { logger } from "@/lib/logger";

export type ProviderErrorCode =
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_5XX"
  | "PROVIDER_4XX"
  | "PROVIDER_NETWORK"
  | "PROVIDER_BAD_RESPONSE"
  | "PROVIDER_UNSUPPORTED_OPERATION";

export interface ProviderHttpError {
  code: ProviderErrorCode;
  provider: string;
  endpoint: string;
  statusCode?: number;
  retryable: boolean;
  message: string;
}

export interface ProviderHttpResult<T> {
  success: boolean;
  data?: T;
  error?: ProviderHttpError;
  statusCode?: number;
  attempts: number;
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  skipRetry?: boolean;
}

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as Record<string, unknown>;
  const message = obj.detail || obj.error || obj.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export async function providerRequest<T>(
  provider: string,
  baseUrl: string,
  endpoint: string,
  options: RequestOptions = {}
): Promise<ProviderHttpResult<T>> {
  const timeoutMs = options.timeoutMs ?? 12000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const skipRetry = options.skipRetry ?? false;
  const method = (options.method || "GET").toUpperCase();
  const canRetry = method === "GET" && !skipRetry;
  const maxAttempts = canRetry ? retries + 1 : 1;

  let lastError: ProviderHttpError | undefined;
  
  logger.debug({ message: `[HTTP] ${method} ${provider} request started`, provider, endpoint, attempt: 1 });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const statusCode = response.status;
      const textBody = await response.text();
      let json: unknown = null;
      if (textBody) {
        try {
          json = JSON.parse(textBody);
        } catch {
          // If we can't parse JSON, we'll handle it below.
          // For successful responses, this might be a problem, but for errors, 
          // we often get non-JSON bodies (HTML/Text).
          if (response.ok) {
             logger.error({ message: `[HTTP] Invalid JSON in successful response`, provider, endpoint, statusCode });
             return {
               success: false,
               statusCode,
               attempts: attempt,
               error: {
                 code: "PROVIDER_BAD_RESPONSE",
                 provider,
                 endpoint,
                 statusCode,
                 retryable: false,
                 message: `Invalid JSON response (${statusCode})`,
               },
             };
          }
        }
      }

      if (!response.ok) {
        const retryable = RETRYABLE_STATUSES.has(statusCode);
        lastError = {
          code:
            statusCode === 429 ? "PROVIDER_RATE_LIMIT" : statusCode >= 500 ? "PROVIDER_5XX" : "PROVIDER_4XX",
          provider,
          endpoint,
          statusCode,
          retryable,
          message: toErrorMessage(json, `HTTP ${statusCode}`),
        };
        if (retryable && canRetry && attempt < maxAttempts) {
          const jitter = Math.floor(Math.random() * 250);
          const delay = retryDelayMs * 2 ** (attempt - 1) + jitter;
          logger.warn({ message: `[HTTP] Retryable error ${statusCode}`, provider, endpoint, attempt, delay });
          await sleep(delay);
          continue;
        }
        
        logger.error({ message: `[HTTP] Request failed`, provider, endpoint, statusCode, attempts: attempt, error: lastError });
        return { success: false, error: lastError, statusCode, attempts: attempt };
      }

      logger.info({ message: `[HTTP] Request success`, provider, endpoint, statusCode, attempts: attempt });
      return {
        success: true,
        data: json as T,
        statusCode,
        attempts: attempt,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = {
        code: isAbort(err) ? "PROVIDER_TIMEOUT" : "PROVIDER_NETWORK",
        provider,
        endpoint,
        retryable: true,
        message: err instanceof Error ? err.message : "Request failed",
      };
      if (canRetry && attempt < maxAttempts) {
        const jitter = Math.floor(Math.random() * 250);
        const delay = retryDelayMs * 2 ** (attempt - 1) + jitter;
        logger.warn({ message: `[HTTP] Network error`, provider, endpoint, attempt, delay, errorMsg: lastError.message });
        await sleep(delay);
        continue;
      }
      logger.error({ message: `[HTTP] Max retries reached or non-retryable error`, provider, endpoint, attempts: attempt, errorMsg: lastError.message });
      return { success: false, error: lastError, attempts: attempt };
    }
  }

  return {
    success: false,
    attempts: maxAttempts,
    error:
      lastError ||
      ({
        code: "PROVIDER_NETWORK",
        provider,
        endpoint,
        retryable: false,
        message: "Unknown provider error",
      } as ProviderHttpError),
  };
}
