import { Pool, neonConfig } from "@neondatabase/serverless";
import { getDatabaseEnv } from "@/lib/env";

function getCleanConnectionString(): string {
  const dbEnv = getDatabaseEnv();
  const rawConnection =
    dbEnv.DATABASE_URL ||
    dbEnv.NEON_DATABASE_URL ||
    dbEnv.NETLIFY_DATABASE_URL ||
    "";
  let connectionString = rawConnection;
  
  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) {
    connectionString = postgresMatch[0];
  }
  
  // Remove problematic parameters that cause connection issues
  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");
  connectionString = connectionString.replace(/[&?]pooler_timeout=[^&]*/g, "");
  connectionString = connectionString.replace(/&&/g, "&").replace(/\?&/g, "?").replace(/[?&]$/, "");
  
  return connectionString.trim();
}

// Ensure WebSocket is used if natively available
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

// Global variable to maintain connection pool across hot reloads in dev
const globalForPool = global as unknown as { _pool: Pool };
let _pool: Pool = globalForPool._pool;

function getPool(): Pool {
  if (_pool) return _pool;
  
  const connectionString = getCleanConnectionString();
  if (connectionString && (connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://"))) {
    _pool = new Pool({ connectionString });
    if (process.env.NODE_ENV !== "production") {
      globalForPool._pool = _pool;
    }
    return _pool;
  }
  
  throw new Error(
    "Database not configured. Please set DATABASE_URL environment variable in .env.local file.\n" +
    "Example: DATABASE_URL=postgresql://username:password@hostname/database\n" +
    "Get your connection string from your Neon dashboard at https://console.neon.tech"
  );
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
    return err;
  }

  const fallbackMessage =
    typeof err === "string" && err.length > 0 ? err : "Database query failed";
  const wrapped = new Error(fallbackMessage);
  if (asAny?.code) {
    (wrapped as any).code = asAny.code;
  }
  return wrapped;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 1000): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        console.log(`[DB] Query succeeded after ${attempt} retry(s)`);
      }
      return result;
    } catch (err) {
      lastError = err;
      const isTimeout = isTimeoutError(err);
      const errorCode = (err as any)?.code;
      
      console.warn(`[DB] Attempt ${attempt + 1}/${retries + 1} failed:`, {
        code: errorCode,
        isTimeout,
        message: (err as Error)?.message?.substring(0, 100)
      });
      
      if (attempt === retries) {
        console.error(`[DB] All ${retries + 1} attempts exhausted`);
        throw normalizeDbError(err);
      }
      
      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
      console.log(`[DB] Retrying in ${Math.round(delay)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw normalizeDbError(lastError);
}

function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> {
  return withRetry(async () => {
    let queryText = strings[0];
    for (let i = 1; i < strings.length; i++) {
        queryText += `$${i}` + strings[i];
    }
    const pool = getPool();
    const { rows } = await pool.query(queryText, values);
    return rows;
  });
}

async function sqlUnsafe(queryText: string, params?: unknown[]): Promise<unknown[]> {
  return withRetry(async () => {
    const pool = getPool();
    const { rows } = await pool.query(queryText, params);
    return rows;
  });
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
