"use client"

import { DataTable } from "@/components/admin/DataTable"
import { ClipboardList } from "lucide-react"

export default function ActionLogsPage() {
  return (
    <DataTable
      title="Action Logs"
      tableName="admin_action_logs"
      icon={<ClipboardList className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "adminUserId", label: "Admin User ID" },
        { key: "action", label: "Action" },
        { key: "targetType", label: "Target Type" },
        { key: "targetId", label: "Target ID" },
        { key: "metadata", label: "Metadata", type: "json" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["adminUserId", "action", "targetType"]}
      defaultOrderBy="createdAt"
    />
  )
}
