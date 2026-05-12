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
        { key: "referrerId", label: "Referrer ID" },
        { key: "refereeId", label: "Referee ID" },
        { key: "code", label: "Code" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { PENDING: "secondary", COMPLETED: "default" } },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["referrerId", "refereeId", "code"]}
      defaultOrderBy="createdAt"
    />
  )
}
