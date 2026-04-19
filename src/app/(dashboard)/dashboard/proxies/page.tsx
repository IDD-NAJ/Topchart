"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Globe2,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Zap,
  Smartphone,
  Wifi,
  Lock,
  Server,
  Copy,
  AlertCircle,
  Trash2,
  RefreshCw,
  CreditCard,
  Wallet,
  List,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type View = "create" | "connections"
type Step = "form" | "confirm" | "processing" | "success" | "failed"
type PaymentMethod = "wallet" | "paystack"

const PROXY_TYPES = [
  { id: 1, label: "Residential", icon: Globe2, description: "Real residential IPs — hardest to detect" },
  { id: 2, label: "Mobile", icon: Smartphone, description: "Mobile carrier IPs — ideal for social/mobile" },
  { id: 3, label: "Datacenter", icon: Server, description: "Fast datacenter IPs — best for high volume" },
]

const SESSION_TYPES = [
  { id: 1, label: "Rotation", description: "IP rotates on each request" },
  { id: 2, label: "Sticky", description: "IP stays fixed for a duration" },
]

const COUNTRY_OPTIONS = [
  { code: "GH", name: "Ghana" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AE", name: "UAE" },
  { code: "IN", name: "India" },
]

interface OrderResult {
  orderId: string
  connection: {
    id: number
    proxyType: number
    proxyTypeLabel: string
    countryCode: string | null
    startPort: number
    endPort: number
    sessionTime: string
  }
  credentials: { username: string; password: string } | null
  message: string
}

interface ActiveConnection {
  id: number
  proxy_type: number
  country_code: string | null
  start_port: number
  end_port: number
  session_time: string
  created_at: number
}

const PROXY_TYPE_MAP: Record<number, string> = { 1: "Residential", 2: "Mobile", 3: "Datacenter" }

export default function ProxiesPage() {
  const { user } = useAuth()
  const [view, setView] = useState<View>("create")
  const [step, setStep] = useState<Step>("form")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet")
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const [proxyType, setProxyType] = useState(1)
  const [countryCode, setCountryCode] = useState("GH")
  const [quantity, setQuantity] = useState("5")
  const [sessionType, setSessionType] = useState(1)
  const [sessionTime, setSessionTime] = useState("30")
  const [error, setError] = useState("")
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  const [connections, setConnections] = useState<ActiveConnection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string }[] | null>(null)
  const [loadingCredentials, setLoadingCredentials] = useState(false)

  const selectedProxyType = PROXY_TYPES.find((t) => t.id === proxyType)!
  const selectedSessionType = SESSION_TYPES.find((t) => t.id === sessionType)!
  const estimatedPrice = Number(quantity) * (proxyType === 1 ? 2 : proxyType === 2 ? 3 : 1)
  const canAfford = walletBalance >= estimatedPrice

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true)
        const res = await fetch("/api/wallet/balance", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.success) setWalletBalance(data.balance ?? 0)
        }
      } catch { /* ignore */ } finally {
        setLoadingBalance(false)
      }
    }
    if (user) fetchBalance()
  }, [user])

  const fetchConnections = useCallback(async () => {
    try {
      setLoadingConnections(true)
      const res = await fetch("/api/purchases/proxies/connections", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setConnections(data.connections ?? [])
      }
    } catch { /* ignore */ } finally {
      setLoadingConnections(false)
    }
  }, [])

  const fetchCredentials = useCallback(async () => {
    try {
      setLoadingCredentials(true)
      const res = await fetch("/api/purchases/proxies/credentials", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setCredentials(data.credentials ?? null)
      }
    } catch { /* ignore */ } finally {
      setLoadingCredentials(false)
    }
  }, [])

  useEffect(() => {
    if (user && view === "connections") {
      fetchConnections()
      fetchCredentials()
      const interval = setInterval(fetchConnections, 30000)
      return () => clearInterval(interval)
    }
  }, [user, view, fetchConnections, fetchCredentials])

  const handleOrder = async () => {
    if (paymentMethod === "wallet" && !canAfford) {
      toast.error("Insufficient wallet balance. Please top up or use Paystack.")
      return
    }

    setStep("processing")
    setError("")

    try {
      const res = await fetch("/api/purchases/proxies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proxyType,
          countryCode,
          quantity: Number(quantity),
          sessionType,
          sessionTime: sessionType === 2 ? Number(sessionTime) : undefined,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (paymentMethod === "paystack" && data.authorizationUrl) {
          window.location.href = data.authorizationUrl
          return
        }
        setOrderResult(data.data)
        setStep("success")
        toast.success("Proxy connection created!")
      } else if (data.state === "not_configured") {
        setStep("failed")
        setError("9Proxy is not configured. Please add your API key in .env.local.")
        toast.error("9Proxy not configured")
      } else {
        setStep("failed")
        setError(data.error || "Order failed. Please try again.")
        toast.error(data.error || "Order failed")
      }
    } catch {
      setStep("failed")
      setError("Network error. Please try again.")
      toast.error("Network error")
    }
  }

  const handleDeleteConnection = async (startPort: number) => {
    try {
      const res = await fetch("/api/purchases/proxies/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPort }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Proxy connection deleted")
        fetchConnections()
      } else {
        toast.error(data.error || "Failed to delete")
      }
    } catch {
      toast.error("Network error")
    }
  }

  const reset = () => {
    setStep("form")
    setError("")
    setOrderResult(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {step !== "form" && view === "create" && (
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proxies</h1>
          <p className="text-muted-foreground">Residential, mobile & datacenter proxies via 9Proxy</p>
        </div>
      </div>

      {step === "form" && (
        <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
          <button
            onClick={() => setView("create")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              view === "create"
                ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
            Create Proxy
          </button>
          <button
            onClick={() => setView("connections")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              view === "connections"
                ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            My Proxies
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "connections" && step === "form" && (
          <motion.div key="connections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Connections</h2>
              <Button variant="outline" size="sm" onClick={fetchConnections} disabled={loadingConnections}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loadingConnections && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {connections.length === 0 && !loadingConnections && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No active proxies</p>
                  <p className="text-sm">Create a proxy connection to get started</p>
                  <Button variant="outline" className="mt-4" onClick={() => setView("create")}>
                    <Plus className="h-4 w-4 mr-2" /> Create Proxy
                  </Button>
                </CardContent>
              </Card>
            )}

            {connections.map((conn) => (
              <Card key={conn.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{PROXY_TYPE_MAP[conn.proxy_type] || `Type ${conn.proxy_type}`}</Badge>
                        <Badge variant="outline">{conn.country_code || "Any"}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><span className="text-muted-foreground">Ports:</span> <span className="font-mono">{conn.start_port}–{conn.end_port}</span></div>
                        <div><span className="text-muted-foreground">Session:</span> {conn.session_time}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteConnection(conn.start_port)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {credentials && credentials.length > 0 && (
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    Authentication Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {credentials.map((cred, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs text-muted-foreground">Sub-user {i + 1}</p>
                      <div className="flex items-center gap-2 p-2 rounded bg-white border">
                        <code className="flex-1 text-sm font-mono">User: {cred.username}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(cred.username)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-white border">
                        <code className="flex-1 text-sm font-mono">Pass: {cred.password}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(cred.password)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {loadingCredentials && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading credentials...
              </div>
            )}
          </motion.div>
        )}

        {view === "create" && (step === "form" || step === "confirm") && (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <Card className="border-2 border-[color:var(--marketing-accent)]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[color:var(--marketing-accent)]" />
                  Configure Proxy
                </CardTitle>
                <CardDescription>Select proxy type, targeting, and session settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Proxy Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PROXY_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setProxyType(type.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all",
                            proxyType === type.id
                              ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/5"
                              : "border-muted hover:border-[color:var(--marketing-accent)]/30"
                          )}
                        >
                          <Icon className={cn("h-6 w-6", proxyType === type.id ? "text-[color:var(--marketing-accent)]" : "text-muted-foreground")} />
                          <span className="text-sm font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Ports</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground">Each port = 1 concurrent proxy session</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Session Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {SESSION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSessionType(type.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all",
                          sessionType === type.id
                            ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/5"
                            : "border-muted hover:border-[color:var(--marketing-accent)]/30"
                        )}
                      >
                        <span className="text-sm font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {sessionType === 2 && (
                  <div className="space-y-2">
                    <Label>Sticky Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      placeholder="30"
                    />
                    <p className="text-xs text-muted-foreground">How long the same IP is kept before rotating</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("wallet")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                        paymentMethod === "wallet"
                          ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/5"
                          : "border-muted hover:border-[color:var(--marketing-accent)]/30"
                      )}
                    >
                      <Wallet className="h-5 w-5 text-[color:var(--marketing-accent)]" />
                      <div>
                        <p className="text-sm font-medium">Wallet</p>
                        <p className="text-xs text-muted-foreground">Balance: ₵{loadingBalance ? "..." : walletBalance.toFixed(2)}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("paystack")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                        paymentMethod === "paystack"
                          ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/5"
                          : "border-muted hover:border-[color:var(--marketing-accent)]/30"
                      )}
                    >
                      <CreditCard className="h-5 w-5 text-[color:var(--marketing-accent)]" />
                      <div>
                        <p className="text-sm font-medium">Paystack</p>
                        <p className="text-xs text-muted-foreground">Card / Mobile Money</p>
                      </div>
                    </button>
                  </div>
                  {paymentMethod === "wallet" && !canAfford && estimatedPrice > 0 && (
                    <p className="text-xs text-red-500">Insufficient balance. Top up your wallet or use Paystack.</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <span className="font-medium">Estimated Cost</span>
                    <p className="text-xs text-muted-foreground">~₵{estimatedPrice} ({quantity} ports × ₵{proxyType === 1 ? 2 : proxyType === 2 ? 3 : 1}/port)</p>
                  </div>
                  <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{estimatedPrice}</span>
                </div>

                {step === "form" && (
                  <Button onClick={() => setStep("confirm")} className="w-full bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90">
                    Continue to Confirm
                  </Button>
                )}

                {step === "confirm" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proxy Type</span>
                        <span className="font-semibold">{selectedProxyType.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Country</span>
                        <span className="font-semibold">{COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.name || countryCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ports</span>
                        <span className="font-semibold">{quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session</span>
                        <span className="font-semibold">{selectedSessionType.label}{sessionType === 2 ? ` (${sessionTime} min)` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment</span>
                        <span className="font-semibold">{paymentMethod === "wallet" ? "Wallet" : "Paystack"}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Back</Button>
                      <Button
                        onClick={handleOrder}
                        disabled={paymentMethod === "wallet" && !canAfford}
                        className="flex-1 bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {paymentMethod === "paystack" ? "Pay with Paystack" : "Create Proxy"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--marketing-accent)]" />
            <p className="mt-4 text-lg font-medium">Provisioning your proxy...</p>
            <p className="text-sm text-muted-foreground">Allocating ports and generating credentials</p>
          </motion.div>
        )}

        {step === "success" && orderResult && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Proxy Created!</h2>
              <p className="text-muted-foreground mt-1">{orderResult.message}</p>
            </div>

            <Card className="border-2 border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="text-base">Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-semibold">{orderResult.connection.proxyTypeLabel}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Country</span>
                    <p className="font-semibold">{orderResult.connection.countryCode || "Any"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Port Range</span>
                    <p className="font-semibold">{orderResult.connection.startPort} – {orderResult.connection.endPort}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Session</span>
                    <p className="font-semibold">{orderResult.connection.sessionTime}</p>
                  </div>
                </div>

                {orderResult.credentials && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Authentication Credentials</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded bg-white border">
                        <code className="flex-1 text-sm font-mono">Username: {orderResult.credentials.username}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(orderResult.credentials!.username)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-white border">
                        <code className="flex-1 text-sm font-mono">Password: {orderResult.credentials.password}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(orderResult.credentials!.password)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={reset} className="flex-1">Create Another</Button>
              <Button variant="outline" onClick={() => { setView("connections"); reset() }} className="flex-1">View My Proxies</Button>
            </div>
          </motion.div>
        )}

        {step === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Order Failed</h2>
            <p className="text-muted-foreground mt-1">{error}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={reset}>Go Back</Button>
              <Button onClick={handleOrder}>Retry</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
