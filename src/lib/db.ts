import { Pool, neonConfig } from "@neondatabase/serverless";

// Query timeout in milliseconds - increased for admin operations
const QUERY_TIMEOUT_MS = 60000; // Increased to 60s for stability
const CONNECTION_TIMEOUT_MS = 30000; // 30s for Neon cold starts

function getCleanConnectionString(): string {
  // Defer environment variable access to runtime
  const rawConnection =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    "";
  let connectionString = rawConnection;
  
  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) {
    connectionString = postgresMatch[0];
  }
  
  // Split into base URL and query parameters
  const [baseUrl, queryPart] = connectionString.split("?");
  let params: Record<string, string> = {};
  
  if (queryPart) {
    // Parse all query parameters
    const allParams = queryPart.split("&");
    for (const param of allParams) {
      if (param.trim()) {
        const [key, value] = param.split("=");
        // Skip problematic parameters
        if (key !== "channel_binding" && key !== "pooler_timeout") {
          params[key] = value || "";
        }
      }
    }
  }
  
  // Rebuild the connection string with cleaned parameters
  const cleanParams = Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&");
  connectionString = cleanParams ? `${baseUrl}?${cleanParams}` : baseUrl;
  
  return connectionString.trim();
}

// Ensure WebSocket is used if natively available
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

// Global variable to maintain connection pool across hot reloads in dev
const globalForPool = global as unknown as { _pool: Pool; _poolCreatedAt: number; _poolConnStr: string };

// Compute the correct connection string once at module load so we can detect
// if the cached global pool was built with a stale/broken string.
const _currentConnStr = getCleanConnectionString();

// If the cached pool was built with a different (broken) connection string, discard it.
if (globalForPool._pool && globalForPool._poolConnStr !== _currentConnStr) {
  try { globalForPool._pool.end().catch(() => {}); } catch { /* ignore */ }
  globalForPool._pool = undefined as unknown as Pool;
}

let _pool: Pool = globalForPool._pool;
let _poolCreatedAt: number = globalForPool._poolCreatedAt || 0;

function getPool(): Pool {
  if (_pool) return _pool;
  
  const connectionString = getCleanConnectionString();
  if (connectionString && (connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://"))) {
    _pool = new Pool({ 
      connectionString,
      max: process.env.NODE_ENV === "production" ? 20 : 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
      maxLifetimeSeconds: 300,
    });
    _poolCreatedAt = Date.now();
    if (process.env.NODE_ENV !== "production") {
      globalForPool._pool = _pool;
      globalForPool._poolCreatedAt = _poolCreatedAt;
      globalForPool._poolConnStr = connectionString;
    }
    console.log(`[DB] Pool created at ${new Date(_poolCreatedAt).toISOString()}`);
    return _pool;
  }
  
  throw new Error(
    "Database not configured. Please set DATABASE_URL environment variable in .env.local file.\n" +
    "Example: DATABASE_URL=postgresql://username:password@hostname/database\n" +
    "Get your connection string from your Neon dashboard at https://console.neon.tech"
  );
}

// Structured error logging for DB operations
function logDbError(operation: string, error: unknown, attempt: number, durationMs: number) {
  const err = error as any;
  const logData = {
    service: "db",
    operation,
    attempt,
    durationMs,
    code: err?.code || "UNKNOWN",
    message: err?.message || "No error message",
    name: err?.name || "Error",
    stack: err?.stack?.substring(0, 500),
    cause: err?.cause ? {
      code: err.cause?.code,
      message: err.cause?.message,
    } : undefined,
    retryable: isRetryableDbError(error),
  };
  
  console.error(`[DB] ${operation} FAILED:`, JSON.stringify(logData, null, 2));
}

// Determine if a DB error is retryable (transient network issues only)
function isRetryableDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as any;
  
  // Schema errors - never retry
  if (e.code === "42P01") return false; // relation does not exist
  if (e.code === "42P02") return false; // undefined parameter
  if (e.code === "42703") return false; // column does not exist
  if (e.code === "23505") return false; // unique violation (data issue)
  if (e.code === "23502") return false; // not null violation
  if (e.code === "23503") return false; // foreign key violation
  
  // Connection/Network errors - retryable
  if (e.code === "ECONNRESET") return true;
  if (e.code === "ETIMEDOUT") return true;
  if (e.code === "ECONNREFUSED") return true;
  if (e.code === "UND_ERR_CONNECT_TIMEOUT") return true;
  if (e.code === "NEON_ERROR_EVENT") return true;
  if (e.code === "08000") return true; // connection_exception
  if (e.code === "08003") return true; // connection_does_not_exist
  if (e.code === "08006") return true; // connection_failure
  
  // Neon-specific transient errors
  if (typeof e.message === "string") {
    const msg = e.message.toLowerCase();
    if (msg.includes("connect timeout")) return true;
    if (msg.includes("connection terminated")) return true;
    if (msg.includes("fetch failed")) return true;
    if (msg.includes("websocket")) return true;
    if (msg.includes("errorevent")) return true;
  }

  // Unknown errors with no code and no message are likely Neon connection issues
  const pgCode = findPgCode(err);
  if (!pgCode && (!e.code || e.code === "UNKNOWN") && (!e.message || String(e.message).trim() === "")) {
    return true;
  }
  
  return false;
}

function isErrorEventLike(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as any;
  if (e.type === "error") return true;
  const ctorName = e?.constructor?.name;
  return ctorName === "ErrorEvent";
}

function isTimeoutError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as any;
  return (
    e.code === "UND_ERR_CONNECT_TIMEOUT" ||
    (e.sourceError && isTimeoutError(e.sourceError)) ||
    (e.cause && isTimeoutError(e.cause)) ||
    (typeof e.message === "string" && e.message.includes("Connect Timeout")) ||
    (typeof e.message === "string" && e.message.includes("fetch failed")) ||
    (typeof e.message === "string" && e.message.includes("WebSocket server error"))
  );
}

function findPgCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as any;
  if (e.code && typeof e.code === "string" && /^[0-9A-Z]{5}$/.test(e.code)) return e.code;
  if (e.cause) return findPgCode(e.cause);
  if (e.sourceError) return findPgCode(e.sourceError);
  if (e.error) return findPgCode(e.error);
  return undefined;
}

function normalizeDbError(err: unknown): Error {
  const asAny = err as any;

  if (isErrorEventLike(err) || isTimeoutError(err)) {
    const originalMessage =
      typeof asAny?.message === "string" && asAny.message.trim().length > 0
        ? asAny.message
        : "Database network error (likely Neon connectivity issue)";
    const wrapped = new Error(originalMessage);
    (wrapped as any).code = asAny?.code || "NEON_ERROR_EVENT";
    return wrapped;
  }

  if (err instanceof Error) {
    const pgCode = findPgCode(err);
    if (pgCode && !((err as any).code)) {
      (err as any).code = pgCode;
    }
    return err;
  }

  const pgCode = findPgCode(err);
  const fallbackMessage =
    typeof err === "string" && err.length > 0 ? err : "Database query failed";
  const wrapped = new Error(fallbackMessage);
  (wrapped as any).code = pgCode || asAny?.code || undefined;
  return wrapped;
}

async function withRetry<T>(fn: () => Promise<T>, operation: string, retries = 4, baseDelayMs = 1000): Promise<T> {
  const startTime = Date.now();
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const attemptStart = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - attemptStart;
      
      if (attempt > 1) {
        console.log(`[DB] ${operation} succeeded after ${attempt - 1} retry(s) in ${duration}ms`);
      }
      return result;
    } catch (err) {
      lastError = err;
      const duration = Date.now() - attemptStart;
      const retryable = isRetryableDbError(err);
      const isSchema = (err as any)?.code === "42P01";
      
      // Log structured error details
      logDbError(operation, err, attempt, duration);
      
      // Fail fast on schema errors or non-retryable errors
      if (isSchema || !retryable || attempt > retries) {
        if (isSchema) {
          console.error(`[DB] ${operation}: Schema error - failing immediately`);
        } else if (!retryable) {
          console.error(`[DB] ${operation}: Non-retryable error - failing immediately`);
        } else {
          console.error(`[DB] ${operation}: All ${retries + 1} attempts exhausted after ${Date.now() - startTime}ms`);
        }
        throw normalizeDbError(err);
      }
      
      // Short exponential backoff for retryable network errors only
      const delay = Math.min(baseDelayMs * Math.pow(1.5, attempt - 1) + Math.random() * 200, 3000);
      console.log(`[DB] ${operation}: Retrying in ${Math.round(delay)}ms (attempt ${attempt}/${retries + 1})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  
  throw normalizeDbError(lastError);
}

// Execute query with timeout to prevent hanging
async function queryWithTimeout<T>(pool: Pool, queryText: string, values: unknown[], timeoutMs: number): Promise<{ rows: T[] }> {
  const queryStart = Date.now();
  const queryFingerprint = queryText.substring(0, 100).replace(/\s+/g, ' ').trim();
  
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const duration = Date.now() - queryStart;
      console.error("[DB] Query timeout", {
        fingerprint: queryFingerprint,
        bindCount: values.length,
        duration,
        timeoutThreshold: timeoutMs
      });
      reject(new Error(`Query timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const queryPromise = pool.query(queryText, values);
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    const duration = Date.now() - queryStart;
    if (duration > 1000) {
      console.warn("[DB] Slow query detected", {
        fingerprint: queryFingerprint,
        bindCount: values.length,
        duration
      });
    }
    
    return result;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> {
  const queryPreview = strings[0].substring(0, 50).replace(/\s+/g, ' ').trim();
  return withRetry(async () => {
    let queryText = strings[0];
    for (let i = 1; i < strings.length; i++) {
        queryText += `$${i}` + strings[i];
    }
    const pool = getPool();
    const { rows } = await queryWithTimeout(pool, queryText, values, QUERY_TIMEOUT_MS);
    return rows;
  }, `sql:${queryPreview}`, 4, 1000);
}

async function sqlUnsafe(queryText: string, params?: unknown[]): Promise<unknown[]> {
  const queryPreview = queryText.substring(0, 50).replace(/\s+/g, ' ').trim();
  return withRetry(async () => {
    const pool = getPool();
    const { rows } = await queryWithTimeout(pool, queryText, params || [], QUERY_TIMEOUT_MS);
    return rows;
  }, `sqlUnsafe:${queryPreview}`, 4, 1000);
}

export function isPgMissingRelation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; cause?: unknown };
  if (e.code === "42P01") return true;
  if (
    typeof e.message === "string" &&
    /relation\s+["']?[\w.]+["']?\s+does\s+not\s+exist/i.test(e.message)
  ) {
    return true;
  }
  if (e.cause) return isPgMissingRelation(e.cause);
  return false;
}

export { sql, sqlUnsafe };

export async function withTransaction<T>(
  callback: (query: (queryText: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  const query = async (queryText: string, params?: unknown[]): Promise<unknown[]> => {
    const { rows } = await client.query(queryText, params);
    return rows;
  };

  try {
    await client.query("BEGIN");
    const result = await callback(query);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T>(
  queryText: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result = await sqlUnsafe(queryText, params);
    return result as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
