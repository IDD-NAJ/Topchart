"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Shield } from "lucide-react"

export default function AdminUsersPage() {
  return (
    <DataTable
      title="Admin Users"
      tableName="admin_users"
      icon={<Shield className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "email", label: "Email" },
        { key: "name", label: "Name" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { ACTIVE: "default", INACTIVE: "secondary" } },
        { key: "mfaEnabled", label: "MFA", type: "boolean" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["email", "name"]}
      defaultOrderBy="createdAt"
    />
  )
}
