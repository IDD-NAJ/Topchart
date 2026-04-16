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

async function withRetry<T>(fn: () => Promise<T>, retries = 4, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTimeoutError(err) || attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
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
