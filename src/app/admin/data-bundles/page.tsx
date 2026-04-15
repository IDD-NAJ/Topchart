"use client"

import { useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { Package, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DataBundlesPage() {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/sync-datamart-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch (error) {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Bundles</h1>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync from DataMart"}
        </Button>
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
          { key: "synced_at", label: "Synced", type: "date" },
        ]}
        searchableColumns={["name", "network"]}
        defaultOrderBy="synced_at"
      />
    </div>
  )
}
