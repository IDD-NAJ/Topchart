"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, RefreshCw, Search, MessageSquare, Inbox } from "lucide-react"
import { toast } from "sonner"

interface SmsRow {
  id: string
  from_number: string
  message: string
  received_at: string
  is_read: boolean
  phone_number: string
  service_name: string
  user_email: string
}

export default function AdminSmsLogPage() {
  const [smsRows, setSmsRows] = useState<SmsRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 25

  const load = async (p = page) => {
    setLoading(true)
    try {
      const offset = (p - 1) * pageSize
      const res = await fetch(`/api/admin/verification/sms?limit=${pageSize}&offset=${offset}`, {
        credentials: "include",
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) {
        setSmsRows(data.data.sms || [])
        setTotal(data.data.pagination?.total || 0)
      } else {
        toast.error(data.error || "Failed to load SMS log")
      }
    } catch {
      toast.error("Network error loading SMS log")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
  }, [page])

  const filtered = smsRows.filter(
    (r) =>
      !search ||
      r.message?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone_number?.includes(search) ||
      r.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.service_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/verification">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Verification
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[color:var(--marketing-accent)]" />
            <h2 className="text-xl font-semibold">SMS Log</h2>
            <Badge variant="secondary">{total}</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => load(page)} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Received Messages</CardTitle>
          <CardDescription>All SMS received across verification numbers</CardDescription>
          <div className="relative w-full md:w-[360px] mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message, number, email, service..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Inbox className="h-8 w-8" />
                        <p className="text-sm">No SMS messages found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.phone_number}</TableCell>
                      <TableCell className="font-mono text-xs">{row.from_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{row.service_name}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.user_email}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm">{row.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.received_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.is_read ? "secondary" : "default"} className="text-xs">
                          {row.is_read ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
