"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Tag } from "lucide-react"

export default function PromoCodesPage() {
  return (
    <DataTable
      title="Promo Codes"
      tableName="promo_codes"
      icon={<Tag className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "code", label: "Code" },
        { key: "type", label: "Type", type: "badge", badgeVariants: { PERCENTAGE: "default", FIXED: "secondary", BONUS_CREDIT: "outline" } },
        { key: "value", label: "Value", type: "number" },
        { key: "maxUsage", label: "Max Usage", type: "number" },
        { key: "perUserLimit", label: "Per User", type: "number" },
        { key: "startAt", label: "Start", type: "date" },
        { key: "endAt", label: "End", type: "date" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["code"]}
      defaultOrderBy="createdAt"
    />
  )
}
