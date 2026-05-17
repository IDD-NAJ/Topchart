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
        { key: "user_id", label: "User ID" },
        { key: "bundle_id", label: "Bundle ID" },
        { key: "recipient_phone", label: "Phone" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { success: "default", pending: "secondary", failed: "destructive" }, bulkEditable: true },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["user_id", "recipient_phone"]}
      defaultOrderBy="created_at"
    />
  )
}
