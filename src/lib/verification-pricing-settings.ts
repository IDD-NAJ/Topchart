import { sql } from "@/lib/db"

export const CONFIG_KEY = "verification_pricing_settings"
export const CATEGORY_KEYS = [
  "social_media",
  "ecommerce_financial",
  "professional_tools",
  "streaming_entertainment",
] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export interface VerificationPricingSettings {
  exchangeRate: number
  defaultMarkup: number
  minMarkup: number | null
  maxMarkup: number | null
  categoryDefaults: Record<CategoryKey, number>
  pvadealsApiKey: string
}

export const DEFAULT_EXCHANGE_RATE = 15.5
export const DEFAULT_MARKUP = 40

export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function parseNullableMarkup(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = parseFiniteNumber(value)
  if (parsed === null || parsed < 0) return null
  return parsed
}

export function validateMarkupRange(markup: number, min: number | null, max: number | null): boolean {
  if (min !== null && markup < min) return false
  if (max !== null && markup > max) return false
  return true
}

export function normalizeCategoryDefaults(
  input: unknown,
  fallbackMarkup: number
): Record<CategoryKey, number> {
  const normalized: Record<CategoryKey, number> = {
    social_media: fallbackMarkup,
    ecommerce_financial: fallbackMarkup,
    professional_tools: fallbackMarkup,
    streaming_entertainment: fallbackMarkup,
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return normalized
  }

  for (const key of CATEGORY_KEYS) {
    const maybeValue = parseFiniteNumber((input as Record<string, unknown>)[key])
    if (maybeValue !== null && maybeValue >= 0) {
      normalized[key] = maybeValue
    }
  }

  return normalized
}

interface NormalizeOptions {
  fallbackExchangeRate?: number
  fallbackDefaultMarkup?: number
  fallbackPvadealsApiKey?: string
}

export function normalizeVerificationPricingSettings(
  raw: unknown,
  options: NormalizeOptions = {}
): VerificationPricingSettings {
  const fallbackExchangeRate =
    options.fallbackExchangeRate ?? parseFiniteNumber(process.env.NEXT_PUBLIC_USD_TO_GHS_RATE) ?? DEFAULT_EXCHANGE_RATE
  const fallbackDefaultMarkup = options.fallbackDefaultMarkup ?? DEFAULT_MARKUP
  const fallbackPvadealsApiKey = options.fallbackPvadealsApiKey ?? process.env.PVADEALS_API_KEY ?? ""

  const rawObj = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>

  const exchangeRate = parseFiniteNumber(rawObj.exchangeRate) ?? fallbackExchangeRate
  const defaultMarkup = parseFiniteNumber(rawObj.defaultMarkup) ?? fallbackDefaultMarkup

  let minMarkup = parseNullableMarkup(rawObj.minMarkup)
  let maxMarkup = parseNullableMarkup(rawObj.maxMarkup)
  if (minMarkup !== null && maxMarkup !== null && minMarkup > maxMarkup) {
    const tmp = minMarkup
    minMarkup = maxMarkup
    maxMarkup = tmp
  }

  const categoryDefaults = normalizeCategoryDefaults(rawObj.categoryDefaults, defaultMarkup)

  const pvadealsApiKeyRaw = rawObj.pvadealsApiKey
  const pvadealsApiKey =
    typeof pvadealsApiKeyRaw === "string" && pvadealsApiKeyRaw.trim().length > 0
      ? pvadealsApiKeyRaw
      : fallbackPvadealsApiKey

  return {
    exchangeRate,
    defaultMarkup,
    minMarkup,
    maxMarkup,
    categoryDefaults,
    pvadealsApiKey,
  }
}

export async function fetchVerificationPricingSettings(): Promise<VerificationPricingSettings> {
  const rows = await sql`
    SELECT config_value FROM system_config WHERE config_key = ${CONFIG_KEY}
  `
  const raw = rows?.[0]?.config_value ?? {}
  return normalizeVerificationPricingSettings(raw)
}

export async function saveVerificationPricingSettings(
  settings: VerificationPricingSettings,
  updatedBy?: string
): Promise<void> {
  const payload = JSON.stringify(settings)
  await sql`
    INSERT INTO system_config (config_key, config_value, updated_at, updated_by)
    VALUES (${CONFIG_KEY}, ${payload}::jsonb, NOW(), ${updatedBy ?? null})
    ON CONFLICT (config_key) DO UPDATE SET
      config_value = ${payload}::jsonb,
      updated_at = NOW(),
      updated_by = ${updatedBy ?? null}
  `
}
