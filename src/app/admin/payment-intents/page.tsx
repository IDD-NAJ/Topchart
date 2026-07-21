export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        { key: "user_id", label: "User ID" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "currency", label: "Currency" },
        { key: "provider", label: "Provider" },
        { key: "status", label: "Status", type: "badge", badgeVariants: { success: "default", pending: "secondary", failed: "destructive", cancelled: "outline" } },
        { key: "paystack_reference", label: "Reference" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["user_id", "paystack_reference"]}
      defaultOrderBy="created_at"
    />
  )
}
