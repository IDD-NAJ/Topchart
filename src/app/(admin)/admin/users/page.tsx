"use client"

import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, exportToCsv, formatCurrency, formatDate } from "@/lib/admin-fetcher"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Pencil, Trash2, RefreshCw } from "lucide-react"

interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  wallet_balance: number
  is_verified: boolean
  created_at: string
  role: string
}

interface UsersResponse {
  success: boolean
  users: AdminUser[]
  total: number
}

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [verifiedFilter, setVerifiedFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    adminFetcher
  )

  const filtered = useMemo(() => {
    let users = data?.users || []
    if (roleFilter !== "all") users = users.filter((u) => u.role.toUpperCase() === roleFilter)
    if (verifiedFilter !== "all") users = users.filter((u) => u.is_verified === (verifiedFilter === "verified"))
    return users
  }, [data, roleFilter, verifiedFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  const handleExport = () => {
    if (!filtered.length) {
      toast.info("No users to export")
      return
    }
    exportToCsv(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
        role: u.role,
        verified: u.is_verified,
        wallet_balance: u.wallet_balance,
        created_at: u.created_at,
      }))
    )
    toast.success(`Exported ${filtered.length} users`)
  }

  const handleSave = async (form: FormData) => {
    if (!editUser) return
    setSaving(true)
    try {
      await adminMutate(`/api/admin/users/${editUser.id}`, "PATCH", {
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        wallet_balance: Number(form.get("wallet_balance") || 0),
        role: String(form.get("role") || "USER"),
        is_verified: form.get("is_verified") === "on",
      })
      toast.success("User updated")
      setEditUser(null)
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      await adminMutate(`/api/admin/users/${deleteUser.id}`, "DELETE")
      toast.success("User deleted")
      setDeleteUser(null)
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user")
    }
  }

  const toggleVerified = async (user: AdminUser) => {
    try {
      await adminMutate(`/api/admin/users/${user.id}`, "PATCH", { is_verified: !user.is_verified })
      toast.success(user.is_verified ? "User unverified" : "User verified")
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to update verification")
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${filtered.length} of ${data.total} users` : "Loading users..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, name or phone..."
              className="pl-9"
              aria-label="Search users"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32" aria-label="Filter by role">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Filter by verification">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">Failed to load users: {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && pageUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      {!isLoading && pageUsers.length > 0 && (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {`${user.first_name} ${user.last_name}`.trim() || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.is_verified}
                        onCheckedChange={() => toggleVerified(user)}
                        aria-label={`Toggle verification for ${user.email}`}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(user.wallet_balance)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditUser(user)} aria-label={`Edit ${user.email}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUser(user)}
                          aria-label={`Delete ${user.email}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {pageUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {`${user.first_name} ${user.last_name}`.trim() || "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
                    </div>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_verified}
                        onCheckedChange={() => toggleVerified(user)}
                        aria-label={`Toggle verification for ${user.email}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {user.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(user.wallet_balance)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="min-h-11 flex-1" onClick={() => setEditUser(user)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 flex-1 text-destructive"
                      onClick={() => setDeleteUser(user)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          {editUser && (
            <form action={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" name="first_name" defaultValue={editUser.first_name} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" name="last_name" defaultValue={editUser.last_name} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editUser.email} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={editUser.phone} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wallet_balance">Wallet balance (GHS)</Label>
                  <Input
                    id="wallet_balance"
                    name="wallet_balance"
                    type="number"
                    step="0.01"
                    defaultValue={editUser.wallet_balance}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={editUser.role}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="is_verified" name="is_verified" defaultChecked={editUser.is_verified} />
                <Label htmlFor="is_verified">Verified account</Label>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteUser?.email} along with their transactions, wallet and sessions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
