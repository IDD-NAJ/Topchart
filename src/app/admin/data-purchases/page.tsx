"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Wifi } from "lucide-react"

export default function DataPurchasesPage() {
  return (
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
        { key: "error_message", label: "Error" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["phone_number", "network", "order_reference"]}
      defaultOrderBy="created_at"
    />
  )
}
