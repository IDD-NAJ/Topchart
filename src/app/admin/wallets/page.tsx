"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Wallet } from "lucide-react"

export default function WalletsPage() {
  return (
    <DataTable
      title="Wallets"
      tableName="wallets"
      icon={<Wallet className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "currency", label: "Currency" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { ACTIVE: "default", FROZEN: "secondary", CLOSED: "destructive" }, bulkEditable: true },
        { key: "availableBalance", label: "Available", type: "number" },
        { key: "pendingBalance", label: "Pending", type: "number" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId"]}
      defaultOrderBy="createdAt"
    />
  )
}
