export function trackAdsPurchase(txId?: string | null) {
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
  w.gtag("event", "conversion", { send_to: sendTo, transaction_id: key })
}
