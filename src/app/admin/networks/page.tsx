"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Radio } from "lucide-react"

export default function NetworksPage() {
  return (
    <DataTable
      title="Networks"
      tableName="networks"
      icon={<Radio className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "code", label: "Code", type: "badge", badgeVariants: { mtn: "default", vodafone: "secondary", airteltigo: "outline", glo: "outline" } },
        { key: "prefixes", label: "Prefixes", type: "json" },
        { key: "min_amount", label: "Min Amount", type: "number" },
        { key: "max_amount", label: "Max Amount", type: "number" },
        { key: "is_active", label: "Active", type: "boolean", bulkEditable: true },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["name", "code"]}
      defaultOrderBy="created_at"
    />
  )
}
