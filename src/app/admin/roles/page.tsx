export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { UserCog } from "lucide-react"

export default function RolesPage() {
  return (
    <DataTable
      title="Roles"
      tableName="roles"
      icon={<UserCog className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["name"]}
      defaultOrderBy="createdAt"
    />
  )
}
