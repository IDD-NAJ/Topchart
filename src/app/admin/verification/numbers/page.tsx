"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/networks"
import { Loader2, ArrowLeft, Phone, Search, RefreshCw } from "lucide-react"

interface VerificationNumber {
  id: string
  number: string
  type: "STR" | "LTR"
  status: "active" | "completed" | "expired" | "cancelled"
  purchase_price: number
  ltr_duration_days: number | null
  pvadeals_request_id: string | null
  allow_flag: boolean
  auto_renew: boolean
  expires_at: string
  completed_at: string
  created_at: string
  user_email: string
  user_first_name: string
  user_last_name: string
  service_name: string
  service_category: string
  sms_count: number
}

export default function AdminVerificationNumbersPage() {
  const [loading, setLoading] = useState(true)
  const [numbers, setNumbers] = useState<VerificationNumber[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 })

  useEffect(() => {
    fetchNumbers()
  }, [filterStatus, pagination.offset])

  const fetchNumbers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      params.append("limit", pagination.limit.toString())
      params.append("offset", pagination.offset.toString())

      const response = await fetch(`/api/admin/verification/numbers?${params}`)
      const data = await response.json()

      if (data.success) {
        setNumbers(data.data.numbers)
        setPagination(prev => ({ ...prev, total: data.data.pagination.total }))
      }
    } catch (err) {
      console.error("Failed to fetch numbers:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredNumbers = numbers.filter(
    (n) =>
      n.number.includes(searchQuery) ||
      n.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.service_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "secondary",
      expired: "outline",
      cancelled: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/verification">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Foreign Numbers</h1>
            <p className="text-muted-foreground mt-1">
              Manage all purchased and rented numbers
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchNumbers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number, email, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Numbers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Number</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Service</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Expires</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">SMS</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredNumbers.map((num) => (
                    <tr key={num.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-sm">{num.number}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{num.service_name}</p>
                          <p className="text-xs text-muted-foreground">{num.service_category}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{num.user_first_name} {num.user_last_name}</p>
                          <p className="text-xs text-muted-foreground">{num.user_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={num.type === "LTR" ? "default" : "secondary"}>
                          {num.type === "LTR" ? `LTR ${num.ltr_duration_days ?? ""}d` : "STR"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(num.status)}</td>
                      <td className="px-4 py-3">{formatCurrency(num.purchase_price)}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(num.expires_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(num.expires_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{num.sms_count}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {num.allow_flag && <Badge variant="outline" className="text-xs">Flag</Badge>}
                          {num.auto_renew && <Badge variant="outline" className="text-xs text-green-600 border-green-200">Auto</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredNumbers.length === 0 && (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No numbers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredNumbers.length} of {pagination.total} numbers
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pagination.offset === 0}
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                offset: Math.max(0, prev.offset - prev.limit),
              }))
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={pagination.offset + pagination.limit >= pagination.total}
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                offset: prev.offset + prev.limit,
              }))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
