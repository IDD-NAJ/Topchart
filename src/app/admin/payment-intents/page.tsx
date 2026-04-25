"use client"

import { DataTable } from "@/components/admin/DataTable"
import { CreditCard } from "lucide-react"

export default function PaymentIntentsPage() {
  return (
    <DataTable
      title="Payment Intents"
      tableName="payment_intents"
      icon={<CreditCard className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "userId", label: "User ID" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "currency", label: "Currency" },
        { key: "channel", label: "Channel", type: "badge", badgeVariants: { CARD: "default", MOBILE_MONEY: "secondary", BANK_TRANSFER: "outline", USSD: "outline" } },
        { key: "status", label: "Status", type: "badge", badgeVariants: { SUCCESS: "default", PENDING: "secondary", FAILED: "destructive", CANCELLED: "outline" } },
        { key: "paystackReference", label: "Reference" },
        { key: "expiresAt", label: "Expires", type: "date" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId", "paystackReference"]}
      defaultOrderBy="createdAt"
    />
  )
}
