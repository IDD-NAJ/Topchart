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
});

type ServerEnv = z.infer<typeof envSchema>;
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
type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

const paystackEnvSchema = z.object({
  PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
});
type PaystackEnv = z.infer<typeof paystackEnvSchema>;

const supabaseStorageEnvSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_BUCKET_HOMEPAGE_MEDIA: z.string().optional(),
});
type SupabaseStorageEnv = z.infer<typeof supabaseStorageEnvSchema>;

const datamartEnvSchema = z.object({
  DATAMART_API_KEY: z.string().min(1, "DATAMART_API_KEY is required"),
  DATAMART_BASE_URL: z.string().url().optional(),
});
type DatamartEnv = z.infer<typeof datamartEnvSchema>;

const reloadlyEnvSchema = z.object({
  RELOADLY_CLIENT_ID: z.string().min(1, "RELOADLY_CLIENT_ID is required"),
  RELOADLY_CLIENT_SECRET: z.string().min(1, "RELOADLY_CLIENT_SECRET is required"),
  RELOADLY_BASE_URL: z.string().url().optional(),
  RELOADLY_API_BASE_URL: z.string().url().optional(), // Legacy support
  RELOADLY_AUTH_URL: z.string().url().optional(),
  RELOADLY_SANDBOX: z.enum(["true", "false"]).optional(),
});
type ReloadlyEnv = z.infer<typeof reloadlyEnvSchema>;

let cachedEnv: ServerEnv | null = null;
let cachedDatabaseEnv: DatabaseEnv | null = null;
let cachedPaystackEnv: PaystackEnv | null = null;
let cachedSupabaseStorageEnv: SupabaseStorageEnv | null = null;
let cachedDatamartEnv: DatamartEnv | null = null;
let cachedReloadlyEnv: ReloadlyEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid server environment: ${errors}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getDatabaseEnv(): DatabaseEnv {
  if (cachedDatabaseEnv) {
    return cachedDatabaseEnv;
  }

  const parsed = databaseEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid database environment: ${errors}`);
  }

  cachedDatabaseEnv = parsed.data;
  return cachedDatabaseEnv;
}

export function getPaystackEnv(): PaystackEnv {
  if (cachedPaystackEnv) {
    return cachedPaystackEnv;
  }

  const parsed = paystackEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid Paystack environment: ${errors}`);
  }

  cachedPaystackEnv = parsed.data;
  return cachedPaystackEnv;
}

export function getSupabaseStorageEnv(): SupabaseStorageEnv {
  if (cachedSupabaseStorageEnv) {
    return cachedSupabaseStorageEnv;
  }

  const parsed = supabaseStorageEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid Supabase storage environment: ${errors}`);
  }

  cachedSupabaseStorageEnv = parsed.data;
  return cachedSupabaseStorageEnv;
}

export function getDatamartEnv(): DatamartEnv {
  if (cachedDatamartEnv) {
    return cachedDatamartEnv;
  }

  const parsed = datamartEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid DataMart environment: ${errors}`);
  }

  cachedDatamartEnv = parsed.data;
  return cachedDatamartEnv;
}

export function getReloadlyEnv(): ReloadlyEnv {
  if (cachedReloadlyEnv) {
    return cachedReloadlyEnv;
  }

  const parsed = reloadlyEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid Reloadly environment: ${errors}`);
  }

  // Use RELOADLY_BASE_URL first, fallback to RELOADLY_API_BASE_URL
  if (!parsed.data.RELOADLY_BASE_URL && parsed.data.RELOADLY_API_BASE_URL) {
    parsed.data.RELOADLY_BASE_URL = parsed.data.RELOADLY_API_BASE_URL;
  }

  cachedReloadlyEnv = parsed.data;
  return cachedReloadlyEnv;
}
