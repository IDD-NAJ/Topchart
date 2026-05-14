"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, UserPlus, Shield, Search, Filter } from "lucide-react"
import { toast } from "sonner"

interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  wallet_balance: number
  is_verified: boolean
  role: string
  created_at: string
  updated_at: string
}

export function AdminManagementPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "USER"
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const loadUsers = async (page = 1, search = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search })
      })
      
      const res = await fetch(`/api/admin/admin-management?${params}`, {
        credentials: "include"
      })
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        toast.error("Failed to load users")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    loadUsers(1, value)
  }

  const handlePromote = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/admin-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "promoteToAdmin",
          userId,
          role: "ADMIN"
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success("User promoted to admin successfully")
        loadUsers(pagination.page, searchTerm)
      } else {
        toast.error(data.error || "Failed to promote user")
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  const handleDemote = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/admin-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "demoteToUser",
          userId
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success("User demoted to user role")
        loadUsers(pagination.page, searchTerm)
      } else {
        toast.error(data.error || "Failed to demote user")
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.first_name || !createForm.last_name) {
      toast.error("Please fill in all required fields")
      return
    }

    setCreateLoading(true)
    try {
      const res = await fetch("/api/admin/admin-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "createAdmin",
          email: createForm.email.toLowerCase(),
          firstName: createForm.first_name,
          lastName: createForm.last_name,
          phone: createForm.phone
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success("Admin user created successfully")
        setShowCreateDialog(false)
        setCreateForm({ email: "", first_name: "", last_name: "", phone: "", role: "USER" })
        loadUsers(pagination.page, searchTerm)
      } else {
        toast.error(data.error || "Failed to create admin user")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setCreateLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    loadUsers(newPage, searchTerm)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">User Management</h2>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin Only
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin User</DialogTitle>
                <DialogDescription>
                  Create a new user with administrator privileges. This action will be logged.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0241234567"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateAdmin} 
                disabled={createLoading}
                className="w-full"
              >
                {createLoading ? "Creating..." : "Create Admin User"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
          <CardDescription>
            Manage user roles and permissions. All actions are logged for security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[600px] sm:min-w-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Verified</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(user.created_at || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{user.email}</td>
                      <td className="p-3 text-sm">{user.phone || "N/A"}</td>
                      <td className="p-3">
                        <Badge 
                          variant={user.role === "ADMIN" ? "default" : "secondary"}
                          className={user.role === "ADMIN" ? "bg-red-100 text-red-800" : ""}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.is_verified ? "default" : "secondary"}>
                          {user.is_verified ? "Verified" : "Not Verified"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {user.role === "USER" ? (
                            <Button
                              size="sm"
                              onClick={() => handlePromote(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Promote to Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDemote(user.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Demote to User
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
