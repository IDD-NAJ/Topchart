export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Gift } from "lucide-react"

export default function PromoRedemptionsPage() {
  return (
    <DataTable
      title="Promo Redemptions"
      tableName="promo_redemptions"
      icon={<Gift className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "promo_id", label: "Promo ID" },
        { key: "user_id", label: "User ID" },
        { key: "order_id", label: "Order ID" },
        { key: "discount_applied", label: "Amount Applied", type: "number" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["user_id", "promo_id"]}
      defaultOrderBy="created_at"
    />
  )
}
