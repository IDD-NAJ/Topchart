"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Monitor } from "lucide-react"

export default function UserSessionsPage() {
  return (
    <DataTable
      title="User Sessions"
      tableName="auth_sessions"
      icon={<Monitor className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "user_id", label: "User ID" },
        { key: "device_info", label: "Device" },
        { key: "ip", label: "IP Address" },
        { key: "is_active", label: "Active", type: "boolean" },
        { key: "last_seen_at", label: "Last Seen", type: "date" },
        { key: "expires_at", label: "Expires", type: "date" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["user_id", "ip"]}
      defaultOrderBy="created_at"
    />
  )
}
