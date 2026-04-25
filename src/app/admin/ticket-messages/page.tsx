"use client"

import { DataTable } from "@/components/admin/DataTable"
import { MessageSquare } from "lucide-react"

export default function TicketMessagesPage() {
  return (
    <DataTable
      title="Ticket Messages"
      tableName="ticket_messages"
      icon={<MessageSquare className="h-5 w-5" />}
      columns={[
        { key: "id", label: "ID" },
        { key: "ticketId", label: "Ticket ID" },
        { key: "senderType", label: "Sender", type: "badge", badgeVariants: { USER: "outline", ADMIN: "default", SYSTEM: "secondary" } },
        { key: "body", label: "Message" },
        { key: "attachments", label: "Attachments", type: "json" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["ticketId", "body"]}
      defaultOrderBy="createdAt"
    />
  )
}
