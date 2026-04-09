import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getServerEnv } from "@/lib/env";

function getCleanConnectionString(): string {
  const rawConnection =
    getServerEnv().DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_URL ||
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

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  
  const connectionString = getCleanConnectionString();
  if (connectionString && (connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://"))) {
    _sql = neon(connectionString);
    return _sql;
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
    (typeof e.message === "string" && e.message.includes("fetch failed"))
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
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

function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return withRetry(() => getSql()(strings, ...values));
}

async function sqlUnsafe(queryText: string, params?: unknown[]): Promise<unknown[]> {
  return withRetry(async () => {
    const neonSql = getSql();
    if (params && params.length > 0) {
      const parts = queryText.split(/\$\d+/);
      const strings = parts as unknown as TemplateStringsArray;
      Object.defineProperty(strings, 'raw', { value: parts });
      return neonSql(strings, ...params) as Promise<unknown[]>;
    }
    const strings = [queryText] as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: [queryText] });
    return neonSql(strings) as Promise<unknown[]>;
  });
}

export { sql, sqlUnsafe };

export async function query<T>(
  queryText: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result = await sqlUnsafe(queryText, params);
    return result as T[];
  } catch (error) {
    console.error("[v0] Database query error:", error);
    throw error;
  }
}
