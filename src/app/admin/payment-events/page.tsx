"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Webhook } from "lucide-react"

export default function PaymentEventsPage() {
  return (
    <DataTable
      title="Payment Provider Events"
      tableName="payment_provider_events"
      icon={<Webhook className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "provider", label: "Provider" },
        { key: "eventType", label: "Event Type" },
        { key: "status", label: "Status" },
        { key: "rawPayload", label: "Payload", type: "json" },
        { key: "processedAt", label: "Processed", type: "date" },
      ]}
      searchableColumns={["provider", "eventType"]}
      defaultOrderBy="processedAt"
    />
  )
}
