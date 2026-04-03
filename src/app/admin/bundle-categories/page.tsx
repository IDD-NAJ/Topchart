"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Layers } from "lucide-react"

export default function BundleCategoriesPage() {
  return (
    <DataTable
      title="Bundle Categories"
      tableName="data_bundle_categories"
      icon={<Layers className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "networkId", label: "Network ID" },
        { key: "name", label: "Name" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["name", "networkId"]}
      defaultOrderBy="createdAt"
    />
  )
}
