"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Award } from "lucide-react"

export default function ReferralRewardsPage() {
  return (
    <DataTable
      title="Referral Rewards"
      tableName="referral_rewards"
      icon={<Award className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "referralId", label: "Referral ID" },
        { key: "transactionId", label: "Transaction ID" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { PENDING: "secondary", CREDITED: "default" } },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["referralId"]}
      defaultOrderBy="createdAt"
    />
  )
}
