"use client"

import { DataTable } from "@/components/admin/DataTable"
import { UserPlus } from "lucide-react"

export default function ReferralsPage() {
  return (
    <DataTable
      title="Referrals"
      tableName="referrals"
      icon={<UserPlus className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "referrer_id", label: "Referrer ID" },
        { key: "referred_id", label: "Referee ID" },
        { key: "code", label: "Code" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { pending: "secondary", completed: "default" } },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["referrer_id", "referred_id", "code"]}
      defaultOrderBy="created_at"
    />
  )
}
