export type AdsPurchaseOptions = {
  value?: number | string | null
  currency?: string | null
}

function parseAdsValue(value: number | string | null | undefined): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function adsValueFromData(data: Record<string, unknown> | undefined): number | undefined {
  return parseAdsValue(
    (data?.amount ?? data?.base_price ?? data?.price) as number | string | null | undefined
  )
}

export function trackAdsPurchase(txId?: string | null, options?: AdsPurchaseOptions) {
  if (!txId) return
  if (typeof window === "undefined") return
  const enabled = process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED !== "false"
  if (!enabled) return
  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO || "AW-18200576208/zD3mCKe90rYcENCB2-ZD"
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; __ads_tx?: Record<string, boolean> }
  if (typeof w.gtag !== "function") return
  w.__ads_tx = w.__ads_tx || {}
  const key = String(txId)
  if (w.__ads_tx[key]) return
  w.__ads_tx[key] = true

  const payload: Record<string, unknown> = { send_to: sendTo, transaction_id: key }
  const value = parseAdsValue(options?.value ?? undefined)
  if (value != null) {
    payload.value = value
    payload.currency = options?.currency || "GHS"
  }

  w.gtag("event", "conversion", payload)
}
