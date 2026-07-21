export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Webhook } from "lucide-react"

export default function PaymentEventsPage() {
  return (
    <DataTable
      title="Payment Provider Events"
      tableName="payment_events"
      icon={<Webhook className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "provider", label: "Provider" },
        { key: "event_type", label: "Event Type" },
        { key: "status", label: "Status" },
        { key: "payload", label: "Payload", type: "json" },
        { key: "created_at", label: "Created", type: "date" },
      ]}
      searchableColumns={["provider", "event_type"]}
      defaultOrderBy="created_at"
    />
  )
}
