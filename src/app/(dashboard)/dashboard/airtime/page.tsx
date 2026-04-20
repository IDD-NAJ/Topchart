"use client"



import { useState, useEffect } from "react"

import { useRouter } from "next/navigation"

import { detectNetwork, type Network } from "@/lib/networks"

import { NetworkSelector } from "@/components/network-selector"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { useAuth } from "@/lib/auth-context"

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog"

import { AlertCircle, CheckCircle2, Loader2, Phone, ArrowLeft, Star, Heart, Zap, ShieldCheck, CreditCard, Users, Target } from "lucide-react"

import Link from "next/link"

import { cn } from "@/lib/utils"

import { addFavorite } from "@/lib/actions/favorites"

import { FavoriteNumbers } from "@/components/favorite-numbers"

import { toast } from "sonner"



const quickAmounts = [1, 2, 5, 10, 20, 50, 100]

type Step = "form" | "confirm" | "processing" | "success" | "failed"



export default function AirtimePage() {

  const router = useRouter()

  const { user: authUser, refreshUser } = useAuth()

  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)

  const [phone, setPhone] = useState("")

  const [amount, setAmount] = useState("")

  const [customAmount, setCustomAmount] = useState("")

  const [step, setStep] = useState<Step>("form")

  const [error, setError] = useState("")

  const [user, setUser] = useState<any>(null)

  const [saveAsFavorite, setSaveAsFavorite] = useState(false)

  const [favoriteName, setFavoriteName] = useState("")

  const [isSaving, setIsSaving] = useState(false)



  useEffect(() => {

    setUser(authUser)

  }, [authUser])



  useEffect(() => {

    if (phone.length >= 4) {

      const detected = detectNetwork(phone)

      if (detected) {

        setSelectedNetwork(detected)

      }

    }

  }, [phone])



  const validateForm = () => {

    if (!selectedNetwork) {

      setError("Please select a network provider.")

      return false

    }

    if (!phone || phone.length < 10) {

      setError("Please enter a valid recipient phone number.")

      return false

    }

    const finalAmount = customAmount || amount

    if (!finalAmount || Number(finalAmount) <= 0) {

      setError("Please enter a valid recharge amount.")

      return false

    }

    if (!user || Number(finalAmount) > user.walletBalance) {

      setError("Insufficient wallet balance. Please fund your wallet.")

      return false

    }

    return true

  }



  const handleProceed = () => {

    setError("")

    if (validateForm()) {

      setStep("confirm")

    }

  }



  const handleSaveFavorite = async () => {

    if (!user || !phone) return;

    if (saveAsFavorite && !favoriteName) {

      toast.error("Please provide a label for this recipient.");

      return;

    }



    setIsSaving(true);

    const result = await addFavorite({

      userId: user.id,

      phoneNumber: phone,

      name: favoriteName,

      type: 'airtime',

      network: selectedNetwork?.name

    });



    setIsSaving(false);

    if (result.success) {

      toast.success("Recipient saved successfully.");

      setSaveAsFavorite(false);

      setFavoriteName("");

    } else {

      toast.error(result.error || "Failed to save recipient.");

    }

  }



  const handleConfirm = async () => {

    if (!selectedNetwork || !phone || !user) return

    

    setStep("processing")

    

    try {

      const finalAmount = customAmount || amount

      const response = await fetch('/api/purchases', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          userId: user.id,

          amount: Number(finalAmount),

          phone: phone,

          networkId: selectedNetwork.id,

          networkName: selectedNetwork.name,

          planName: `Airtime - GH₵${finalAmount}`,

          planSize: `${finalAmount} GHS`,

          planPrice: Number(finalAmount),

        }),

      })



      const result = await response.json()

      

      if (result.success) {

        setStep("success")

        await refreshUser()

      } else {

        setStep("failed")

        setError(result.error || "Transaction declined by provider.")

      }

    } catch (error) {

      setStep("failed")

      setError("Connectivity issue. Your balance remains unchanged.")

    }

  }



  const getTransactionIcon = (type: string) => {

    switch (type) {

      case "success":

        return <CheckCircle2 className="w-8 h-8 text-green-500" />

      case "failed":

        return <AlertCircle className="w-8 h-8 text-red-500" />

      default:

        return <Loader2 className="w-8 h-8 animate-spin text-[#006994]" />

    }

  }



  return (

    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">

      

      {/* Infrastructure Header */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="space-y-1">

          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-[#006994] transition-colors uppercase tracking-widest mb-2 group">

            <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />

            Back to Infrastructure

          </Link>

          <h1 className="text-3xl font-bold tracking-tight">Buy Airtime</h1>

          <p className="text-muted-foreground">Instant synchronization with Ghana's major network nodes.</p>

        </div>

        <div className="flex items-center gap-3">

           <div className="px-4 py-2 rounded-lg bg-[#006994]/5 border border-[#006994]/10 flex items-center gap-2">

             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

             <span className="text-xs font-bold uppercase tracking-wider text-[#006994]">System Online</span>

           </div>

        </div>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {step === "confirm" ? (

          <div className="lg:col-span-12 animate-in slide-in-from-bottom-4 duration-500">

            <Card className="border-[#006994]/20 bg-[#006994]/5 max-w-2xl mx-auto overflow-hidden">

              <div className="bg-gradient-to-r from-[#006994] to-[#1A85B8] p-8 text-white relative">

                <div className="absolute right-8 top-8 w-24 h-24 bg-white/5 rounded-full blur-3xl" />

                <div className="flex items-center gap-4 mb-6">

                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">

                    <ShieldCheck className="w-8 h-8 text-white" />

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-white tracking-tight">Security Authorization</h2>

                    <p className="text-primary-foreground/80 text-sm">Review your infrastructure request details.</p>

                  </div>

                </div>

                

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-white/10">

                  <div className="space-y-1">

                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Node Provider</p>

                    <p className="text-lg font-bold">{selectedNetwork?.name}</p>

                  </div>

                  <div className="space-y-1">

                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Target Endpoint</p>

                    <p className="text-lg font-mono font-bold tracking-tight">{phone}</p>

                  </div>

                  <div className="space-y-1">

                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Authorized Magnitude</p>

                    <p className="text-2xl font-black">GH₵{customAmount || amount}</p>

                  </div>

                </div>

              </div>



              <CardContent className="p-8 bg-background">

                <div className="flex flex-col md:flex-row gap-4">

                  <Button 

                    variant="outline" 

                    onClick={() => setStep("form")} 

                    className="flex-1 h-12 font-bold uppercase text-xs tracking-widest border-2"

                  >

                    Modify Configuration

                  </Button>

                  <Button 

                    onClick={handleConfirm} 

                    className="flex-1 h-12 font-bold uppercase text-xs tracking-widest shadow-xl shadow-primary/20 group"

                  >

                    Confirm & Synchronize

                    <Zap className="w-4 h-4 ml-2 group-hover:scale-125 transition-transform" />

                  </Button>

                </div>

                <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-dashed flex items-start gap-3">

                  <Target className="w-4 h-4 text-muted-foreground mt-0.5" />

                  <p className="text-[11px] text-muted-foreground leading-relaxed">

                    By clicking "Confirm & Synchronize", you authorize an immediate debit from your wallet and initiation of the airtime payload delivery protocol. This action is irreversible once broadcast to the network.

                  </p>

                </div>

              </CardContent>

            </Card>

          </div>

        ) : (

          <>

            {/* Main Configuration Form */}

            <div className="lg:col-span-8 space-y-6">

              

              <section className="space-y-4">

                <div className="flex items-center gap-2 px-1">

                   <Zap className="w-4 h-4 text-[#006994]" />

                   <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Node Configuration</h2>

                </div>

                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                   <Card className="md:col-span-2">

                     <CardHeader className="pb-4 border-b bg-muted/20">

                        <CardTitle className="text-base">Network Provider</CardTitle>

                        <CardDescription>Select the destination infrastructure for this recharge.</CardDescription>

                     </CardHeader>

                     <CardContent className="pt-6">

                        <NetworkSelector

                          selected={selectedNetwork}

                          onSelect={setSelectedNetwork}

                        />

                     </CardContent>

                   </Card>



                   <Card className="md:col-span-1">

                     <CardHeader className="pb-4 border-b bg-muted/20">

                        <CardTitle className="text-base">Recipient Endpoint</CardTitle>

                        <CardDescription>Target MSISDN for the airtime payload.</CardDescription>

                     </CardHeader>

                     <CardContent className="pt-6 space-y-4">

                        <div className="relative">

                          <Input

                            type="tel"

                            placeholder="e.g. 024XXXXXXX"

                            value={phone}

                            onChange={(e) => setPhone(e.target.value)}

                            className="text-lg font-mono tracking-widest pr-10 h-12"

                          />

                          {phone.length >= 9 && (

                            <button

                              onClick={() => setSaveAsFavorite(!saveAsFavorite)}

                              className={cn(

                                "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",

                                saveAsFavorite ? "text-[#006994] bg-[#006994]/10 shadow-sm" : "text-muted-foreground hover:bg-muted"

                              )}

                            >

                              <Star className={cn("w-5 h-5", saveAsFavorite && "fill-current")} />

                            </button>

                          )}

                        </div>



                        {saveAsFavorite && (

                          <div className="p-3 rounded-lg border border-dashed border-[#006994]/30 bg-[#006994]/5 space-y-2 animate-in slide-in-from-top-2 duration-300">

                            <Label htmlFor="fav-name" className="text-[10px] uppercase font-bold text-[#006994]">System Alias (Label)</Label>

                            <div className="flex gap-2">

                              <Input

                                id="fav-name"

                                placeholder="e.g. Personal, Business"

                                value={favoriteName}

                                onChange={(e) => setFavoriteName(e.target.value)}

                                className="h-9 text-sm"

                              />

                              <Button 

                                size="sm" 

                                className="h-9 px-4 font-bold uppercase text-[10px]" 

                                onClick={handleSaveFavorite}

                                disabled={isSaving}

                              >

                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Registry"}

                              </Button>

                            </div>

                          </div>

                        )}



                        {error && (

                          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-2 text-destructive">

                            <AlertCircle className="w-4 h-4 flex-shrink-0" />

                            <p className="text-xs font-medium">{error}</p>

                          </div>

                        )}

                     </CardContent>

                   </Card>



                   <Card className="md:col-span-1">

                     <CardHeader className="pb-4 border-b bg-muted/20">

                        <CardTitle className="text-base">Payload Magnitude</CardTitle>

                        <CardDescription>Define the amount to be synchronized.</CardDescription>

                     </CardHeader>

                     <CardContent className="pt-6 space-y-4">

                        <div className="grid grid-cols-3 gap-2">

                          {quickAmounts.map((amt) => (

                            <button

                              key={amt}

                              onClick={() => {

                                setAmount(amt.toString())

                                setCustomAmount("")

                              }}

                              className={cn(

                                "h-10 border rounded-lg text-xs font-bold transition-all flex items-center justify-center",

                                amount === amt.toString() 

                                  ? "border-[#006994] bg-[#006994] text-white shadow-md" 

                                  : "border-border hover:border-[#006994]/50 hover:bg-muted/50"

                              )}

                            >

                              GH₵{amt}

                            </button>

                          ))}

                        </div>

                        

                        <div className="space-y-1.5">

                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Custom Value</Label>

                          <div className="relative">

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">GH₵</span>

                            <Input

                              type="number"

                              placeholder="0.00"

                              value={customAmount}

                              onChange={(e) => {

                                setCustomAmount(e.target.value)

                                setAmount("")

                              }}

                              className="pl-12 text-base font-bold h-11"

                              min="1"

                            />

                          </div>

                        </div>

                     </CardContent>

                   </Card>

                </div>

              </section>



              {/* Registry Section */}

              <section className="space-y-4">

                 <div className="flex items-center gap-2 px-1">

                    <Users className="w-4 h-4 text-[#006994]" />

                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Local Registry</h2>

                 </div>

                 <Card>

                   <CardContent className="pt-6">

                     <FavoriteNumbers 

                        userId={user?.id} 

                        type="airtime" 

                        onSelect={(val) => setPhone(val)} 

                      />

                   </CardContent>

                 </Card>

              </section>

            </div>



            {/* Audit & Verification Sidebar */}

            <div className="lg:col-span-4 space-y-6">

              <Card className="sticky top-24 border-[#006994]/20 bg-[#006994]/5">

                <CardHeader className="pb-2 border-b border-[#006994]/10">

                  <CardTitle className="text-base flex items-center gap-2">

                     <ShieldCheck className="w-4 h-4 text-[#006994]" />

                     Transaction Audit

                  </CardTitle>

                  <CardDescription>Pre-flight verification for your request.</CardDescription>

                </CardHeader>

                <CardContent className="pt-6 space-y-6">

                  <div className="space-y-4">

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#006994]/20">

                      <span className="text-xs font-medium text-muted-foreground uppercase">Infrastructure</span>

                      <span className="text-sm font-bold">{selectedNetwork?.name || "Pending..."}</span>

                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#006994]/20">

                      <span className="text-xs font-medium text-muted-foreground uppercase">Destination</span>

                      <span className="text-sm font-mono font-bold tracking-tight">{phone || "No Endpoint"}</span>

                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed border-[#006994]/20">

                      <span className="text-xs font-medium text-muted-foreground uppercase">Liquidity</span>

                      <span className="text-sm font-bold text-green-600">GH₵{Number(user?.walletBalance || 0).toFixed(2)}</span>

                    </div>

                    

                    <div className="pt-4 flex justify-between items-end">

                       <div className="space-y-1">

                          <p className="text-[10px] font-bold uppercase text-[#006994]">Total Magnitude</p>

                          <p className="text-3xl font-bold tracking-tighter">GH₵{customAmount || amount || "0.00"}</p>

                       </div>

                       <div className="p-2 rounded bg-[#006994]/10 border border-[#006994]/20">

                          <CreditCard className="w-4 h-4 text-[#006994]" />

                       </div>

                    </div>

                  </div>



                    <div className="space-y-3">

                      <Button 

                        className="w-full h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#006994]/20 group bg-gradient-to-r from-[#006994] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#006994]"

                        onClick={handleProceed}

                        disabled={!selectedNetwork || !phone || !(amount || customAmount) || !user}

                      >

                        Make Payment

                        <Zap className="w-3 h-3 ml-2 group-hover:scale-125 transition-transform" />

                      </Button>

                      <p className="text-[10px] text-center text-muted-foreground leading-relaxed">

                      By authorizing, you initiate an irreversible synchronization with the selected network node.

                    </p>

                  </div>

                </CardContent>

              </Card>

            </div>

          </>

        )}

      </div>



      {/* Confirmation Modal removed and replaced by static section above */}



      {/* Processing/Outcome Modal */}

      <Dialog open={["processing", "success", "failed"].includes(step)} onOpenChange={() => {}}>

        <DialogContent className="sm:max-w-[400px] text-center p-8">

          <div className="flex flex-col items-center space-y-6">

            <div className={cn(

              "w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-500",

              step === "processing" ? "bg-primary/10" : 

              step === "success" ? "bg-green-500/10" : "bg-destructive/10"

            )}>

              {getTransactionIcon(step)}

            </div>

            

              <div className="space-y-2">

                <DialogTitle className="text-xl font-bold">

                  {step === "processing" && "Processing..."}

                  {step === "success" && "Recharge Complete"}

                  {step === "failed" && "Top-Up Failed"}

                </DialogTitle>

                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">

                  {step === "processing" && "Sending your top-up. Please wait a moment."}

                  {step === "success" && `GH₵${customAmount || amount} airtime has been sent to ${phone} successfully.`}

                  {step === "failed" && (error || "The top-up could not be completed. No funds were deducted.")}

                </DialogDescription>

              </div>



            {step === "success" && (

              <Button onClick={() => router.push("/dashboard")} className="w-full font-bold uppercase tracking-widest text-[10px]">

                Back to Dashboard

              </Button>

            )}

            {step === "failed" && (

              <Button onClick={() => setStep("form")} variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px]">

                Try Again

              </Button>

            )}

          </div>

        </DialogContent>

      </Dialog>

    </div>

  )

}

