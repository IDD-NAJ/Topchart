import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NEON_DATABASE_URL: z.string().optional(),
  NETLIFY_DATABASE_URL: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PVADEALS_API_KEY: z.string().optional(),
  PVADEALS_BASE_URL: z.string().url().optional(),
  PVADEALS_MARKUP_PERCENT: z.string().optional(),
  DATAMART_API_KEY: z.string().optional(),
  DATAMART_BASE_URL: z.string().url().optional(),
  USD_TO_GHS_RATE: z.string().optional(),
  TEXTVERIFIED_API_KEY: z.string().optional(),
  TEXTVERIFIED_API_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET_HOMEPAGE_MEDIA: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  RELOADLY_CLIENT_ID: z.string().optional(),
  RELOADLY_CLIENT_SECRET: z.string().optional(),
  RELOADLY_BASE_URL: z.string().url().optional(),
  RELOADLY_API_BASE_URL: z.string().url().optional(),
  RELOADLY_AUTH_URL: z.string().url().optional(),
  RELOADLY_SANDBOX: z.enum(["true", "false"]).optional(),
  NINEPROXY_API_KEY: z.string().optional(),
  NINEPROXY_BASE_URL: z.string().url().optional(),
  NINEPROXY_SANDBOX: z.enum(["true", "false"]).optional(),
});

const databaseEnvSchema = z
  .object({
    DATABASE_URL: z.string().optional(),
    NEON_DATABASE_URL: z.string().optional(),
    NETLIFY_DATABASE_URL: z.string().optional(),
  })
  .refine(
    (env) =>
      Boolean(env.DATABASE_URL?.trim()) ||
      Boolean(env.NEON_DATABASE_URL?.trim()) ||
      Boolean(env.NETLIFY_DATABASE_URL?.trim()),
    "One of DATABASE_URL, NEON_DATABASE_URL, or NETLIFY_DATABASE_URL is required"
  );

const reloadlyEnvSchema = z.object({
  RELOADLY_CLIENT_ID: z.string().min(1, "RELOADLY_CLIENT_ID is required"),
  RELOADLY_CLIENT_SECRET: z.string().min(1, "RELOADLY_CLIENT_SECRET is required"),
  RELOADLY_BASE_URL: z.string().url().optional(),
  RELOADLY_API_BASE_URL: z.string().url().optional(),
  RELOADLY_AUTH_URL: z.string().url().optional(),
  RELOADLY_SANDBOX: z.enum(["true", "false"]).optional(),
});

const nineproxyEnvSchema = z.object({
  NINEPROXY_API_KEY: z.string().min(1, "NINEPROXY_API_KEY is required"),
  NINEPROXY_BASE_URL: z.string().url().optional(),
  NINEPROXY_SANDBOX: z.enum(["true", "false"]).optional(),
});

const datamartEnvSchema = z.object({
  DATAMART_API_KEY: z.string().min(1, "DATAMART_API_KEY is required"),
  DATAMART_BASE_URL: z.string().url().optional(),
});

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

function getMissingFields(issues: z.ZodIssue[]): string[] {
  return issues
    .filter((issue) => issue.code === "invalid_type")
    .map((issue) => issue.path.join("."));
}

function getDatabaseConfig(): DatabaseConfig {
  const env = process.env;
  
  const url = 
    env.DATABASE_URL?.trim() || 
    env.NEON_DATABASE_URL?.trim() || 
    env.NETLIFY_DATABASE_URL?.trim() || "";

  if (!url) {
    throw new Error(
      "Missing required environment variables: DATABASE_URL | NEON_DATABASE_URL | NETLIFY_DATABASE_URL"
    );
  }

  const source = env.DATABASE_URL?.trim() 
    ? "DATABASE_URL" 
    : env.NEON_DATABASE_URL?.trim() 
      ? "NEON_DATABASE_URL" 
      : "NETLIFY_DATABASE_URL";

  return { url, source };
}

function getReloadlyConfig(): ReloadlyConfig | null {
  const env = process.env;
  
  if (!env.RELOADLY_CLIENT_ID?.trim() || !env.RELOADLY_CLIENT_SECRET?.trim()) {
    return null;
  }

  const parsed = reloadlyEnvSchema.safeParse(env);
  if (!parsed.success) {
    const missingFields = getMissingFields(parsed.error.issues);
    throw new Error(
      missingFields.length > 0
        ? `Missing required environment variables: ${missingFields.join(", ")}`
        : `Invalid Reloadly environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`
    );
  }

  const isSandbox = parsed.data.RELOADLY_BASE_URL?.includes("sandbox") || 
                    parsed.data.RELOADLY_SANDBOX === "true" ||
                    false;
  
  const baseUrl = isSandbox 
    ? "https://topups-sandbox.reloadly.com" 
    : (parsed.data.RELOADLY_BASE_URL || parsed.data.RELOADLY_API_BASE_URL || "https://topups.reloadly.com");

  const audience = isSandbox
    ? "https://topups-sandbox.reloadly.com"
    : "https://topups.reloadly.com";

  return {
    clientId: parsed.data.RELOADLY_CLIENT_ID,
    clientSecret: parsed.data.RELOADLY_CLIENT_SECRET,
    baseUrl,
    authUrl: parsed.data.RELOADLY_AUTH_URL || "https://auth.reloadly.com/oauth/token",
    audience,
    isSandbox,
  };
}

function getDatamartConfig(): DatamartConfig | null {
  const env = process.env;
  
  if (!env.DATAMART_API_KEY?.trim()) {
    return null;
  }

  const parsed = datamartEnvSchema.safeParse(env);
  if (!parsed.success) {
    const missingFields = getMissingFields(parsed.error.issues);
    throw new Error(
      missingFields.length > 0
        ? `Missing required environment variables: ${missingFields.join(", ")}`
        : `Invalid DataMart environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`
    );
  }

  return {
    apiKey: parsed.data.DATAMART_API_KEY,
    baseUrl: parsed.data.DATAMART_BASE_URL || "https://api.datamartgh.shop",
  };
}

function getNineProxyConfig(): NineProxyConfig | null {
  const env = process.env;

  if (!env.NINEPROXY_API_KEY?.trim()) {
    return null;
  }

  const parsed = nineproxyEnvSchema.safeParse(env);
  if (!parsed.success) {
    const missingFields = getMissingFields(parsed.error.issues);
    throw new Error(
      missingFields.length > 0
        ? `Missing required environment variables: ${missingFields.join(", ")}`
        : `Invalid 9Proxy environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`
    );
  }

  const isSandbox = parsed.data.NINEPROXY_SANDBOX === "true";

  return {
    apiKey: parsed.data.NINEPROXY_API_KEY,
    baseUrl: parsed.data.NINEPROXY_BASE_URL || (isSandbox ? "https://sandbox.9proxy.com" : "https://api.9proxy.com"),
    isSandbox,
  };
}

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const database = getDatabaseConfig();
  const reloadly = getReloadlyConfig();
  const datamart = getDatamartConfig();
  const nineproxy = getNineProxyConfig();

  cachedConfig = {
    database,
    reloadly,
    datamart,
    nineproxy,
  };

  return cachedConfig;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
