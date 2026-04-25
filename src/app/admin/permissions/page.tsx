"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Key } from "lucide-react"

export default function PermissionsPage() {
  return (
    <DataTable
      title="Permissions"
      tableName="permissions"
      icon={<Key className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "code", label: "Code" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["code", "description"]}
      defaultOrderBy="createdAt"
    />
  )
}
