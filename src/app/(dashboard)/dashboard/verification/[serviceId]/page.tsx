"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { trackAdsPurchase } from "@/lib/ads"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Phone,
  Clock,
  Calendar,
  CreditCard,
  Loader2,
  Copy,
  MessageSquare,
  AlertCircle,
} from "lucide-react"

const LTR_DURATIONS = [
  { days: 3,  label: "3 Days" },
  { days: 7,  label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
]

interface Service {
  id: string
  pvadeals_service_id: string
  name: string
  category: string
  picture_url?: string
  country?: string
  str_price: number
  ltr3_price: number
  ltr7_price: number
  ltr14_price: number
  ltr30_price: number
}

function getLtrPrice(svc: Service, days: number): number {
  if (days <= 3)  return svc.ltr3_price
  if (days <= 7)  return svc.ltr7_price
  if (days <= 14) return svc.ltr14_price
  return svc.ltr30_price
}

interface ActiveNumber {
  id: string
  number: string
  service_name: string
  type: "STR" | "LTR"
  status: string
  time_remaining_ms: number
  time_remaining_formatted: string
  is_expired: boolean
  sms_count: number
  expires_at: string
  allow_flag?: boolean
  allow_reuse?: boolean
  ltr_duration_days?: number
}

interface SMS {
  id: string
  from_number: string
  message: string
  received_at: string
}

function ServiceDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewNumberId = searchParams.get("view")
  const { user, refreshUser } = useAuth()
  
  const serviceId = params.serviceId as string
  
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<Service | null>(null)
  const [purchaseType, setPurchaseType] = useState<"STR" | "LTR">("STR")
  const [ltrDays, setLtrDays] = useState(3)
  const [activeNumber, setActiveNumber] = useState<ActiveNumber | null>(null)
  const [smsList, setSmsList] = useState<SMS[]>([])
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchService()
    if (viewNumberId) {
      fetchNumberDetails(viewNumberId)
    }
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [serviceId, viewNumberId])

  const fetchService = async () => {
    try {
      const response = await fetch("/api/verification/services")
      let data: any = null
      try { data = await response.json() } catch { /* non-JSON response */ }
      
      if (data?.success) {
        const found = data?.data?.services?.find((s: Service) => s.id === serviceId)
        if (found) {
          setService(found)
        }
      }
    } catch (err) {
      console.error("Failed to fetch service:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchNumberDetails = async (numberId: string) => {
    try {
      // Fetch number details
      const response = await fetch("/api/verification/numbers?include_expired=true")
      let data: any = null
      try { data = await response.json() } catch { /* non-JSON response */ }
      
      if (data?.success) {
        const found = data?.data?.numbers?.find((n: ActiveNumber) => n.id === numberId)
        if (found) {
          setActiveNumber(found)
          fetchSMS(numberId)
          
          // Start polling for SMS if active
          if (found.status === "active" && !found.is_expired) {
            const interval = setInterval(() => fetchSMS(numberId), 10000)
            setPollingInterval(interval)
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch number details:", err)
    }
  }

  const fetchSMS = async (numberId: string) => {
    try {
      const response = await fetch(`/api/verification/sms/${numberId}`, { credentials: "include", cache: "no-store" })
      let data: any = null
      try { data = await response.json() } catch { /* non-JSON response */ }
      if (data?.success) {
        setSmsList(data?.data?.sms || [])
      }
    } catch (err) {
      console.error("Failed to fetch SMS:", err)
    }
  }

  const calculatePrice = () => {
    if (!service) return 0
    return purchaseType === "STR" ? service.str_price : getLtrPrice(service, ltrDays)
  }

  const handlePurchase = async () => {
    if (!service) return
    
    setIsPurchasing(true)
    try {
      const response = await fetch("/api/verification/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pvadealsServiceId: service.pvadeals_service_id,
          type: purchaseType,
          ltrDays: purchaseType === "LTR" ? ltrDays : undefined,
        }),
      })
      
      let data: any = null
      try {
        data = await response.json()
      } catch (error) {
        console.error("Failed to parse JSON response:", error)
        toast.error("Failed to complete purchase")
        return
      }
      
      if (data?.success) {
        try {
          trackAdsPurchase(data?.data?.reference, {
            value: data?.data?.price,
            currency: "GHS",
          })
        } catch {}
        toast.success(`${purchaseType === "LTR" ? "LTR rental" : "STR number"} purchased successfully!`)
        refreshUser()
        
        // Set the active number and start viewing
        setActiveNumber({
          id: data?.data?.number_id,
          number: data?.data?.number,
          service_name: service.name,
          type: purchaseType,
          status: "active",
          time_remaining_ms: purchaseType === "LTR" ? ltrDays * 24 * 60 * 60 * 1000 : 20 * 60 * 1000,
          time_remaining_formatted: purchaseType === "LTR" ? `${ltrDays * 24}h 0m` : "20m 0s",
          is_expired: false,
          sms_count: 0,
          expires_at: data?.data?.expires_at,
          allow_flag: data?.data?.allow_flag,
          allow_reuse: data?.data?.allow_reuse,
          ltr_duration_days: purchaseType === "LTR" ? ltrDays : undefined,
        })
        
        // Start polling
        const interval = setInterval(() => fetchSMS(data?.data?.number_id || ""), 5000)
        setPollingInterval(interval)
        
        // Update URL
        router.push(`/dashboard/verification/${serviceId}?view=${data?.data?.number_id || ""}`)
      } else {
        if (data?.data?.shortfall) {
          toast.error(`Insufficient balance. You need ${formatCurrency(data?.data?.shortfall)} more.`)
        } else {
          toast.error(data?.error || "Purchase failed")
        }
      }
    } catch (err) {
      toast.error("Failed to complete purchase")
      refreshUser()
    } finally {
      setIsPurchasing(false)
    }
  }

  const copyNumber = () => {
    if (activeNumber?.number) {
      navigator.clipboard.writeText(activeNumber.number)
      toast.success("Number copied to clipboard")
    }
  }

  const copySMS = (message: string) => {
    navigator.clipboard.writeText(message)
    toast.success("SMS copied to clipboard")
  }

  const handleCancel = async () => {
    if (!activeNumber) return
    
    try {
      const response = await fetch("/api/verification/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId: activeNumber.id }),
      })
      
      let data: any = null
      try { data = await response.json() } catch { /* non-JSON response */ }
      
      if (data?.success) {
        toast.success("Number cancelled")
        setActiveNumber(null)
        if (pollingInterval) clearInterval(pollingInterval)
        router.push(`/dashboard/verification/${serviceId}`)
      } else {
        toast.error(data?.error || "Failed to cancel")
      }
    } catch (err) {
      toast.error("Failed to cancel number")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Service not found</p>
        <Link href="/dashboard/verification">
          <Button className="mt-4">Back to Services</Button>
        </Link>
      </div>
    )
  }

  // View mode - showing active number
  if (activeNumber) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/verification">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
        </Link>

        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{service.name}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Your Foreign Number</p>
        </div>

        {/* Number Card */}
        <Card className="border-2 border-[color:var(--marketing-accent)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 min-w-0">
                <Phone className="h-5 w-5 shrink-0" />
                <span className="truncate">Your Number</span>
              </CardTitle>
              <Badge variant={activeNumber.type === "LTR" ? "default" : "secondary"} className="shrink-0">
                {activeNumber.type === "LTR" ? `LTR ${activeNumber.ltr_duration_days ?? ""}d` : "STR 20min"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-lg bg-muted p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <span className="break-all font-mono text-lg font-bold sm:text-2xl">{activeNumber.number}</span>
              <Button variant="outline" size="sm" onClick={copyNumber} className="w-full shrink-0 sm:w-auto">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {activeNumber.is_expired ? (
                <span className="text-red-600 font-medium">Expired</span>
              ) : (
                <span>Expires in: <span className="font-mono font-medium text-orange-600">{activeNumber.time_remaining_formatted}</span></span>
              )}
            </div>
          </CardContent>
          {activeNumber.status === "active" && !activeNumber.is_expired && smsList.length === 0 && (
            <CardFooter>
              <Button variant="destructive" onClick={handleCancel} className="w-full">
                Cancel Number
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* SMS Inbox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span>SMS Inbox</span>
              {smsList.length > 0 && (
                <Badge variant="secondary" className="shrink-0">{smsList.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              SMS messages received on this number appear here automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {smsList.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No SMS received yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the number above for verification. SMS will appear here within seconds.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {smsList.map((sms) => (
                  <motion.div
                    key={sms.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">From: {sms.from_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sms.received_at).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copySMS(sms.message)} className="shrink-0 h-8 w-8 p-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm whitespace-pre-wrap break-all">{sms.message}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 sm:p-6">
            <h4 className="font-medium mb-2 text-sm sm:text-base">How to use this number</h4>
            <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the number above</li>
              <li>Go to {service.name} and enter this number for verification</li>
              <li>Request the verification code on {service.name}</li>
              <li>Return here - the SMS will appear automatically</li>
              <li>Copy the verification code and complete your signup</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Purchase mode
  return (
    <div className="space-y-6">
      <Link href="/dashboard/verification">
        <Button variant="ghost" className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
      </Link>

      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{service.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Get a temporary {service.country ?? "US"} number for {service.name} verification</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Purchase Options */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Purchase Type</CardTitle>
              <CardDescription>Choose the option that fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={purchaseType}
                onValueChange={(v) => setPurchaseType(v as "STR" | "LTR")}
                className="grid gap-4"
              >
                <div>
                  <RadioGroupItem value="STR" id="STR" className="peer sr-only" />
                  <Label
                    htmlFor="STR"
                    className="flex cursor-pointer flex-col justify-between gap-2 rounded-lg border-2 p-3 peer-data-[state=checked]:border-[color:var(--marketing-accent)] sm:flex-row sm:items-center sm:gap-0 sm:p-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">STR — Short-Term</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Valid for 20 minutes</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm sm:text-base shrink-0">{formatCurrency(service.str_price)}</span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="LTR" id="LTR" className="peer sr-only" />
                  <Label
                    htmlFor="LTR"
                    className="flex cursor-pointer flex-col justify-between gap-2 rounded-lg border-2 p-3 peer-data-[state=checked]:border-[color:var(--marketing-accent)] sm:flex-row sm:items-center sm:gap-0 sm:p-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">LTR — Long-Term</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">3 to 30-day rental</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm sm:text-base shrink-0">From {formatCurrency(service.ltr3_price)}</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {purchaseType === "LTR" && (
            <Card>
              <CardHeader>
                <CardTitle>Select Duration</CardTitle>
                <CardDescription>How long do you need the number?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={ltrDays.toString()}
                  onValueChange={(v) => setLtrDays(parseInt(v))}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                >
                  {LTR_DURATIONS.map((d) => (
                    <div key={d.days}>
                      <RadioGroupItem value={d.days.toString()} id={`days-${d.days}`} className="peer sr-only" />
                      <Label
                        htmlFor={`days-${d.days}`}
                        className="flex cursor-pointer flex-col items-center rounded-lg border-2 p-2 peer-data-[state=checked]:border-[color:var(--marketing-accent)] peer-data-[state=checked]:bg-[color:var(--marketing-accent)]/5 sm:p-3"
                      >
                        <span className="font-medium text-xs sm:text-sm">{d.label}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {formatCurrency(getLtrPrice(service, d.days))}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-1 lg:order-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Service</span>
                <span className="font-medium text-right truncate max-w-[150px] sm:max-w-[200px]">{service.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Type</span>
                <span className="font-medium text-right">{purchaseType === "STR" ? "STR (20 min)" : `LTR (${ltrDays} days)`}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground shrink-0">Total</span>
                <span className="text-xl sm:text-2xl font-bold text-right">{formatCurrency(calculatePrice())}</span>
              </div>

              {user && (
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">Wallet Balance</span>
                  <span className={user.walletBalance < calculatePrice() ? "text-red-600" : "text-green-600 text-right"}>
                    {formatCurrency(user.walletBalance || 0)}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePurchase}
                disabled={isPurchasing || (user?.walletBalance || 0) < calculatePrice()}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase with Wallet
                  </>
                )}
              </Button>
              
              {(user?.walletBalance || 0) < calculatePrice() && (
                <Link href="/dashboard/wallet" className="w-full">
                  <Button variant="outline" className="w-full">
                    Fund Wallet
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Fallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ServiceDetailPageContent />
    </Suspense>
  )
}
