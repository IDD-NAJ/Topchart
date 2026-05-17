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
        { key: "referrer_id", label: "Referrer ID" },
        { key: "referred_id", label: "Referred ID" },
        { key: "reward_amount", label: "Amount", type: "number" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { pending: "secondary", paid: "default" } },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["referrer_id"]}
      defaultOrderBy="created_at"
    />
  )
}
