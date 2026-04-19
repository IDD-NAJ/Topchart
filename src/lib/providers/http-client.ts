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
  const method = (options.method || "GET").toUpperCase();
  const canRetry = method === "GET";
  const maxAttempts = canRetry ? retries + 1 : 1;

  let lastError: ProviderHttpError | undefined;
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
          if (!response.ok) {
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
          await sleep(retryDelayMs * 2 ** (attempt - 1) + jitter);
          continue;
        }
        return { success: false, error: lastError, statusCode, attempts: attempt };
      }

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
        await sleep(retryDelayMs * 2 ** (attempt - 1) + jitter);
        continue;
      }
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
