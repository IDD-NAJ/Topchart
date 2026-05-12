"use client"

import { DataTable } from "@/components/admin/DataTable"
import { User } from "lucide-react"

export default function UserProfilesPage() {
  return (
    <DataTable
      title="User Profiles"
      tableName="user_profiles"
      icon={<User className="h-5 w-5" />}
      columns={[
        { key: "userId", label: "User ID" },
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "language", label: "Language" },
        { key: "timezone", label: "Timezone" },
        { key: "preferences", label: "Preferences", type: "json" },
        { key: "createdAt", label: "Created", type: "date" },
      ]}
      searchableColumns={["userId", "firstName", "lastName"]}
      defaultOrderBy="createdAt"
    />
  )
}
