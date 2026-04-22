import { NextResponse } from "next/server";
import { logger } from "./logger";

export type ErrorCategory = "AUTH_CONFIG" | "UPSTREAM_TIMEOUT" | "VALIDATION" | "PROVIDER_UNAVAILABLE" | "RECONCILIATION_NEEDED" | "UNKNOWN";

const ERROR_CATEGORY_MAP: Record<string, ErrorCategory> = {
  RELOADLY_INVALID_CREDENTIALS: "AUTH_CONFIG",
  RELOADLY_AUTH_FAILED: "AUTH_CONFIG",
  RELOADLY_TIMEOUT: "UPSTREAM_TIMEOUT",
  RELOADLY_TIMEOUT_RECONCILIATION: "RECONCILIATION_NEEDED",
  RELOADLY_INVALID_REQUEST: "VALIDATION",
  RELOADLY_INVALID_PHONE: "VALIDATION",
  RELOADLY_OPERATOR_NOT_FOUND: "PROVIDER_UNAVAILABLE",
  RELOADLY_INSUFFICIENT_BALANCE: "PROVIDER_UNAVAILABLE",
  RELOADLY_RATE_LIMITED: "PROVIDER_UNAVAILABLE",
  RELOADLY_SERVER_ERROR: "PROVIDER_UNAVAILABLE",
  SERVICE_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  MISSING_IDEMPOTENCY_KEY: "VALIDATION",
  DUPLICATE_REQUEST: "VALIDATION",
};

export function categorizeError(code: string | undefined): ErrorCategory {
  if (!code) return "UNKNOWN";
  return ERROR_CATEGORY_MAP[code] ?? "UNKNOWN";
}

/**
 * Safely parse JSON from a response, handling empty bodies and non-JSON content.
 */
export async function safeParseJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || text.trim() === "") {
      return null;
    }
    return JSON.parse(text) as T;
  } catch (error) {
    logger.warn({ message: `[API] Failed to parse JSON`, error });
    return null;
  }
}

/**
 * Fetch wrapper with timeout and automatic retry logic for transient errors.
 */
export async function fetchWithRetryAndTimeout(
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeoutMs = 15000,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      
      // Retry on 5xx or 429
      if (!res.ok && (res.status >= 500 || res.status === 429) && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt); // Exponential backoff
        logger.warn({ message: `[API] Fetch failed with ${res.status}. Retrying in ${delay}ms...`, url, attempt, status: res.status });
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      
      return res;
    } catch (error: any) {
      clearTimeout(id);
      lastError = error;
      
      const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
      
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn({ message: `[API] Fetch network/timeout error. Retrying in ${delay}ms...`, url, attempt, isTimeout, error: error.message });
        await new Promise((r) => setTimeout(r, delay));
      } else {
        logger.error({ message: `[API] Fetch completely failed after ${retries} retries`, url, isTimeout, error: error.message });
      }
    }
  }
  
  throw lastError || new Error(`Fetch failed after ${retries} retries`);
}

/**
 * Structured log helper for service events.
 */
export function logServiceEvent(
  service: string,
  step: string,
  status: "started" | "success" | "failed" | "pending",
  details?: any
) {
  const logData = {
    service,
    step,
    status,
    ...details,
  };

  if (status === "failed") {
    logger.error({ message: `[${service.toUpperCase()}] ${step} FAILED`, ...logData });
  } else {
    logger.info({ message: `[${service.toUpperCase()}] ${step} ${status.toUpperCase()}`, ...logData });
  }
}

/**
 * API Response standard helper
 */
export function apiResponse(
  success: boolean,
  dataOrError: any,
  options: { status?: number; code?: string; correlationId?: string; data?: any } = {}
) {
  const body: any = { success };
  
  if (success) {
    body.data = dataOrError;
  } else {
    body.error = typeof dataOrError === "string" ? dataOrError : (dataOrError as Error).message;
    if (options.code) body.code = options.code;
    if (options.code) body.category = categorizeError(options.code);
    if (options.data) body.data = options.data;
  }

  if (options.correlationId) {
    body.correlationId = options.correlationId;
  }

  return NextResponse.json(body, { status: options.status || (success ? 200 : 400) });
}
