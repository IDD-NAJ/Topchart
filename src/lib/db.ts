import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

function getCleanConnectionString(): string {
  const rawConnection =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_URL ||
    "";
  let connectionString = rawConnection;
  
  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) {
    connectionString = postgresMatch[0];
  }
  
  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");
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

function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getSql()(strings, ...values);
}

async function sqlUnsafe(queryText: string, params?: unknown[]): Promise<unknown[]> {
  const neonSql = getSql();
  if (params && params.length > 0) {
    let idx = 0;
    const parts = queryText.split(/\$\d+/);
    const strings = parts as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: parts });
    return neonSql(strings, ...params) as Promise<unknown[]>;
  }
  const strings = [queryText] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, 'raw', { value: [queryText] });
  return neonSql(strings) as Promise<unknown[]>;
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
