"use client"

import { useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { Wifi, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface SyncResult {
  checked: number;
  updated: number;
  failed: number;
  skipped: number;
}

export default function DataPurchasesPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const handleAutoConfirm = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/datamart/auto-confirm-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxOrders: 50 }),
      });
      const data = await res.json();
      if (data.success) {
        setLastSyncResult(data);
        toast.success(`Checked ${data.checked} orders, confirmed ${data.updated}, failed ${data.failed}`);
      } else {
        toast.error(data.error || "Auto-confirm failed");
      }
    } catch {
      toast.error("Auto-confirm request failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Bundle Purchases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">DataMart order tracking and status management</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSyncResult && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{lastSyncResult.checked} checked</Badge>
              <Badge variant="default">{lastSyncResult.updated} updated</Badge>
              {lastSyncResult.failed > 0 && <Badge variant="destructive">{lastSyncResult.failed} failed</Badge>}
            </div>
          )}
          <Button onClick={handleAutoConfirm} disabled={syncing} variant="default">
            {syncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {syncing ? "Checking Orders..." : "Auto-Confirm Pending Orders"}
          </Button>
        </div>
      </div>

      <DataTable
        title="Data Bundle Purchases"
        tableName="datamart_orders"
        icon={<Wifi className="h-5 w-5" />}
        columns={[
          { key: "id", label: "ID" },
          { key: "phone_number", label: "Phone" },
          { key: "network", label: "Network" },
          { key: "capacity", label: "Capacity" },
          { key: "price", label: "Price (GHS)" },
          { key: "gateway", label: "Gateway" },
          { key: "status", label: "Status", type: "badge", badgeVariants: { completed: "default", pending: "secondary", failed: "destructive", refunded: "outline" }, bulkEditable: true },
          { key: "order_reference", label: "Order Ref" },
          { key: "retry_count", label: "Retries" },
          { key: "error_message", label: "Error" },
          { key: "created_at", label: "Created", type: "date" },
        ]}
        searchableColumns={["phone_number", "network", "order_reference"]}
        defaultOrderBy="created_at"
      />
    </div>
  );
}
