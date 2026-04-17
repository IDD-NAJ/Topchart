// Standardized error codes and messages for the application

export type ErrorCode = 
  // Database errors
  | "DB_CONNECTION_ERROR"
  | "DB_QUERY_ERROR"
  | "DB_TIMEOUT"
  // Reloadly errors
  | "RELOADLY_AUTH_FAILED"
  | "RELOADLY_REQUEST_FAILED"
  | "RELOADLY_OPERATOR_NOT_FOUND"
  | "RELOADLY_INSUFFICIENT_BALANCE"
  // DataMart errors
  | "DATAMART_API_ERROR"
  | "DATAMART_NETWORK_NOT_FOUND"
  // General errors
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export function createError(
  code: ErrorCode,
  message: string,
  userMessage?: string,
  statusCode?: number,
  details?: Record<string, unknown>
): AppError {
  // Default user-friendly messages
  const defaultUserMessages: Record<ErrorCode, string> = {
    DB_CONNECTION_ERROR: "Service temporarily unavailable. Please try again in a moment.",
    DB_QUERY_ERROR: "Unable to process your request. Please try again.",
    DB_TIMEOUT: "Request took too long. Please try again.",
    RELOADLY_AUTH_FAILED: "Payment provider connection issue. Using backup provider.",
    RELOADLY_REQUEST_FAILED: "Payment provider temporarily unavailable. Using backup.",
    RELOADLY_OPERATOR_NOT_FOUND: "Network operator not found. Please check your selection.",
    RELOADLY_INSUFFICIENT_BALANCE: "Payment provider balance low. Using backup provider.",
    DATAMART_API_ERROR: "Data provider temporarily unavailable. Please try again.",
    DATAMART_NETWORK_NOT_FOUND: "Network not found. Please check your selection.",
    INVALID_INPUT: "Please check your input and try again.",
    UNAUTHORIZED: "Please log in to continue.",
    NOT_FOUND: "The requested resource was not found.",
    INTERNAL_ERROR: "Something went wrong. Please try again later.",
  };

  // Default status codes
  const defaultStatusCodes: Record<ErrorCode, number> = {
    DB_CONNECTION_ERROR: 503,
    DB_QUERY_ERROR: 500,
    DB_TIMEOUT: 504,
    RELOADLY_AUTH_FAILED: 502,
    RELOADLY_REQUEST_FAILED: 502,
    RELOADLY_OPERATOR_NOT_FOUND: 400,
    RELOADLY_INSUFFICIENT_BALANCE: 502,
    DATAMART_API_ERROR: 502,
    DATAMART_NETWORK_NOT_FOUND: 400,
    INVALID_INPUT: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  };

  return {
    code,
    message,
    userMessage: userMessage || defaultUserMessages[code],
    statusCode: statusCode || defaultStatusCodes[code],
    details,
  };
}

// Helper to convert unknown errors to AppError
export function normalizeError(error: unknown): AppError {
  if (typeof error === "object" && error !== null && "code" in error) {
    const err = error as AppError;
    if (err.code && err.message) {
      return err;
    }
  }

  if (error instanceof Error) {
    return createError("INTERNAL_ERROR", error.message);
  }

  return createError("INTERNAL_ERROR", String(error));
}

// Circuit breaker for external services
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly name: string,
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 300000 // 5 minutes
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        console.log(`[CircuitBreaker] ${this.name} entering HALF_OPEN state`);
      } else {
        throw createError(
          "INTERNAL_ERROR",
          `${this.name} is temporarily unavailable`,
          `${this.name} is temporarily unavailable. Please try again later.`,
          503
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failures = 0;
      console.log(`[CircuitBreaker] ${this.name} circuit CLOSED`);
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker] ${this.name} circuit OPENED after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Circuit breakers for external services
export const reloadlyCircuitBreaker = new CircuitBreaker("Reloadly", 3, 300000);
export const datamartCircuitBreaker = new CircuitBreaker("DataMart", 5, 300000);
