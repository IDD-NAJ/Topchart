"use client"

import { DataTable } from "@/components/admin/DataTable"
import { UserCheck } from "lucide-react"

export default function KycProfilesPage() {
  return (
    <DataTable
      title="KYC Profiles"
      tableName="kyc_profiles"
      icon={<UserCheck className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "level", label: "Level", type: "badge", badgeVariants: { BASIC: "outline", VERIFIED: "default", PREMIUM: "secondary" }, bulkEditable: true },
        { key: "status", label: "Status", type: "badge", badgeVariants: { APPROVED: "default", PENDING: "secondary", REJECTED: "destructive" }, bulkEditable: true },
        { key: "riskScore", label: "Risk Score", type: "number" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId"]}
      defaultOrderBy="createdAt"
    />
  )
}
