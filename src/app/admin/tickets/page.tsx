export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { DataTable } from "@/components/admin/DataTable"
import { Ticket } from "lucide-react"

export default function TicketsPage() {
  return (
    <DataTable
      title="Support Tickets"
      tableName="tickets"
      icon={<Ticket className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID", bulkEditable: true },
        { key: "userId", label: "User ID", bulkEditable: true },
        { key: "subject", label: "Subject", bulkEditable: true },
        { key: "status", label: "Status", type: "badge", badgeVariants: { OPEN: "secondary", IN_PROGRESS: "default", RESOLVED: "default", CLOSED: "outline" }, bulkEditable: true },
        { key: "priority", label: "Priority", type: "badge", badgeVariants: { LOW: "outline", MEDIUM: "secondary", HIGH: "default", URGENT: "destructive" }, bulkEditable: true },
        { key: "channel", label: "Channel", type: "badge", badgeVariants: { EMAIL: "outline", CHAT: "secondary", IN_APP: "default" }, bulkEditable: true },
        { key: "createdAt", label: "Created", type: "date", bulkEditable: true },
      ]}
      searchableColumns={["userId", "subject"]}
      defaultOrderBy="createdAt"
    />
  )
}
