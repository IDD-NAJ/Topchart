export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { ClipboardCheck } from "lucide-react"

export default function KycReviewsPage() {
  return (
    <DataTable
      title="KYC Reviews"
      tableName="kyc_reviews"
      icon={<ClipboardCheck className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "kycProfileId", label: "KYC Profile ID" },
        { key: "reviewerId", label: "Reviewer ID" },
        { key: "decision", label: "Decision", type: "badge", badgeVariants: { APPROVE: "default", REJECT: "destructive" } },
        { key: "notes", label: "Notes" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["kycProfileId", "reviewerId"]}
      defaultOrderBy="createdAt"
    />
  )
}
