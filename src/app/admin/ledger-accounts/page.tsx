"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Building } from "lucide-react"

export default function LedgerAccountsPage() {
  return (
    <DataTable
      title="Ledger Accounts"
      tableName="ledger_accounts"
      icon={<Building className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "type", label: "Type", type: "badge", badgeVariants: { asset: "default", liability: "secondary", revenue: "outline", expense: "outline" } },
        { key: "currency", label: "Currency" },
        { key: "balance", label: "Balance", type: "number" },
        { key: "is_active", label: "Active", type: "boolean" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["name"]}
      defaultOrderBy="created_at"
    />
  )
}
