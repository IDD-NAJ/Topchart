"use client"

import React from "react"
import { useEffect, useState } from "react"
import { getAbsoluteUrl } from "@/lib/app-url"
import { getAppOrigin } from "@/lib/app-url"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  LogOut, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  ChevronDown,
  MoreHorizontal
} from "lucide-react"

interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  wallet_balance: number
  is_verified: boolean
  created_at: string
  role?: string
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalRevenue: number
  recentSignups: number
}

export default function AdminUserTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editMode, setEditMode] = useState<"view" | "edit">("edit")
  const [editForm, setEditForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    wallet_balance: "",
    is_verified: false,
    role: "USER",
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const router = useRouter()

  const loadUsers = async (query = "") => {
    try {getAbsoluteUrl()geAppO()
      const url = new URL("/api/admin/users", window.location.origin)
      if (query.trim()) url.searchParams.set("q", query.trim())
      const response = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-store",
      })
      const result = await response.json()
      if (result.success) {
        const usersArray = Array.isArray(result.users) ? result.users : []
        setUsers(usersArray)
      } else if (response.status === 401 || response.status === 403) {
        router.replace("/admin/login")
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }

  const openUserDialog = (user: AdminUser, mode: "view" | "edit") => {
    setEditMode(mode)
    setEditError(null)
    setEditingUser(user)
    setEditForm({
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      wallet_balance: String(user.wallet_balance ?? ""),
      is_verified: Boolean(user.is_verified),
      role: String(user.role || "USER").toUpperCase(),
    })
  }

  const closeUserDialog = () => {
    setEditingUser(null)
    setEditError(null)
  }

  const saveUserEdits = async () => {
    if (!editingUser) return
    setSavingEdit(true)
    setEditError(null)
    try {
      const payload = {
        email: editForm.email.trim(),
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        wallet_balance: Number(editForm.wallet_balance || 0),
        is_verified: editForm.is_verified,
        role: editForm.role,
      }
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        await loadUsers(searchTerm)
        setEditingUser(null)
      } else if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login")
      } else {
        setEditError(data.error || "Failed to update user")
      }
    } catch {
      setEditError("Network error")
    } finally {
      setSavingEdit(false)
    }
  }

  const deleteUser = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeletingUserId(deleteTarget.id)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        await loadUsers(searchTerm)
        setDeleteTarget(null)
      } else if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login")
      } else {
        setDeleteError(data.error || "Failed to delete user")
      }
    } catch {
      setDeleteError("Network error")
    } finally {
      setDeletingUserId(null)
    }
  }

  useEffect(() => {
    setLoading(true)
    const handle = setTimeout(() => {
      loadUsers(searchTerm)
    }, 300)
    return () => clearTimeout(handle)
  }, [searchTerm])

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 text-muted-foreground" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Balance</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{user.phone}</td>
                  <td className="p-3">GH₵{Number(user.wallet_balance || 0).toFixed(2)}</td>
                  <td className="p-3">
                    <Badge variant={user.is_verified ? "default" : "secondary"}>
                      {user.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openUserDialog(user, "view")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openUserDialog(user, "edit")}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(user)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => (!open ? closeUserDialog() : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMode === "view" ? "User details" : "Edit user"}</DialogTitle>
            <DialogDescription>
              {editMode === "view"
                ? "View user profile information."
                : "Update user details and save changes."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-first-name">First name</Label>
              <Input
                id="admin-first-name"
                value={editForm.first_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-last-name">Last name</Label>
              <Input
                id="admin-last-name"
                value={editForm.last_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-phone">Phone</Label>
              <Input
                id="admin-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-balance">Wallet balance (GHS)</Label>
              <Input
                id="admin-balance"
                type="number"
                inputMode="decimal"
                value={editForm.wallet_balance}
                onChange={(e) => setEditForm((prev) => ({ ...prev, wallet_balance: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-role">Role</Label>
              <select
                id="admin-role"
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                disabled={editMode === "view"}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="admin-verified"
                checked={editForm.is_verified}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, is_verified: checked === true }))
                }
                disabled={editMode === "view"}
              />
              <Label htmlFor="admin-verified">Verified</Label>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUserDialog}>
              Close
            </Button>
            {editMode === "edit" && (
              <Button onClick={saveUserEdits} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user account and related sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} disabled={deletingUserId === deleteTarget?.id}>
              {deletingUserId === deleteTarget?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
