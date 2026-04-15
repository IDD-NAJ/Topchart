"use client"



import { useState, useEffect } from "react"

import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

import {

  AlertCircle,

  Clock,

  CheckCircle2,

  ChevronRight,

  Search,

  Filter,

  ShieldAlert,

  ArrowLeft,

  Loader2,

  Zap,

  Target,

  ShieldCheck,

  History,

  Activity,

  FileText

} from "lucide-react"

import { Input } from "@/components/ui/input"

import { Dispute, DisputeStatus } from "@/lib/actions/disputes"

import { cn } from "@/lib/utils"



export default function DisputesPage() {

  const [disputes, setDisputes] = useState<(Dispute & { transactionType: string, transactionAmount: number })[]>([])

  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")



  const fetchDisputes = async () => {

    setLoading(true)

    try {

      const res = await fetch("/api/dashboard/disputes")

      

      if (!res.ok) {

        throw new Error(`HTTP error ${res.status}`)

      }

      

      const data = await res.json()

      if (data.success) {

        setDisputes(data.disputes)

      }

    } catch (error) {

      console.error("Failed to fetch disputes:", error)

    } finally {

      setLoading(false)

    }

  }



  useEffect(() => {

    fetchDisputes()

  }, [])



  const getStatusIcon = (status: DisputeStatus) => {

    switch (status) {

      case "OPEN":

        return <AlertCircle className="w-5 h-5 text-blue-500" />

      case "IN_PROGRESS":

        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />

      case "RESOLVED":

        return <CheckCircle2 className="w-5 h-5 text-green-500" />

      case "CLOSED":

        return <ShieldCheck className="w-5 h-5 text-muted-foreground" />

      default:

        return <ShieldAlert className="w-5 h-5" />

    }

  }



  const getStatusBadge = (status: DisputeStatus) => {

    const variants: Record<DisputeStatus, string> = {

      OPEN: "bg-blue-50 text-blue-600 border-blue-200",

      IN_PROGRESS: "bg-amber-50 text-amber-600 border-amber-200",

      RESOLVED: "bg-green-50 text-green-600 border-green-200",

      CLOSED: "bg-muted text-muted-foreground border-border",

    }

    return (

      <Badge variant="outline" className={cn("capitalize font-bold text-[9px] px-2 py-0 h-4 tracking-tighter", variants[status])}>

        {status.replace("_", " ").toLowerCase()}

      </Badge>

    )

  }



  const filteredDisputes = disputes.filter((d) =>

    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||

    d.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||

    (d.reason && d.reason.toLowerCase().includes(searchTerm.toLowerCase()))

  )



  return (

    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">

      

      {/* Infrastructure Header */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="space-y-1">

          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-[#006994] transition-colors uppercase tracking-widest mb-2 group">

            <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />

            Back to Dashboard

          </Link>

          <h1 className="text-3xl font-bold tracking-tight">Dispute Resolution</h1>

          <p className="text-muted-foreground">Report and track issues with your transactions.</p>

        </div>

        <div className="flex items-center gap-3">

           <Button asChild variant="outline" size="sm" className="h-9 font-bold uppercase tracking-tighter text-[10px]">

             <Link href="/dashboard/history">

               <Zap className="w-3.5 h-3.5 mr-2" />

               Raise New Dispute

             </Link>

           </Button>

        </div>

      </div>



      <div className="grid grid-cols-1 gap-8">

        <Card className="border-[#006994]/10 overflow-hidden">

          <CardHeader className="pb-4 border-b bg-[#722F37]/10">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

               <div>

                 <CardTitle className="text-base">My Disputes</CardTitle>

                 <CardDescription>A list of all your reported transaction issues.</CardDescription>

               </div>

               <div className="flex items-center gap-2">

                 <div className="relative">

                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />

                   <Input

                     placeholder="Search node ID, tx ID..."

                     className="pl-9 h-9 w-[240px] text-xs"

                     value={searchTerm}

                     onChange={(e) => setSearchTerm(e.target.value)}

                   />

                 </div>

                 <Button variant="outline" size="icon" className="h-9 w-9">

                   <Filter className="w-3.5 h-3.5" />

                 </Button>

               </div>

            </div>

          </CardHeader>

          <CardContent className="p-0">

            {loading ? (

              <div className="flex flex-col items-center justify-center py-20 gap-4">

                <Loader2 className="w-10 h-10 animate-spin text-[#006994] opacity-50" />

                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>

              </div>

            ) : filteredDisputes.length === 0 ? (

              <div className="text-center py-20 space-y-4">

                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto opacity-20">

                   <ShieldAlert className="w-10 h-10" />

                </div>

                <div className="space-y-1">

                  <h3 className="font-bold text-lg">No Disputes Yet</h3>

                  <p className="text-muted-foreground text-sm max-w-[320px] mx-auto leading-relaxed">

                    Everything looks good! You can raise a dispute from your <Link href="/dashboard/history" className="text-[#006994] hover:underline font-bold">Transaction History</Link>.

                  </p>

                </div>

              </div>

            ) : (

              <div className="divide-y divide-border">

                {filteredDisputes.map((dispute) => (

                  <div

                    key={dispute.id}

                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 group hover:bg-muted/30 transition-colors gap-4"

                  >

                    <div className="flex items-start gap-4">

                      <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center shrink-0 shadow-sm">

                        {getStatusIcon(dispute.status)}

                      </div>

                      <div className="space-y-1">

                        <div className="flex items-center gap-3">

                          <span className="font-bold text-sm">

                            {dispute.transactionType.toUpperCase()} PAYLOAD

                          </span>

                          {getStatusBadge(dispute.status)}

                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">

                          <span className="flex items-center gap-1">

                            <FileText className="w-3 h-3" />

                            Node: {dispute.id}

                          </span>

                          <span className="hidden sm:inline opacity-30">|</span>

                          <span className="flex items-center gap-1">

                            <Activity className="w-3 h-3" />

                            TX: {dispute.transactionId}

                          </span>

                        </div>

                        <div className="flex items-center gap-2 pt-1">

                           <Badge variant="secondary" className="text-[10px] font-mono h-5 px-2">GH₵{Number(dispute.transactionAmount).toFixed(2)}</Badge>

                           <span className="text-[10px] text-muted-foreground">{new Date(dispute.createdAt).toLocaleDateString("en-GH", { day: 'numeric', month: 'short', year: 'numeric' })}</span>

                        </div>

                      </div>

                    </div>



                    <div className="flex flex-col items-end gap-2">

                      <div className="text-right max-w-[280px]">

                         <p className="text-[11px] font-medium italic line-clamp-1">"{dispute.reason}"</p>

                      </div>

                      {dispute.resolution && (

                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-700 leading-relaxed font-medium">

                          <span className="font-bold uppercase tracking-tighter mr-1">Outcome:</span>

                          {dispute.resolution}

                        </div>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </CardContent>

        </Card>



        {/* Support Options */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

           <Card className="bg-[#006994]/5 border-[#006994]/10">

              <CardContent className="p-6 flex items-start gap-4">

                 <div className="w-12 h-12 rounded-2xl bg-background border flex items-center justify-center shrink-0 shadow-sm">

                    <Target className="w-6 h-6 text-[#006994]" />

                 </div>

                 <div className="space-y-2">

                    <h4 className="text-sm font-bold uppercase tracking-widest">How Disputes Work</h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">

                      Most disputes are resolved within 24–48 business hours. We work directly with network providers to confirm and fix any failed transactions.

                    </p>

                 </div>

              </CardContent>

           </Card>

           <Card className="bg-muted/30 border-dashed">

              <CardContent className="p-6 flex items-start gap-4">

                 <div className="w-12 h-12 rounded-2xl bg-background border flex items-center justify-center shrink-0 shadow-sm">

                    <ShieldAlert className="w-6 h-6 text-muted-foreground" />

                 </div>

                 <div className="space-y-2">

                    <h4 className="text-sm font-bold uppercase tracking-widest">Need Urgent Help?</h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">

                      If you have an urgent issue that needs immediate attention, please open an <Link href="/dashboard/tickets" className="text-[#722F37] font-bold hover:underline">Urgent Support Ticket</Link>.

                    </p>

                 </div>

              </CardContent>

           </Card>

        </div>

      </div>

    </div>

  )

}

