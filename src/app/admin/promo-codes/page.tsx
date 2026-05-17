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
        { key: "discount_type", label: "Type", type: "badge", badgeVariants: { percentage: "default", fixed: "secondary" } },
        { key: "discount_value", label: "Value", type: "number" },
        { key: "max_uses", label: "Max Usage", type: "number" },
        { key: "max_uses_per_user", label: "Per User", type: "number" },
        { key: "starts_at", label: "Start", type: "date" },
        { key: "expires_at", label: "End", type: "date" },
        { key: "is_active", label: "Active", type: "boolean" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["code"]}
      defaultOrderBy="created_at"
    />
  )
}
