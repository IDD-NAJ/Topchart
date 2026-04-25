"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ServiceGuard } from "@/components/service-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import {
  Smartphone,
  ShieldCheck,
  Phone,
  MessageSquare,
  Clock,
  CreditCard,
  Wallet,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Zap,
  Globe,
  Wifi
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ProductTab = "phone-number" | "travel-data"
type Step = "catalog" | "processing" | "success" | "failed"
type PaymentMethod = "wallet" | "paystack"

interface PhoneNumberPlan {
  id: string
  name: string
  price: number
  minutes: number
  sms: number
  features: string[]
  popular?: boolean
}

interface DataPlan {
  id: string;
  name: string;
  country: string;
  region: string | null;
  data_volume: string;
  validity_days: number;
  price: number;
  description: string | null;
}

const DEFAULT_AREA_CODES = [
  { code: "random", city: "Any available" },
]

export default function ESIMPage() {
  const { user } = useAuth()
  const [productTab, setProductTab] = useState<ProductTab>("phone-number")
  const [step, setStep] = useState<Step>("catalog")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet")
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // API-fetched data
  const [phonePlans, setPhonePlans] = useState<PhoneNumberPlan[]>([])
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  const [selectedPhonePlan, setSelectedPhonePlan] = useState<PhoneNumberPlan | null>(null)
  const [selectedDataPlan, setSelectedDataPlan] = useState<DataPlan | null>(null)
  
  const [areaCode, setAreaCode] = useState("random")
  const [customAreaCode, setCustomAreaCode] = useState("")
  const [useCustomAreaCode, setUseCustomAreaCode] = useState(false)
  const [fullName, setFullName] = useState("")
  const [comments, setComments] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true)
        const res = await fetch("/api/wallet", { credentials: "include" })
        if (res.ok) {
          const result = await res.json()
          if (result.success) setWalletBalance(result.data.balance ?? 0)
        }
      } catch { /* ignore */ } finally {
        setLoadingBalance(false)
      }
    }
    if (user) fetchBalance()
  }, [user])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true)
        const [resPhone, resData] = await Promise.all([
           fetch("/api/esim/plans", { credentials: "include" }),
           fetch("/api/esim/data-products", { credentials: "include" })
        ]);
        
        if (resPhone.ok) {
          const dataPhone = await resPhone.json()
          if (dataPhone.success) setPhonePlans(dataPhone.data)
        }
        if (resData.ok) {
           const dataTravel = await resData.json();
           if (dataTravel.success) setDataPlans(dataTravel.data);
        }
      } catch {
        toast.error("Failed to load plans")
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const currentAmount = productTab === "phone-number" ? (selectedPhonePlan?.price ?? 0) : (selectedDataPlan?.price ?? 0)
  const canAfford = walletBalance >= currentAmount

  const handleOrder = async () => {
    if (productTab === "phone-number" && !selectedPhonePlan) return;
    if (productTab === "travel-data" && !selectedDataPlan) return;
    
    if (paymentMethod === "wallet" && !canAfford) {
      toast.error("Insufficient wallet balance. Please top up or use Paystack.")
      return
    }

    setStep("processing")
    setError("")

    try {
      let res;
      if (productTab === "phone-number") {
         const payload: Record<string, unknown> = {
            paymentMethod,
            email,
            planType: "phone-number",
            planId: selectedPhonePlan!.id,
            amount: selectedPhonePlan!.price,
            areaCode: useCustomAreaCode && customAreaCode ? customAreaCode : areaCode,
            fullName,
            comments
         }

         res = await fetch("/api/purchases/esim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         })
      } else {
         // Travel Data API Payload restricts paystack by default right now, so if paystack comes up, it throws error from our manual logic if we haven't ported paystack there.
         // Let's rely on standard travel-esim endpoint ONLY for wallet, or gracefully catch paystack.
         if (paymentMethod === "paystack") {
            setStep("failed");
            setError("Paystack is currently unsupported for Travel Data. Please top up Wallet first.");
            return;
         }
         
         const payload = {
            productId: selectedDataPlan!.id,
            quantity: 1
         };
         
         res = await fetch("/api/purchases/travel-esim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         })
      }

      const data = await res.json()

      if (data.success) {
        if (paymentMethod === "paystack" && data.authorizationUrl) {
          window.location.href = data.authorizationUrl
          return
        }
        setStep("success")
        toast.success("Order placed successfully!")
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

  const reset = () => {
    setStep("catalog")
    setSelectedPhonePlan(null)
    setSelectedDataPlan(null)
    setError("")
  }

  const PaymentToggle = () => (
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
        {productTab === "phone-number" && (
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
        )}
      </div>
      {paymentMethod === "wallet" && !canAfford && currentAmount > 0 && (
        <p className="text-xs text-red-500">Insufficient balance. Top up your wallet or use Paystack.</p>
      )}
    </div>
  )

  return (
    <ServiceGuard serviceKey="esim">
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {step !== "catalog" && (
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">eSIM</h1>
          <p className="text-muted-foreground">US phone numbers & travel data eSIMs</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "catalog" && (
           <motion.div key="catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
             {/* Tabs Header */}
             <div className="flex bg-muted/60 p-1 rounded-lg w-fit">
               <button 
                  onClick={() => { setProductTab("phone-number"); setSelectedPhonePlan(null); setSelectedDataPlan(null); }}
                  className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2", productTab === "phone-number" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
               >
                 <Phone className="h-4 w-4" /> Phone Number
               </button>
               <button 
                  onClick={() => { setProductTab("travel-data"); setSelectedPhonePlan(null); setSelectedDataPlan(null); }}
                  className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2", productTab === "travel-data" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
               >
                 <Globe className="h-4 w-4" /> Travel Data
               </button>
             </div>

             {/* Phone Numbers Tab Context */}
             {productTab === "phone-number" && (
                <>
                 <Card className="border-2 border-blue-200 bg-blue-50/30">
                   <CardContent className="pt-6">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                         <Phone className="h-5 w-5 text-blue-600" />
                       </div>
                       <div>
                         <p className="font-semibold">Get a US Phone Number</p>
                         <p className="text-sm text-muted-foreground">Activate a real American number on your phone via eSIM</p>
                       </div>
                     </div>
                     <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                       <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> SMS</span>
                       <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Calls</span>
                       <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verification</span>
                       <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Moderator-processed</span>
                     </div>
                   </CardContent>
                 </Card>

                 {loadingPlans ? (
                   <div className="flex items-center justify-center py-12">
                     <Loader2 className="h-8 w-8 animate-spin text-[color:var(--marketing-accent)]" />
                     <span className="ml-3 text-muted-foreground">Loading phone plans...</span>
                   </div>
                 ) : (
                   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                     {phonePlans.map((plan) => (
                       <Card
                         key={plan.id}
                         className={cn(
                           "cursor-pointer transition-all hover:shadow-md border-2 relative",
                           selectedPhonePlan?.id === plan.id
                             ? "border-[color:var(--marketing-accent)] shadow-md"
                             : "border-transparent hover:border-[color:var(--marketing-accent)]/30"
                         )}
                         onClick={() => setSelectedPhonePlan(plan)}
                       >
                         {plan.popular && (
                           <Badge className="absolute -top-2 right-4 bg-[color:var(--marketing-accent)] text-white text-[10px]">Popular</Badge>
                         )}
                         <CardHeader className="pb-3">
                           <CardTitle className="text-base">{plan.name}</CardTitle>
                           <CardDescription>🇺🇸 US phone number</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-3">
                           <div className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{plan.price}</div>
                           <div className="space-y-1 text-sm">
                             <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {plan.minutes} minutes</div>
                             <div className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> {plan.sms} SMS</div>
                           </div>
                           <div className="pt-2 border-t space-y-1">
                             {plan.features.map((f) => (
                               <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                                 <CheckCircle2 className="h-3 w-3 text-green-500" /> {f}
                               </div>
                             ))}
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 )}

                 {selectedPhonePlan && (
                   <Card className="border-2 border-[color:var(--marketing-accent)]/20">
                     <CardHeader>
                       <CardTitle className="text-base">Configure & Pay</CardTitle>
                       <CardDescription>Configure your phone number preferences and delivery details</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <Label>Preferred Area Code</Label>
                           <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                             <input
                               type="checkbox"
                               checked={useCustomAreaCode}
                               onChange={(e) => setUseCustomAreaCode(e.target.checked)}
                               className="rounded border-gray-300"
                             />
                             Enter manually
                           </label>
                         </div>
                         {useCustomAreaCode ? (
                           <Input
                             placeholder="e.g., 305"
                             value={customAreaCode}
                             onChange={(e) => setCustomAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                             maxLength={3}
                           />
                         ) : (
                           <Select value={areaCode} onValueChange={setAreaCode}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                               {DEFAULT_AREA_CODES.map((ac) => (
                                 <SelectItem key={ac.code} value={ac.code}>
                                   {ac.code === "random" ? "Any available" : `${ac.code} (${ac.city})`}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         )}
                         <p className="text-xs text-muted-foreground">We will try your preferred area code; if unavailable, a similar one will be assigned.</p>
                       </div>

                       <div className="space-y-2">
                         <Label>Full Name</Label>
                         <Input
                           placeholder="Enter your full name"
                           value={fullName}
                           onChange={(e) => setFullName(e.target.value)}
                         />
                       </div>

                       <div className="space-y-2">
                         <Label>Additional Comments (Optional)</Label>
                         <textarea
                           className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[color:var(--marketing-accent)] focus:border-transparent"
                           placeholder="Any special requests or notes..."
                           value={comments}
                           onChange={(e) => setComments(e.target.value)}
                         />
                       </div>

                       <div className="space-y-2">
                         <Label>Delivery Email</Label>
                         <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                         <p className="text-xs text-muted-foreground">Activation details will be sent to this email</p>
                       </div>

                       <PaymentToggle />

                       <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                         <span className="font-medium">Total</span>
                         <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{selectedPhonePlan.price}</span>
                       </div>

                       <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                         <Clock className="h-4 w-4 shrink-0" />
                         <span>Phone number orders are processed by Moderator. You will be notified once your number is assigned.</span>
                       </div>

                       <Button
                         onClick={handleOrder}
                         disabled={paymentMethod === "wallet" && !canAfford}
                         className="w-full bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90"
                       >
                         <Zap className="h-4 w-4 mr-2" />
                         {paymentMethod === "paystack" ? "Pay with Paystack" : "Place Order"}
                       </Button>
                     </CardContent>
                   </Card>
                 )}
                </>
             )}

             {/* Travel Data Tab Context */}
             {productTab === "travel-data" && (
                <>
                 <Card className="border-2 border-emerald-200 bg-emerald-50/30">
                   <CardContent className="pt-6">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                         <Globe className="h-5 w-5 text-emerald-600" />
                       </div>
                       <div>
                         <p className="font-semibold">Travel Internet eSIM</p>
                         <p className="text-sm text-muted-foreground">Stay connected globally with high-speed travel data</p>
                       </div>
                     </div>
                     <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                       <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Internet Access</span>
                       <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Global Roaming</span>
                       <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Instant Delivery</span>
                     </div>
                   </CardContent>
                 </Card>

                 {loadingPlans ? (
                   <div className="flex items-center justify-center py-12">
                     <Loader2 className="h-8 w-8 animate-spin text-[color:var(--marketing-accent)]" />
                     <span className="ml-3 text-muted-foreground">Loading travel plans...</span>
                   </div>
                 ) : dataPlans.length === 0 ? (
                   <div className="text-center p-12 bg-muted/30 rounded-xl border-dashed border-2">
                     <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                     <p className="text-muted-foreground text-sm">No destination plans available right now.</p>
                   </div>
                 ) : (
                   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                     {dataPlans.map((plan) => (
                       <Card
                         key={plan.id}
                         className={cn(
                           "cursor-pointer transition-all hover:shadow-md border-2 relative",
                           selectedDataPlan?.id === plan.id
                             ? "border-emerald-500 shadow-md"
                             : "border-transparent hover:border-emerald-500/30"
                         )}
                         onClick={() => { setSelectedDataPlan(plan); setPaymentMethod("wallet"); }} // reset paystack as unsupported
                       >
                         <CardHeader className="pb-3">
                           <CardTitle className="text-base flex items-center gap-2">
                              {plan.country}
                           </CardTitle>
                           <CardDescription>{plan.name} {plan.region && `(${plan.region})`}</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-3">
                           <div className="flex items-end justify-between">
                             <div className="text-2xl font-bold text-emerald-600">₵{plan.price}</div>
                           </div>
                           <div className="flex items-center gap-3 pt-2 border-t text-sm">
                             <div className="flex items-center gap-1 font-medium"><Wifi className="h-3.5 w-3.5 text-emerald-500" /> {plan.data_volume}</div>
                             <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {plan.validity_days} Days</div>
                           </div>
                           {plan.description && (
                             <p className="text-xs text-muted-foreground pt-1">{plan.description}</p>
                           )}
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 )}

                 {selectedDataPlan && (
                   <Card className="border-2 border-emerald-500/20">
                     <CardHeader>
                       <CardTitle className="text-base">Checkout Package</CardTitle>
                       <CardDescription>Review your final details and finalize payment</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <PaymentToggle />
                       <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                         <span className="font-medium">Total</span>
                         <span className="text-2xl font-bold text-emerald-600">₵{selectedDataPlan.price}</span>
                       </div>

                       <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                         <CheckCircle2 className="h-4 w-4 shrink-0" />
                         <span>After completing this order, you will receive your QR code on the active orders page or via email.</span>
                       </div>

                       <Button
                         onClick={handleOrder}
                         disabled={paymentMethod === "wallet" && !canAfford}
                         className="w-full bg-emerald-600 hover:bg-emerald-700"
                       >
                         <Zap className="h-4 w-4 mr-2" />
                         {paymentMethod === "paystack" ? "Pay with Paystack" : "Complete Purchase"}
                       </Button>
                     </CardContent>
                   </Card>
                 )}
                </>
             )}
           </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--marketing-accent)]" />
            <p className="mt-4 text-lg font-medium">Processing your order...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground mt-1">
               {productTab === "phone-number" 
                 ? "Your US phone number request has been received." 
                 : "Your Travel eSIM order has been processed."}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground flex-col">
               {productTab === "phone-number" ? (
                 <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" />Admin will assign your number and notify you via email.</span>
               ) : (
                 <span className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-emerald-500" />Track your delivery or view your QR code on the dashboard tracking page.</span>
               )}
            </div>
            <Button onClick={reset} className="mt-6">Back to Catalog</Button>
          </motion.div>
        )}

        {step === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-red-600" />
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
    </ServiceGuard>
  )
}
