"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Eye } from "lucide-react"

export default function ReferralVisitsPage() {
  return (
    <DataTable
      title="Referral Visits"
      tableName="referral_visits"
      icon={<Eye className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "referrer_id", label: "Referrer ID" },
        { key: "referred_user_id", label: "Referred User ID" },
        { key: "visitor_ip", label: "Visitor IP" },
        { key: "credited", label: "Credited", type: "boolean" },
        { key: "amount_credited", label: "Amount", type: "number" },
        { key: "deposit_qualified", label: "Deposit Qualified", type: "boolean" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["referrer_id", "visitor_ip"]}
      defaultOrderBy="created_at"
    />
  )
}
