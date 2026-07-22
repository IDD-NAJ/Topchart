"use client"

import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, exportToCsv, formatCurrency, formatDate } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Users, Search, Download, Pencil, Trash2, RefreshCw, ShieldCheck, Wallet } from "lucide-react"

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
  const [query, setQuery]   = useState("")
  const [roleFilter, setRoleFilter]         = useState("all")
  const [verifiedFilter, setVerifiedFilter] = useState("all")
  const [page, setPage]     = useState(1)
  const [editUser, setEditUser]     = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    wallet_balance: "0", role: "USER", is_verified: false,
  })

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    adminFetcher
  )

  const filtered = useMemo(() => {
    let users = data?.users || []
    if (roleFilter !== "all") users = users.filter((u) => u.role?.toUpperCase() === roleFilter)
    if (verifiedFilter !== "all") users = users.filter((u) => u.is_verified === (verifiedFilter === "verified"))
    return users
  }, [data, roleFilter, verifiedFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageUsers  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalWallet = filtered.reduce((s, u) => s + Number(u.wallet_balance ?? 0), 0)
  const verifiedCount = filtered.filter((u) => u.is_verified).length

  function openEdit(u: AdminUser) {
    setEditForm({
      first_name:     u.first_name,
      last_name:      u.last_name,
      email:          u.email,
      phone:          u.phone,
      wallet_balance: String(u.wallet_balance ?? 0),
      role:           u.role?.toUpperCase() ?? "USER",
      is_verified:    u.is_verified,
    })
    setEditUser(u)
  }

  async function handleSave() {
    if (!editUser) return
    setSaving(true)
    try {
      await adminMutate(`/api/admin/users/${editUser.id}`, "PATCH", {
        first_name:     editForm.first_name,
        last_name:      editForm.last_name,
        email:          editForm.email,
        phone:          editForm.phone,
        wallet_balance: Number(editForm.wallet_balance),
        role:           editForm.role,
        is_verified:    editForm.is_verified,
      })
      toast.success("User updated")
      setEditUser(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteUser) return
    setDeleting(true)
    try {
      await adminMutate(`/api/admin/users/${deleteUser.id}`, "DELETE")
      toast.success("User deleted")
      setDeleteUser(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  async function toggleVerified(u: AdminUser) {
    try {
      await adminMutate(`/api/admin/users/${u.id}`, "PATCH", { is_verified: !u.is_verified })
      toast.success(u.is_verified ? "User unverified" : "User verified")
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to update")
    }
  }

  return (
    <AdminPageShell
      title="Users"
      description="Manage all registered accounts"
      icon={Users}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => {
              if (!filtered.length) { toast.info("No users to export"); return }
              exportToCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`,
                filtered.map((u) => ({ id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, phone: u.phone, role: u.role, verified: u.is_verified, wallet: u.wallet_balance, created: u.created_at })))
              toast.success(`Exported ${filtered.length} users`)
            }}
          >
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Users"    value={isLoading ? <Skeleton className="h-8 w-16" /> : (data?.total ?? 0).toLocaleString()} icon={Users} />
        <StatCard label="Verified"       value={isLoading ? <Skeleton className="h-8 w-16" /> : verifiedCount.toLocaleString()}       icon={ShieldCheck} accent />
        <StatCard label="Showing"        value={isLoading ? <Skeleton className="h-8 w-16" /> : filtered.length.toLocaleString()}     icon={Users} />
        <StatCard label="Total Wallets"  value={isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totalWallet)}          icon={Wallet} accent />
      </div>

      {/* Table */}
      <AdminTableShell>
        <AdminTableHeader>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email or name..."
                  className="pl-8 h-9 w-60"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="h-9">Search</Button>
            </form>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-32"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="RESELLER">Reseller</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All verified" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            Page {page} / {totalPages}
          </p>
        </AdminTableHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive py-10">
                    {(error as any).message || "Failed to load users"}
                  </TableCell>
                </TableRow>
              ) : pageUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState icon={Users} title="No users found" description="Try a different search or filter" />
                  </TableCell>
                </TableRow>
              ) : (
                pageUsers.map((u) => (
                  <TableRow key={u.id} className="group">
                    <TableCell className="font-medium">
                      {u.first_name} {u.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant={u.role?.toUpperCase() === "ADMIN" ? "default" : "outline"} className="text-xs capitalize">
                        {u.role?.toLowerCase() ?? "user"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{formatCurrency(Number(u.wallet_balance ?? 0))}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!u.is_verified}
                        onCheckedChange={() => toggleVerified(u)}
                        className="scale-75"
                        aria-label="Toggle verified"
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </AdminTableShell>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => { if (!v) setEditUser(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={editForm.first_name} onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={editForm.last_name} onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Wallet Balance (GHS)</Label>
              <Input type="number" step="0.01" value={editForm.wallet_balance} onChange={(e) => setEditForm((f) => ({ ...f, wallet_balance: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="RESELLER">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.is_verified} onCheckedChange={(v) => setEditForm((f) => ({ ...f, is_verified: v }))} id="edit_verified" />
              <Label htmlFor="edit_verified">Verified</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={(v) => { if (!v) setDeleteUser(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteUser?.email}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  )
}
