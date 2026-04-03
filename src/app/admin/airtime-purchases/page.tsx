"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Phone } from "lucide-react"

export default function AirtimePurchasesPage() {
  return (
    <DataTable
      title="Airtime Purchases"
      tableName="airtime_purchases"
      icon={<Phone className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "networkId", label: "Network" },
        { key: "recipientPhone", label: "Phone" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { SUCCESS: "default", PENDING: "secondary", FAILED: "destructive" }, bulkEditable: true },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId", "recipientPhone"]}
      defaultOrderBy="createdAt"
    />
  )
}
