export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Globe2, Server, Smartphone, Wifi, RefreshCw, Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ConnectionStatus = "connected" | "disconnected" | "not_configured" | "loading"

interface AccountInfo {
  id: number
  email: string
  username: string
  email_verified: boolean
  _2fa_enabled: boolean
  wallet_balance: number
}

interface IPBalanceItem {
  plan_id: number
  amount: number
}

interface TrafficBalanceItem {
  id: number
  amount: number
  active_at: number
  expires_in: number
  expires_at: number
  status: number
  plan_name: string
  original_amount: string
  receive_method: number
  traffic_type: number
  created_at: number
  updated_at: number
}

interface BalanceData {
  ip_data: IPBalanceItem[]
  traffic_data: TrafficBalanceItem[]
}

interface ProxyConnection {
  id: number
  user_id: number
  server_id: number
  proxy_type: number
  country_code: string | null
  city_code: string | null
  state_code: string | null
  isp_code: string | null
  start_port: number
  end_port: number
  is_keep: number
  is_random_ip: number
  session_time: string
  created_at: number
  updated_at: number
}

const PROXY_TYPE_MAP: Record<number, { label: string; icon: React.ElementType; color: string }> = {
  1: { label: "Residential", icon: Globe2, color: "text-blue-600 bg-blue-50" },
  2: { label: "Mobile", icon: Smartphone, color: "text-green-600 bg-green-50" },
  3: { label: "Datacenter", icon: Server, color: "text-purple-600 bg-purple-50" },
}

export default function NineProxySettingsPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("loading")
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [connections, setConnections] = useState<ProxyConnection[]>([])
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [deletingPorts, setDeletingPorts] = useState<Set<number>>(new Set())

  const fetchBalance = useCallback(async (refresh = false) => {
    try {
      setLoadingBalance(true)
      const response = await fetch(`/api/admin/9proxy-balance${refresh ? "?refresh=true" : ""}`)
      const result = await response.json()

      if (result.success) {
        setAccount(result.data.account)
        setBalance(result.data.balance)
        setConnectionStatus("connected")
        if (refresh) toast.success("Balance refreshed successfully")
      } else {
        if (result.state === "not_configured") {
          setAccount(null)
          setBalance(null)
          setConnectionStatus("not_configured")
        } else {
          setAccount(null)
          setBalance(null)
          setConnectionStatus("disconnected")
          toast.error(result.error || "Failed to fetch 9Proxy balance")
        }
      }
    } catch {
      setAccount(null)
      setBalance(null)
      setConnectionStatus("disconnected")
      toast.error("Failed to fetch 9Proxy balance")
    } finally {
      setLoadingBalance(false)
    }
  }, [])

  const fetchConnections = useCallback(async () => {
    try {
      setLoadingConnections(true)
      const response = await fetch("/api/admin/9proxy-connections")
      const result = await response.json()

      if (result.success) {
        setConnections(result.data.items || [])
      } else {
        if (result.state !== "not_configured") {
          toast.error(result.error || "Failed to fetch connections")
        }
      }
    } catch {
      toast.error("Failed to fetch connections")
    } finally {
      setLoadingConnections(false)
    }
  }, [])

  const handleDeleteConnection = async (startPort: number) => {
    setDeletingPorts((prev) => new Set(prev).add(startPort))
    try {
      const response = await fetch("/api/admin/9proxy-connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPorts: [startPort] }),
      })
      const result = await response.json()

      if (result.success) {
        setConnections((prev) => prev.filter((c) => c.start_port !== startPort))
        toast.success("Connection deleted")
      } else {
        toast.error(result.error || "Failed to delete connection")
      }
    } catch {
      toast.error("Failed to delete connection")
    } finally {
      setDeletingPorts((prev) => {
        const next = new Set(prev)
        next.delete(startPort)
        return next
      })
    }
  }

  useEffect(() => {
    fetchBalance()
    fetchConnections()
  }, [fetchBalance, fetchConnections])

  const statusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return <Badge className="bg-green-100 text-green-700">Connected</Badge>
      case "not_configured":
        return <Badge variant="secondary">Not Configured</Badge>
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>
      case "loading":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Loading</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">9Proxy Settings</h1>
          <p className="text-muted-foreground">Manage your 9Proxy integration and proxy connections</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchBalance(true); fetchConnections() }}
            disabled={connectionStatus === "not_configured" || loadingBalance}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loadingBalance && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {connectionStatus === "not_configured" && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-amber-900">9Proxy Not Configured</p>
                <p className="text-sm text-amber-700">Add the following environment variables to connect your 9Proxy account:</p>
                <div className="bg-white/80 rounded-lg p-3 font-mono text-sm space-y-1">
                  <p>NINEPROXY_API_KEY=your-api-key</p>
                  <p>NINEPROXY_BASE_URL=https://api.9proxy.com</p>
                  <p>NINEPROXY_SANDBOX=false</p>
                </div>
                <p className="text-xs text-amber-600">Get your API key from <a href="https://9proxy.com/dashboard/my-account?tab=api-key" target="_blank" rel="noopener noreferrer" className="underline">9Proxy Dashboard</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {connectionStatus === "connected" && account && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">{account.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{account.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2FA</span>
                <span className="font-medium">{account._2fa_enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Balance</span>
                <span className="font-semibold">${account.wallet_balance}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">IP & Traffic Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {balance?.ip_data && balance.ip_data.length > 0 ? (
                balance.ip_data.map((item) => (
                  <div key={item.plan_id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan {item.plan_id}</span>
                    <Badge variant="secondary">{item.amount} IPs</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No IP plans</p>
              )}
              {balance?.traffic_data && balance.traffic_data.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  {balance.traffic_data.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.plan_name}</span>
                      <Badge variant="secondary">{Number(item.original_amount) / 1e9} GB</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Active Connections</CardTitle>
              <CardDescription>Proxy configurations currently provisioned</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConnections} disabled={loadingConnections}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loadingConnections && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active connections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => {
                const typeInfo = PROXY_TYPE_MAP[conn.proxy_type] || { label: "Unknown", icon: Shield, color: "text-gray-600 bg-gray-50" }
                const Icon = typeInfo.icon
                return (
                  <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded flex items-center justify-center", typeInfo.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{typeInfo.label} — {conn.country_code || "Any"}</p>
                        <p className="text-xs text-muted-foreground">Ports {conn.start_port}–{conn.end_port} · Session: {conn.session_time}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingPorts.has(conn.start_port)}
                      onClick={() => handleDeleteConnection(conn.start_port)}
                    >
                      {deletingPorts.has(conn.start_port) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

