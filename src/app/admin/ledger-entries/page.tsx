"use client"

import { DataTable } from "@/components/admin/DataTable"
import { BookOpen } from "lucide-react"

export default function LedgerEntriesPage() {
  return (
    <DataTable
      title="Ledger Entries"
      tableName="ledger_entries"
      icon={<BookOpen className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "account_id", label: "Account ID" },
        { key: "transaction_id", label: "Transaction ID" },
        { key: "entry_type", label: "Direction", type: "badge", badgeVariants: { debit: "destructive", credit: "default" } },
        { key: "amount", label: "Amount", type: "number" },
        { key: "balance_after", label: "Balance After", type: "number" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["account_id", "transaction_id"]}
      defaultOrderBy="created_at"
    />
  )
}
