"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, AlertTriangle, RefreshCw } from "lucide-react"

interface DeliveryStats {
  delivered: number
  pending: number
  failed: number
}

interface DeliveryTrackerData {
  stats: DeliveryStats
  lastDelivered?: Record<string, unknown> | null
  checkingNow?: Record<string, unknown> | null
  yourOrders?: Record<string, unknown> | null
  message?: string
}

export function DeliveryTrackerWidget() {
  const [data, setData] = useState<DeliveryTrackerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/datamart/delivery-tracker", { cache: "no-store" })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || "Failed to fetch delivery stats")
      }
      setData(json.data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delivery stats")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => fetchStats(), 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading delivery stats...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="w-4 h-4" />
        <span>Unable to load delivery stats</span>
      </div>
    )
  }

  if (!data) return null

  const { stats } = data

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{stats.delivered} Delivered</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{stats.pending} Pending</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{stats.failed} Failed</span>
      </div>
      <button
        onClick={() => fetchStats(true)}
        disabled={refreshing}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        <span>Refresh</span>
      </button>
    </div>
  )
}
