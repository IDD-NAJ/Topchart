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
        { key: "promoCodeId", label: "Promo Code ID" },
        { key: "userId", label: "User ID" },
        { key: "transactionId", label: "Transaction ID" },
        { key: "appliedAmount", label: "Amount Applied", type: "number" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId", "promoCodeId"]}
      defaultOrderBy="createdAt"
    />
  )
}
