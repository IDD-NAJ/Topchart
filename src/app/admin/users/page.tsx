export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Users } from "lucide-react"

export default function UsersPage() {
  return (
    <DataTable
      title="Users"
      tableName="users"
      icon={<Users className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "first_name", label: "First Name" },
        { key: "last_name", label: "Last Name" },
        { key: "wallet_balance", label: "Balance", type: "number" },
        { key: "is_verified", label: "Verified", type: "boolean", bulkEditable: true },
        { key: "role", label: "Role", bulkEditable: true },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["email", "phone", "first_name", "last_name"]}
      defaultOrderBy="created_at"
    />
  )
}
