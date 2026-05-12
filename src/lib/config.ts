import {
  getDatabaseEnv,
  getReloadlyEnv,
  getDatamartEnv,
  getNineProxyEnv,
} from "@/lib/env";

interface DatabaseConfig {
  url: string;
  source: "DATABASE_URL" | "NEON_DATABASE_URL" | "NETLIFY_DATABASE_URL";
}

interface ReloadlyConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  authUrl: string;
  audience: string;
  isSandbox: boolean;
}

interface DatamartConfig {
  apiKey: string;
  baseUrl: string;
}

interface NineProxyConfig {
  apiKey: string;
  baseUrl: string;
  isSandbox: boolean;
}

interface AppConfig {
  database: DatabaseConfig;
  reloadly: ReloadlyConfig | null;
  datamart: DatamartConfig | null;
  nineproxy: NineProxyConfig | null;
}

let cachedConfig: AppConfig | null = null;

function buildDatabaseConfig(): DatabaseConfig {
  const dbEnv = getDatabaseEnv();
  const url =
    dbEnv.DATABASE_URL?.trim() ||
    dbEnv.NEON_DATABASE_URL?.trim() ||
    dbEnv.NETLIFY_DATABASE_URL?.trim() ||
    "";

  if (!url) {
    throw new Error(
      "Missing required environment variables: DATABASE_URL | NEON_DATABASE_URL | NETLIFY_DATABASE_URL"
    );
  }

  const source = dbEnv.DATABASE_URL?.trim()
    ? "DATABASE_URL"
    : dbEnv.NEON_DATABASE_URL?.trim()
      ? "NEON_DATABASE_URL"
      : "NETLIFY_DATABASE_URL";

  return { url, source };
}

function buildReloadlyConfig(): ReloadlyConfig | null {
  try {
    const env = getReloadlyEnv();
    const isSandbox = env.RELOADLY_BASE_URL?.includes("sandbox") ||
                      env.RELOADLY_SANDBOX === "true" ||
                      false;

    const baseUrl = isSandbox
      ? "https://topups-sandbox.reloadly.com"
      : (env.RELOADLY_BASE_URL || env.RELOADLY_API_BASE_URL || "https://topups.reloadly.com");

    const audience = isSandbox
      ? "https://topups-sandbox.reloadly.com"
      : "https://topups.reloadly.com";

    return {
      clientId: env.RELOADLY_CLIENT_ID,
      clientSecret: env.RELOADLY_CLIENT_SECRET,
      baseUrl,
      authUrl: env.RELOADLY_AUTH_URL || "https://auth.reloadly.com/oauth/token",
      audience,
      isSandbox,
    };
  } catch {
    return null;
  }
}

function buildDatamartConfig(): DatamartConfig | null {
  try {
    const env = getDatamartEnv();
    return {
      apiKey: env.DATAMART_API_KEY,
      baseUrl: env.DATAMART_BASE_URL || "https://api.datamartgh.shop",
    };
  } catch {
    return null;
  }
}

function buildNineProxyConfig(): NineProxyConfig | null {
  try {
    const env = getNineProxyEnv();
    const isSandbox = env.NINEPROXY_SANDBOX === "true";
    return {
      apiKey: env.NINEPROXY_API_KEY,
      baseUrl: env.NINEPROXY_BASE_URL || (isSandbox ? "https://sandbox.9proxy.com" : "https://api.9proxy.com"),
      isSandbox,
    };
  } catch {
    return null;
  }
}

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    database: buildDatabaseConfig(),
    reloadly: buildReloadlyConfig(),
    datamart: buildDatamartConfig(),
    nineproxy: buildNineProxyConfig(),
  };

  return cachedConfig;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
