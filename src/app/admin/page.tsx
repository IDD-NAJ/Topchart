"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  Edit,
  Trash2,
  Search,
  BarChart3,
  MessageSquare,
  Shield,
  Gift,
  Phone,
  Wifi,
  Wallet,
  AlertCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
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
  role: string
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalRevenue: number
  recentSignups: number
  openTickets: number
  pendingKyc: number
  totalReferrals: number
  totalAirtimePurchases: number
  totalDataPurchases: number
  totalWalletBalance: number
  openDisputes: number
  recentTransactions: any[]
  recentTickets: any[]
  transactionsByType: any[]
  transactionsByDay: any[]
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([])
  const [confirmingRef, setConfirmingRef] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)
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
  const [usersError, setUsersError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [purchasesError, setPurchasesError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      await Promise.all([
        loadUsers(),
        loadStats(),
        loadPendingPurchases()
      ])
      setLoading(false)
    }
    loadAllData()

    // Auto-refresh pending purchases every 30 seconds
    const interval = setInterval(() => {
      loadPendingPurchases()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const updateUserRole = async (userId: string, role: string) => {
    setRoleError(null)
    setUpdatingRoleId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) {
        await loadUsers()
      } else {
        setRoleError(data.error || "Failed to update role")
      }
    } catch {
      setRoleError("Network error")
    } finally {
      setUpdatingRoleId(null)
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
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login")
        } else {
          const data = await res.json()
          setEditError(data.error || "Failed to update user")
        }
        return
      }
      
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
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login")
        } else {
          const data = await res.json()
          setDeleteError(data.error || "Failed to delete user")
        }
        return
      }
      
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

  const loadUsers = async (query = "") => {
    setUsersError(null)
    try {
      const url = new URL("/api/admin/users", window.location.origin)
      if (query.trim()) url.searchParams.set("q", query.trim())
      const response = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const usersArray = Array.isArray(result.users) ? result.users : []
          setUsers(usersArray)
        } else {
          setUsersError(result.error || "Failed to load users")
        }
      } else {
        setUsersError(`HTTP error: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsersError("Network error. Please try again.")
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      loadUsers(searchTerm)
    }, 300)
    return () => clearTimeout(handle)
  }, [searchTerm])

  const loadStats = async () => {
    setStatsError(null)
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStats(result.stats)
          setLastUpdated(new Date())
        } else {
          setStatsError(result.error || "Failed to load stats")
        }
      } else {
        setStatsError(`HTTP error: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      setStatsError("Network error. Please try again.")
    }
  }

  const loadPendingPurchases = async () => {
    setPurchasesError(null)
    try {
      const response = await fetch('/api/admin/purchases', {
        credentials: 'include',
        cache: 'no-store'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const purchasesArray = Array.isArray(result.purchases) ? result.purchases : []
          setPendingPurchases(purchasesArray)
        } else {
          setPurchasesError(result.error || "Failed to load purchases")
        }
      } else {
        setPurchasesError(`HTTP error: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to load pending purchases:', error)
      setPurchasesError("Network error. Please try again.")
    }
  }

  const confirmPendingPurchase = async (reference: string) => {
    try {
      setConfirmingRef(reference)
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        await loadPendingPurchases()
        await loadUsers()
        await loadStats()
      }
    } catch (error) {
      console.error('Failed to confirm purchase:', error)
    } finally {
      setConfirmingRef(null)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      open: "secondary",
      closed: "outline",
    }
    return variants[status?.toLowerCase()] || "secondary"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-6">
                <div className="h-4 w-20 bg-muted rounded animate-pulse mb-4" />
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(usersError || statsError || purchasesError) && (
            <div className="text-sm text-destructive mr-2">
              Some data failed to load
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setLoading(true)
              await Promise.all([loadUsers(), loadStats(), loadPendingPurchases()])
              setLoading(false)
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Summary */}
      {(usersError || statsError || purchasesError) && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-destructive text-base">
              <AlertCircle className="w-5 h-5 mr-2" />
              Data Loading Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {usersError && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Users: {usersError}</span>
                <Button size="sm" variant="outline" onClick={() => loadUsers(searchTerm)}>Retry</Button>
              </div>
            )}
            {statsError && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Stats: {statsError}</span>
                <Button size="sm" variant="outline" onClick={loadStats}>Retry</Button>
              </div>
            )}
            {purchasesError && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Purchases: {purchasesError}</span>
                <Button size="sm" variant="outline" onClick={loadPendingPurchases}>Retry</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Pending Purchases Alert */}
      {pendingPurchases.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Pending Airtime & Data Purchases ({pendingPurchases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPurchases.map((p) => (
                    <tr key={p.reference} className="border-b">
                      <td className="p-3 capitalize">{p.type}</td>
                      <td className="p-3">
                        <div className="font-medium">{p.user?.first_name} {p.user?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{p.user?.email}</div>
                      </td>
                      <td className="p-3">{p.phoneNumber || p.metadata?.phoneNumber || p.user?.phone}</td>
                      <td className="p-3">GH₵{Number(p.amount || 0).toFixed(2)}</td>
                      <td className="p-3">{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          onClick={() => confirmPendingPurchase(p.reference)}
                          disabled={confirmingRef === p.reference}
                        >
                          {confirmingRef === p.reference ? "..." : "Confirm"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">+{stats.recentSignups} this week</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/active-users">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-[#006994]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently logged in</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/transactions">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Transactions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/transactions?type=deposit&status=success">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-[#006994]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GH₵{stats.totalRevenue.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Total deposits</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/wallets">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-[#1A85B8]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GH₵{stats.totalWalletBalance.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">User balances</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/referrals">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Referrals</CardTitle>
                <Gift className="h-4 w-4 text-[#722F37]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">Total referrals</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Secondary Stats - Action Required */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/admin/tickets">
            <Card className={`cursor-pointer hover:shadow-md transition-shadow ${stats.openTickets > 0 ? 'border-amber-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Open Tickets</CardTitle>
                <MessageSquare className={`h-4 w-4 ${stats.openTickets > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openTickets}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/kyc-profiles">
            <Card className={`cursor-pointer hover:shadow-md transition-shadow ${stats.pendingKyc > 0 ? 'border-amber-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pending KYC</CardTitle>
                <Shield className={`h-4 w-4 ${stats.pendingKyc > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingKyc}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/disputes">
            <Card className={`cursor-pointer hover:shadow-md transition-shadow ${stats.openDisputes > 0 ? 'border-red-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Open Disputes</CardTitle>
                <AlertCircle className={`h-4 w-4 ${stats.openDisputes > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openDisputes}</div>
                <p className="text-xs text-muted-foreground">Requires action</p>
              </CardContent>
            </Card>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin/airtime-purchases">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-1 pt-3 px-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold">{stats.totalAirtimePurchases}</div>
                  <p className="text-[10px] text-muted-foreground">Airtime</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/data-purchases">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-1 pt-3 px-3">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold">{stats.totalDataPurchases}</div>
                  <p className="text-[10px] text-muted-foreground">Data</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Transaction Breakdown */}
      {stats && stats.transactionsByType && stats.transactionsByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4" />
              Transaction Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.transactionsByType.map((item: any) => (
                <div key={item.type} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    {item.type?.toLowerCase() === 'deposit' ? (
                      <ArrowDownRight className="w-4 h-4 text-[#3498db]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-[#e74c3c]" />
                    )}
                    <span className="text-sm font-medium capitalize">{item.type}</span>
                  </div>
                  <div className="text-xl font-bold">{item.count}</div>
                  <div className="text-sm text-muted-foreground">GH₵{Number(item.total || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        {stats && stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-4 h-4" />
                  Recent Transactions
                </CardTitle>
                <Link href="/admin/transactions">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-[#006994]/10' : 'bg-[#722F37]/10'}`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownRight className="w-4 h-4 text-[#006994]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-[#722F37]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{tx.first_name} {tx.last_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{tx.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">GH₵{Number(tx.amount || 0).toFixed(2)}</div>
                      <Badge variant={getStatusBadge(tx.status)} className="text-xs">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Tickets */}
        {stats && stats.recentTickets && stats.recentTickets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-4 h-4" />
                  Recent Tickets
                </CardTitle>
                <Link href="/admin/tickets">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentTickets.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-[#006994]/10">
                        <MessageSquare className="w-4 h-4 text-[#006994]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm truncate max-w-[180px]">{ticket.subject}</div>
                        <div className="text-xs text-muted-foreground">{ticket.first_name} {ticket.last_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadge(ticket.status)} className="text-xs">{ticket.status}</Badge>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">{ticket.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 7-Day Activity */}
      {stats && stats.transactionsByDay && stats.transactionsByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" />
              7-Day Transaction Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {stats.transactionsByDay.slice(0, 7).reverse().map((day: any, idx: number) => {
                const maxCount = Math.max(...stats.transactionsByDay.map((d: any) => d.count || 1));
                const height = ((day.count || 0) / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-medium">{day.count || 0}</div>
                    <div 
                      className="w-full bg-[#006994]/80 rounded-t transition-all" 
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Users
            </CardTitle>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[600px] sm:min-w-0">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Balance</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 10).map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-3">{user.phone}</td>
                    <td className="p-3">GH₵{user.wallet_balance.toFixed(2)}</td>
                    <td className="p-3">
                      <Badge variant={user.is_verified ? "default" : "secondary"}>
                        {user.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <select
                        value={user.role || "USER"}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        disabled={updatingRoleId === user.id}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openUserDialog(user, "view")}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openUserDialog(user, "edit")}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(user)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {filteredUsers.length > 10 && (
            <div className="mt-4 text-center">
              <Link href="/admin/users">
                <Button variant="outline">View All Users</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => (!open ? closeUserDialog() : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMode === "view" ? "User Details" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {editMode === "view" ? "View user profile information." : "Update user details and save changes."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-first-name">First Name</Label>
              <Input
                id="edit-first-name"
                value={editForm.first_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-last-name">Last Name</Label>
              <Input
                id="edit-last-name"
                value={editForm.last_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-balance">Wallet Balance (GHS)</Label>
              <Input
                id="edit-balance"
                type="number"
                inputMode="decimal"
                value={editForm.wallet_balance}
                onChange={(e) => setEditForm((prev) => ({ ...prev, wallet_balance: e.target.value }))}
                disabled={editMode === "view"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
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
                id="edit-verified"
                checked={editForm.is_verified}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, is_verified: checked === true }))}
                disabled={editMode === "view"}
              />
              <Label htmlFor="edit-verified">Verified</Label>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUserDialog}>Close</Button>
            {editMode === "edit" && (
              <Button onClick={saveUserEdits} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
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
    </div>
  )
}
