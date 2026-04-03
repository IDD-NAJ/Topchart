"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Wifi } from "lucide-react"

export default function DataPurchasesPage() {
  return (
    <DataTable
      title="Data Bundle Purchases"
      tableName="data_bundle_purchases"
      icon={<Wifi className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "bundleId", label: "Bundle ID" },
        { key: "recipientPhone", label: "Phone" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { SUCCESS: "default", PENDING: "secondary", FAILED: "destructive" }, bulkEditable: true },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId", "recipientPhone"]}
      defaultOrderBy="createdAt"
    />
  )
}
