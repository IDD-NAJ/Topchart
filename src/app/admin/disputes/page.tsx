export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { AlertTriangle } from "lucide-react"

export default function DisputesPage() {
  return (
    <DataTable
      title="Disputes"
      tableName="disputes"
      icon={<AlertTriangle className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "transactionId", label: "Transaction ID" },
        { key: "userId", label: "User ID" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { OPEN: "secondary", IN_PROGRESS: "default", RESOLVED: "default", CLOSED: "outline" }, bulkEditable: true },
        { key: "reason", label: "Reason" },
        { key: "resolution", label: "Resolution" },
        { key: "createdAt", label: "Created", type: "date" },
        { key: "resolvedAt", label: "Resolved", type: "date" },
      ]}
      searchableColumns={["userId", "transactionId", "reason"]}
      defaultOrderBy="createdAt"
    />
  )
}
