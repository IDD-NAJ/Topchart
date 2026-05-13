"use client"

import { DataTable } from "@/components/admin/DataTable"
import { ArrowLeftRight } from "lucide-react"

export default function TransactionsPage() {
  return (
    <DataTable
      title="Transactions"
      tableName="transactions"
      icon={<ArrowLeftRight className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "type", label: "Type", type: "badge", badgeVariants: { DEPOSIT: "default", WITHDRAWAL: "secondary", AIRTIME: "outline", DATA: "outline", REFUND: "destructive", BONUS: "default", REFERRAL: "default" }, options: [{ value: "DEPOSIT", label: "Deposit" }, { value: "WITHDRAWAL", label: "Withdrawal" }, { value: "AIRTIME", label: "Airtime" }, { value: "DATA", label: "Data" }, { value: "REFUND", label: "Refund" }, { value: "BONUS", label: "Bonus" }, { value: "REFERRAL", label: "Referral" }] },
        { key: "status", label: "Status", type: "badge", badgeVariants: { SUCCESS: "default", PENDING: "secondary", FAILED: "destructive", REVERSED: "outline" }, bulkEditable: true, options: [{ value: "SUCCESS", label: "Success" }, { value: "PENDING", label: "Pending" }, { value: "FAILED", label: "Failed" }, { value: "REVERSED", label: "Reversed" }] },
        { key: "amount", label: "Amount", type: "number" },
        { key: "currency", label: "Currency", bulkEditable: true },
        { key: "user_id", label: "User ID" },
        { key: "reference", label: "Reference" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["user_id", "reference"]}
      defaultOrderBy="created_at"
    />
  )
}
