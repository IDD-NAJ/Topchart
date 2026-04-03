"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Package } from "lucide-react"

export default function DataBundlesPage() {
  return (
    <DataTable
      title="Data Bundles"
      tableName="data_bundles"
      icon={<Package className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "networkId", label: "Network ID" },
        { key: "categoryId", label: "Category ID" },
        { key: "name", label: "Name" },
        { key: "sizeMb", label: "Size (MB)", type: "number" },
        { key: "validityHours", label: "Validity (hrs)", type: "number" },
        { key: "price", label: "Price", type: "number" },
        { key: "isPopular", label: "Popular", type: "boolean", bulkEditable: true },
        { key: "isActive", label: "Active", type: "boolean", bulkEditable: true },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["name", "networkId"]}
      defaultOrderBy="createdAt"
    />
  )
}
