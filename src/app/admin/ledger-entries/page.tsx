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
        { key: "transactionId", label: "Transaction ID" },
        { key: "ledgerAccountId", label: "Ledger Account ID" },
        { key: "direction", label: "Direction", type: "badge", badgeVariants: { DEBIT: "destructive", CREDIT: "default" } },
        { key: "amount", label: "Amount", type: "number" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["transactionId", "ledgerAccountId"]}
      defaultOrderBy="createdAt"
    />
  )
}
