"use client"

import { DataTable } from "@/components/admin/DataTable"
import { CreditCard } from "lucide-react"

export default function BillPaymentsPage() {
  return (
    <DataTable
      title="Bill Payments"
      tableName="transactions"
      icon={<CreditCard className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { success: "default", pending: "secondary", failed: "destructive" } },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Date", type: "date" },
      ]}
      searchableColumns={["userId", "description"]}
      defaultOrderBy="createdAt"
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
      allowBulkDelete={false}
      allowBulkEdit={false}
    />
  )
}
