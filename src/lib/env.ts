import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NEON_DATABASE_URL: z.string().optional(),
  NETLIFY_DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_DATABASE_URL: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PVADEALS_API_KEY: z.string().optional(),
  PVADEALS_BASE_URL: z.string().url().optional(),
  PVADEALS_MARKUP_PERCENT: z.string().optional(),
  DATAMART_API_KEY: z.string().optional(),
  DATAMART_BASE_URL: z.string().url().optional(),
  DATAMART_WEBHOOK_SECRET: z.string().optional(),
  DATAMART_SIGNING_SECRET: z.string().optional(),
  NEXT_PUBLIC_DATAMART_API_KEY: z.string().optional(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_WHATSAPP_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_TAWK_ENABLED: z.enum(["true", "false"]).optional(),
  USD_TO_GHS_RATE: z.string().optional(),
  NEXT_PUBLIC_USD_TO_GHS_RATE: z.string().optional(),
  TEXTVERIFIED_API_KEY: z.string().optional(),
  TEXTVERIFIED_API_URL: z.string().url().optional(),
  TEXTVERIFIED_WEBHOOK_SECRET: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET_HOMEPAGE_MEDIA: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NINEPROXY_API_KEY: z.string().optional(),
  NINEPROXY_BASE_URL: z.string().url().optional(),
  NINEPROXY_SANDBOX: z.enum(["true", "false"]).optional(),
  AIRALO_CLIENT_ID: z.string().optional(),
  AIRALO_CLIENT_SECRET: z.string().optional(),
  AIRALO_WEBHOOK_SECRET: z.string().optional(),
  AIRALO_SANDBOX: z.enum(["true", "false"]).optional(),
  VTPASS_API_KEY: z.string().optional(),
  VTPASS_SECRET_KEY: z.string().optional(),
  VTPASS_BASE_URL: z.string().url().optional(),
  VTPASS_SANDBOX: z.enum(["true", "false"]).optional(),
  RELOADLY_CLIENT_ID: z.string().optional(),
  RELOADLY_CLIENT_SECRET: z.string().optional(),
  RELOADLY_BASE_URL: z.string().url().optional(),
  RELOADLY_API_BASE_URL: z.string().url().optional(),
  RELOADLY_AUTH_URL: z.string().url().optional(),
  RELOADLY_SANDBOX: z.enum(["true", "false"]).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
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
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required").optional(),
  SUPABASE_BUCKET_HOMEPAGE_MEDIA: z.string().optional(),
}).refine(
  (env) => {
    const hasUrl = env.SUPABASE_URL && env.SUPABASE_URL.trim() !== "";
    const hasKey = env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.trim() !== "";
    return (hasUrl && hasKey) || (!hasUrl && !hasKey);
  },
  "Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided together, or neither"
);
type SupabaseStorageEnv = z.infer<typeof supabaseStorageEnvSchema>;

const datamartEnvSchema = z.object({
  DATAMART_API_KEY: z.string().min(1, "DATAMART_API_KEY is required"),
  DATAMART_BASE_URL: z.string().url().optional(),
  DATAMART_WEBHOOK_SECRET: z.string().optional(),
  DATAMART_SIGNING_SECRET: z.string().optional(),
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

const nineproxyEnvSchema = z.object({
  NINEPROXY_API_KEY: z.string().min(1, "NINEPROXY_API_KEY is required"),
  NINEPROXY_BASE_URL: z.string().url().optional(),
  NINEPROXY_SANDBOX: z.enum(["true", "false"]).optional(),
});
type NineProxyEnv = z.infer<typeof nineproxyEnvSchema>;

const airaloEnvSchema = z.object({
  AIRALO_CLIENT_ID: z.string().min(1, "AIRALO_CLIENT_ID is required"),
  AIRALO_CLIENT_SECRET: z.string().min(1, "AIRALO_CLIENT_SECRET is required"),
  AIRALO_WEBHOOK_SECRET: z.string().optional(),
  AIRALO_SANDBOX: z.enum(["true", "false"]).optional(),
});
type AiraloEnv = z.infer<typeof airaloEnvSchema>;

const vtpassEnvSchema = z.object({
  VTPASS_API_KEY: z.string().min(1, "VTPASS_API_KEY is required"),
  VTPASS_SECRET_KEY: z.string().min(1, "VTPASS_SECRET_KEY is required"),
  VTPASS_BASE_URL: z.string().url().optional(),
  VTPASS_SANDBOX: z.enum(["true", "false"]).optional(),
});
type VtpassEnv = z.infer<typeof vtpassEnvSchema>;

const googleAuthEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required").optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required").optional(),
});
type GoogleAuthEnv = z.infer<typeof googleAuthEnvSchema>;

const pvadealsEnvSchema = z.object({
  PVADEALS_API_KEY: z.string().min(1, "PVADEALS_API_KEY is required"),
  PVADEALS_BASE_URL: z.string().url().optional(),
  PVADEALS_MARKUP_PERCENT: z.string().optional(),
  USD_TO_GHS_RATE: z.string().optional(),
});
type PvadealsEnv = z.infer<typeof pvadealsEnvSchema>;

let cachedEnv: ServerEnv | null = null;
let cachedDatabaseEnv: DatabaseEnv | null = null;
let cachedPaystackEnv: PaystackEnv | null = null;
let cachedSupabaseStorageEnv: SupabaseStorageEnv | null = null;
let cachedDatamartEnv: DatamartEnv | null = null;
let cachedReloadlyEnv: ReloadlyEnv | null = null;
let cachedNineProxyEnv: NineProxyEnv | null = null;
let cachedAiraloEnv: AiraloEnv | null = null;
let cachedVtpassEnv: VtpassEnv | null = null;
let cachedGoogleAuthEnv: GoogleAuthEnv | null = null;
let cachedPvadealsEnv: PvadealsEnv | null = null;

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
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid database environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
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
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid Paystack environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
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
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid Supabase storage environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
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
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid DataMart environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
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
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid Reloadly environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
  }

  // Use RELOADLY_BASE_URL first, fallback to RELOADLY_API_BASE_URL
  if (!parsed.data.RELOADLY_BASE_URL && parsed.data.RELOADLY_API_BASE_URL) {
    parsed.data.RELOADLY_BASE_URL = parsed.data.RELOADLY_API_BASE_URL;
  }

  cachedReloadlyEnv = parsed.data;
  return cachedReloadlyEnv;
}

export function getNineProxyEnv(): NineProxyEnv {
  if (cachedNineProxyEnv) {
    return cachedNineProxyEnv;
  }

  const parsed = nineproxyEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid 9Proxy environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
  }

  cachedNineProxyEnv = parsed.data;
  return cachedNineProxyEnv;
}

export function getAiraloEnv(): AiraloEnv {
  if (cachedAiraloEnv) {
    return cachedAiraloEnv;
  }

  const parsed = airaloEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid Airalo environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
  }

  cachedAiraloEnv = parsed.data;
  return cachedAiraloEnv;
}

export function getVtpassEnv(): VtpassEnv {
  if (cachedVtpassEnv) {
    return cachedVtpassEnv;
  }

  const parsed = vtpassEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid VTpass environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
  }

  cachedVtpassEnv = parsed.data;
  return cachedVtpassEnv;
}

export function getGoogleAuthEnv(): GoogleAuthEnv {
  if (cachedGoogleAuthEnv) {
    return cachedGoogleAuthEnv;
  }

  const parsed = googleAuthEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid Google Auth environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
  }

  cachedGoogleAuthEnv = parsed.data;
  return cachedGoogleAuthEnv;
}

export function getPvadealsEnv(): PvadealsEnv {
  if (cachedPvadealsEnv) {
    return cachedPvadealsEnv;
  }

  const parsed = pvadealsEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingFields = parsed.error.issues
      .filter((issue) => issue.code === "invalid_type")
      .map((issue) => issue.path.join("."));
    const message = missingFields.length > 0
      ? `Missing required environment variables: ${missingFields.join(", ")}`
      : `Invalid PVAdeals environment: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`;
    throw new Error(message);
  }

  cachedPvadealsEnv = parsed.data;
  return cachedPvadealsEnv;
}

/**
 * Check if PVAdeals is configured (API key exists).
 * Does not throw if unconfigured.
 */
export function isPvadealsConfigured(): boolean {
  return Boolean(process.env.PVADEALS_API_KEY?.trim());
}
