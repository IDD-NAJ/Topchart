"use client"

import { DataTable } from "@/components/admin/DataTable"
import { FileCheck } from "lucide-react"

export default function KycDocumentsPage() {
  return (
    <DataTable
      title="KYC Documents"
      tableName="kyc_documents"
      icon={<FileCheck className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "kycProfileId", label: "KYC Profile ID" },
        { key: "type", label: "Type", type: "badge", badgeVariants: { _CARD: "default", VOTER_ID: "secondary", PASSPORT: "outline", SELFIE: "outline" } },
        { key: "status", label: "Status", type: "badge", badgeVariants: { APPROVED: "default", PENDING: "secondary", REJECTED: "destructive" } },
        { key: "storageKey", label: "Storage Key" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["kycProfileId"]}
      defaultOrderBy="createdAt"
    />
  )
}
