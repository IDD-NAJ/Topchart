"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/networks"
import { toast } from "sonner"
import { 
  Loader2, 
  Gift, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  XCircle,
  Clock,
  Copy,
  ExternalLink
} from "lucide-react"

interface AnalyticsData {
  summary: {
    totalOrders: number
    totalAmountGHS: number
    totalCostUSD: number
    totalCommission: number
    successfulOrders: number
    failedOrders: number
    successRate: string
  }
  salesByBrand: Array<{
    brand: string
    orders: number
    totalAmountGHS: number
  }>
  salesByCountry: Array<{
    countryCode: string
    countryName: string
    orders: number
    totalAmountGHS: number
  }>
  salesByStatus: Array<{
    status: string
    orders: number
    totalAmountGHS: number
  }>
  dailySales: Array<{
    date: string
    orders: number
    totalAmountGHS: number
  }>
  resellerSales: Array<{
    businessName: string
    orders: number
    totalAmountGHS: number
    totalCommission: number
  }>
  period: string
}

interface Order {
  id: string
  user: {
    id: string
    email: string
    phone: string
    firstName: string
    lastName: string
  }
  reseller: {
    id: string
    businessName: string
  } | null
  product: {
    id: string
    name: string
    brand: string
  }
  country: string
  denomination: number
  currency: string
  recipient: {
    email: string
    phone: string
    name: string
  }
  isGift: boolean
  senderMessage: string
  giftCardCode: string
  pinCode: string
  expiryDate: string
  status: string
  amountGHS: number
  reloadlyCostUSD: number
  markupPercentage: number
  commissionAmount: number
  commissionRate: number
  paymentMethod: string
  paymentReference: string
  errorMessage: string
  createdAt: string
  updatedAt: string
}

interface BalanceData {
  balanceUSD: number
  currencyCode: string
}

export default function AdminGiftcardsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [syncingBalance, setSyncingBalance] = useState(false)

  useEffect(() => {
    loadAnalytics()
    loadOrders()
    loadBalance()
  }, [selectedPeriod, statusFilter])

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/giftcards/analytics?period=${selectedPeriod}`)
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.data)
      } else {
        toast.error(data.error || "Failed to load analytics")
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const url = statusFilter 
        ? `/api/admin/giftcards/orders?status=${statusFilter}`
        : `/api/admin/giftcards/orders`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setOrders(data.data.orders)
      } else {
        toast.error(data.error || "Failed to load orders")
      }
    } catch (error) {
      console.error("Error loading orders:", error)
      toast.error("Failed to load orders")
    }
  }

  const loadBalance = async () => {
    try {
      const res = await fetch("/api/admin/giftcards/balance")
      const data = await res.json()
      if (data.success) {
        setBalance(data.data)
      }
    } catch (error) {
      console.error("Error loading balance:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Gift Cards Management</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Manage gift card orders and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSyncingBalance(true)
              loadBalance().finally(() => setSyncingBalance(false))
            }}
            disabled={syncingBalance}
          >
            {syncingBalance ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reloadly Balance
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {balance && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Reloadly Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[#006994]">
                      ${balance.balanceUSD.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">Available USD balance</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">{analytics.summary.totalOrders}</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">
                      GHS {formatCurrency(analytics.summary.totalAmountGHS)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-600">Commission Paid</CardTitle>
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">
                      GHS {formatCurrency(analytics.summary.totalCommission)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">{analytics.summary.successRate}%</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Top Brands</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.salesByBrand.slice(0, 5).map((brand, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{brand.brand}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{brand.orders}</Badge>
                            <span className="text-sm font-medium">
                              GHS {formatCurrency(brand.totalAmountGHS)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Top Resellers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.resellerSales.slice(0, 5).map((reseller, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{reseller.businessName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{reseller.orders}</Badge>
                            <span className="text-sm font-medium">
                              GHS {formatCurrency(reseller.totalCommission)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sales by Status</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedPeriod === "7d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPeriod("7d")}
                      >
                        7d
                      </Button>
                      <Button
                        variant={selectedPeriod === "30d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPeriod("30d")}
                      >
                        30d
                      </Button>
                      <Button
                        variant={selectedPeriod === "90d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPeriod("90d")}
                      >
                        90d
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.salesByStatus.map((status, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            status.status === 'success' ? 'bg-green-100' :
                            status.status === 'pending' ? 'bg-yellow-100' :
                            status.status === 'failed' ? 'bg-red-100' :
                            'bg-slate-100'
                          }`}>
                            {status.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                             status.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-600" /> :
                             status.status === 'failed' ? <XCircle className="h-4 w-4 text-red-600" /> :
                             <ShoppingCart className="h-4 w-4 text-slate-600" />}
                          </div>
                          <span className="font-medium text-slate-900 capitalize">{status.status}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{status.orders} orders</Badge>
                          <span className="font-semibold">
                            GHS {formatCurrency(status.totalAmountGHS)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <CardTitle>All Orders</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "success" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("success")}
                  >
                    Success
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === "failed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("failed")}
                  >
                    Failed
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        order.status === 'success' ? 'bg-green-100' :
                        order.status === 'pending' ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        {order.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                         order.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-600" /> :
                         <XCircle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{order.product.name}</p>
                        <p className="text-sm text-slate-500">{order.product.brand}</p>
                        <p className="text-xs text-slate-400">
                          {order.user.email} • {new Date(order.createdAt).toLocaleString()}
                        </p>
                        {order.reseller && (
                          <p className="text-xs text-slate-500 mt-1">
                            Reseller: {order.reseller.businessName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <span className="font-semibold text-[#006994]">
                        GHS {formatCurrency(order.amountGHS)}
                      </span>
                      <Badge variant={
                        order.status === 'success' ? 'default' :
                        order.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {order.status}
                      </Badge>
                      {order.status === 'success' && order.giftCardCode && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.giftCardCode)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Code
                          </Button>
                          {order.pinCode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(order.pinCode)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              PIN
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
