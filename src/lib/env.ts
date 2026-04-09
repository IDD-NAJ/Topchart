import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PVADEALS_API_KEY: z.string().optional(),
  PVADEALS_BASE_URL: z.string().url().optional(),
  PVADEALS_MARKUP_PERCENT: z.string().optional(),
  USD_TO_GHS_RATE: z.string().optional(),
  TEXTVERIFIED_API_KEY: z.string().optional(),
  TEXTVERIFIED_API_URL: z.string().url().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

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
