"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Monitor } from "lucide-react"

export default function UserSessionsPage() {
  return (
    <DataTable
      title="User Sessions"
      tableName="user_sessions"
      icon={<Monitor className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "deviceInfo", label: "Device" },
        { key: "ip", label: "IP Address" },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "lastSeenAt", label: "Last Seen", type: "date" },
        { key: "expiresAt", label: "Expires", type: "date" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId", "ip"]}
      defaultOrderBy="createdAt"
    />
  )
}
