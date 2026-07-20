"use client"

import { useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { Package, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface SyncResult {
  syncedCount?: number;
  errorCount?: number;
  priceChanges?: Array<unknown>;
  rejectedPrices?: Array<unknown>;
  source?: string;
  networkResults?: Array<{ network: string; syncedCount: number; errorCount: number }>;
}

export default function DataBundlesPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)

  const handleSync = async (force = false) => {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/sync-datamart-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force })
      })
      const data = await res.json()
      if (data.success) {
        setLastSync(data)
        toast.success(`Synced ${data.syncedCount ?? 0} plans from DataMart (${data.source ?? "api"})`)
        if (data.errorCount > 0) {
          toast.warning(`${data.errorCount} errors during sync`)
        }
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch {
      toast.error("Sync failed — check API key and connectivity")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Bundles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Prices synced from DataMart API for MTN, Telecel, and AirtelTigo</p>
        </div>
        <div className="flex gap-2">
          {lastSync && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{lastSync.syncedCount ?? 0} synced</Badge>
              {(lastSync.errorCount ?? 0) > 0 && <Badge variant="destructive">{lastSync.errorCount} errors</Badge>}
              <Badge variant="secondary">{lastSync.source ?? "api"}</Badge>
            </div>
          )}
          <Button onClick={() => handleSync(false)} disabled={syncing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Prices"}
          </Button>
          <Button onClick={() => handleSync(true)} disabled={syncing} variant="default">
            <Zap className="mr-2 h-4 w-4" />
            Force Re-seed All
          </Button>
        </div>
      </div>
      <DataTable
        title="Data Bundles"
        tableName="data_bundles"
        icon={<Package className="h-5 w-5" />}
        columns={[
          { key: "id", label: "ID" },
          { key: "network_id", label: "Network ID" },
          { key: "network", label: "Network" },
          { key: "name", label: "Name" },
          { key: "validity", label: "Validity" },
          { key: "price", label: "Price", type: "number" },
          { key: "is_popular", label: "Popular", type: "boolean", bulkEditable: true },
          { key: "is_active", label: "Active", type: "boolean", bulkEditable: true },
        ]}
        searchableColumns={["name", "network"]}
        defaultOrderBy="id"
      />
    </div>
  )
}
