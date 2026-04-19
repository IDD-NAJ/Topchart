import { NextResponse } from "next/server";

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
    console.warn(`[API] Failed to parse JSON:`, error);
    return null;
  }
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
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (status === "failed") {
    console.error(`[${service.toUpperCase()}] ${step} FAILED:`, JSON.stringify(logData, null, 2));
  } else {
    console.log(`[${service.toUpperCase()}] ${step} ${status.toUpperCase()}`, details ? JSON.stringify(details) : "");
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
