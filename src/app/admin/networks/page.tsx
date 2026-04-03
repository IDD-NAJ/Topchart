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
        { key: "code", label: "Code", type: "badge", badgeVariants: { MTN: "default", VODAFONE: "secondary", AIRTELTIGO: "outline", GLO: "outline" } },
        { key: "prefixes", label: "Prefixes", type: "json" },
        { key: "minAmount", label: "Min Amount", type: "number" },
        { key: "maxAmount", label: "Max Amount", type: "number" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { ACTIVE: "default", INACTIVE: "secondary" }, bulkEditable: true },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["name", "code"]}
      defaultOrderBy="createdAt"
    />
  )
}
