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
        { key: "type", label: "Type", type: "badge", badgeVariants: { USER_WALLET: "default", REVENUE: "secondary", FEE: "outline", SETTLEMENT: "outline", PROMO: "outline", REFERRAL: "outline" } },
        { key: "refId", label: "Reference ID" },
        { key: "currency", label: "Currency" },
        { key: "balance", label: "Balance", type: "number" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["refId"]}
      defaultOrderBy="createdAt"
    />
  )
}
