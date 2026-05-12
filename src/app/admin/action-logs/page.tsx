"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { ClipboardList, Activity, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  first_name?: string
  last_name?: string
  email?: string
}

export default function ActionLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadAuditLogs()
  }, [page])

  const loadAuditLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=50`)
      const data = await res.json()
      if (data.success) {
        setAuditLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch {
      toast.error("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DataTable
        title="Admin Action Logs"
        tableName="admin_action_logs"
        icon={<ClipboardList className="h-5 w-5" />}
        columns={[
          { key: "id", label: "ID" },
          { key: "adminUserId", label: "Admin User ID" },
          { key: "action", label: "Action" },
          { key: "targetType", label: "Target Type" },
          { key: "targetId", label: "Target ID" },
          { key: "metadata", label: "Metadata", type: "json" },
          { key: "createdAt", label: "Created", type: "date" },
        ]}
        searchableColumns={["adminUserId", "action", "targetType"]}
        defaultOrderBy="createdAt"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No audit logs yet</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono">{log.action}</Badge>
                      {log.resource_type && <Badge variant="secondary" className="text-[10px]">{log.resource_type}</Badge>}
                    </div>
                    {log.email && <p className="text-xs text-muted-foreground">By: {log.email}</p>}
                    {log.details && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 line-clamp-2">
                        {JSON.stringify(log.details).substring(0, 200)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.ip_address && <p className="text-[10px] text-muted-foreground">{log.ip_address}</p>}
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                  <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
