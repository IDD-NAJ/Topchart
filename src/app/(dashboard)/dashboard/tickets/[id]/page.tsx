"use client"



import { useState, useEffect, useRef } from "react"

import { useParams, useRouter } from "next/navigation"

import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

import {

  MessageSquare,

  ArrowLeft,

  Send,

  User,

  Shield,

  Clock,

  CheckCircle2,

  AlertCircle,

} from "lucide-react"

import { Textarea } from "@/components/ui/textarea"

import { useToast } from "@/hooks/use-toast"

import { Ticket, TicketStatus, TicketMessage } from "@/lib/actions/tickets"



export default function TicketDetailPage() {

  const params = useParams()

  const router = useRouter()

  const [ticket, setTicket] = useState<Ticket | null>(null)

  const [loading, setLoading] = useState(true)

  const [reply, setReply] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const scrollRef = useRef<HTMLDivElement>(null)



  const fetchTicket = async () => {

    try {

      const res = await fetch(`/api/dashboard/tickets/${params.id}`)

      

      if (!res.ok) {

        throw new Error(`HTTP error ${res.status}`)

      }

      

      const data = await res.json()

      if (data.success) {

        setTicket(data.ticket)

      } else {

        toast({

          title: "Error",

          description: data.error || "Failed to load ticket",

          variant: "destructive",

        })

        router.push("/dashboard/tickets")

      }

    } catch (error) {

      console.error("Failed to fetch ticket:", error)

    } finally {

      setLoading(false)

    }

  }



  useEffect(() => {

    fetchTicket()

  }, [params.id])



  useEffect(() => {

    if (scrollRef.current) {

      scrollRef.current.scrollTop = scrollRef.current.scrollHeight

    }

  }, [ticket?.messages])



  const handleSendReply = async (e: React.FormEvent) => {

    e.preventDefault()

    if (!reply.trim() || isSubmitting) return



    setIsSubmitting(true)

    try {

      const res = await fetch(`/api/dashboard/tickets/${params.id}`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ body: reply }),

      })

      

      if (!res.ok) {

        throw new Error(`HTTP error ${res.status}`)

      }

      

      const data = await res.json()

      if (data.success) {

        setReply("")

        fetchTicket()

      } else {

        toast({

          title: "Error",

          description: data.error || "Failed to send message",

          variant: "destructive",

        })

      }

    } catch (error) {

      toast({

        title: "Error",

        description: "An unexpected error occurred",

        variant: "destructive",

      })

    } finally {

      setIsSubmitting(false)

    }

  }



  if (loading) {

    return (

      <div className="flex flex-col items-center justify-center py-12">

        <Loader2 className="w-8 h-8 animate-spin text-[#006994] mb-2" />

        <p className="text-sm text-muted-foreground">Loading ticket details...</p>

      </div>

    )

  }



  if (!ticket) return null



  const getStatusBadge = (status: TicketStatus) => {

    const variants: Record<TicketStatus, "default" | "secondary" | "outline" | "destructive"> = {

      OPEN: "default",

      IN_PROGRESS: "secondary",

      RESOLVED: "default",

      CLOSED: "outline",

    }

    return (

      <Badge variant={variants[status]} className="capitalize">

        {status.replace("_", " ").toLowerCase()}

      </Badge>

    )

  }



  return (

    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex items-center gap-4">

        <Button variant="ghost" size="icon" asChild>

          <Link href="/dashboard/tickets">

            <ArrowLeft className="w-5 h-5" />

          </Link>

        </Button>

        <div className="flex-1">

          <div className="flex items-center gap-3">

            <h1 className="text-xl font-bold">{ticket.subject}</h1>

            {getStatusBadge(ticket.status)}

          </div>

          <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>

        </div>

      </div>



      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">

          <Card className="flex flex-col h-[600px]">

            <CardHeader className="border-b py-3 px-4">

              <CardTitle className="text-sm font-medium">Conversation</CardTitle>

            </CardHeader>

            <CardContent

              ref={scrollRef}

              className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"

            >

              {ticket.messages?.map((msg) => (

                <div

                  key={msg.id}

                  className={`flex ${

                    msg.senderType === "USER" ? "justify-end" : "justify-start"

                  }`}

                >

                  <div

                    className={`flex gap-3 max-w-[85%] ${

                      msg.senderType === "USER" ? "flex-row-reverse" : "flex-row"

                    }`}

                  >

                    <div className="flex-shrink-0">

                      <div

                        className={`w-8 h-8 rounded-full flex items-center justify-center ${

                          msg.senderType === "USER"

                            ? "bg-[#006994] text-white"

                            : "bg-muted text-muted-foreground"

                        }`}

                      >

                        {msg.senderType === "USER" ? (

                          <User className="w-4 h-4" />

                        ) : (

                          <Shield className="w-4 h-4" />

                        )}

                      </div>

                    </div>

                    <div

                      className={`space-y-1 ${

                        msg.senderType === "USER" ? "text-right" : "text-left"

                      }`}

                    >

                      <div className="flex items-center gap-2 mb-1 justify-inherit">

                        <span className="text-xs font-semibold">

                          {msg.senderType === "USER" ? "You" : "Support Team"}

                        </span>

                        <span className="text-[10px] text-muted-foreground">

                          {new Date(msg.createdAt).toLocaleTimeString([], {

                            hour: "2-digit",

                            minute: "2-digit",

                          })}

                        </span>

                      </div>

                      <div

                        className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${

                          msg.senderType === "USER"

                            ? "bg-[#006994] text-white rounded-tr-none"

                            : "bg-muted text-foreground rounded-tl-none"

                        }`}

                      >

                        {msg.body}

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </CardContent>

            <CardFooter className="border-t p-4">

              <form onSubmit={handleSendReply} className="flex w-full gap-2">

                <Textarea

                  placeholder={

                    ticket.status === "CLOSED"

                      ? "This ticket is closed"

                      : "Type your message..."

                  }

                  value={reply}

                  onChange={(e) => setReply(e.target.value)}

                  className="min-h-[44px] max-h-[120px] resize-none py-3"

                  disabled={ticket.status === "CLOSED" || isSubmitting}

                  onKeyDown={(e) => {

                    if (e.key === "Enter" && !e.shiftKey) {

                      e.preventDefault()

                      handleSendReply(e)

                    }

                  }}

                />

                <Button

                  type="submit"

                  size="icon"

                  className="h-11 w-11 shrink-0"

                  disabled={!reply.trim() || ticket.status === "CLOSED" || isSubmitting}

                >

                  <Send className="w-4 h-4" />

                </Button>

              </form>

            </CardFooter>

          </Card>

        </div>



        <div className="space-y-4">

          <Card>

            <CardHeader>

              <CardTitle className="text-sm font-medium">Ticket Info</CardTitle>

            </CardHeader>

            <CardContent className="text-sm space-y-4">

              <div className="flex justify-between py-1 border-b border-border">

                <span className="text-muted-foreground">Created</span>

                <span className="font-medium">

                  {new Date(ticket.createdAt).toLocaleDateString()}

                </span>

              </div>

              <div className="flex justify-between py-1 border-b border-border">

                <span className="text-muted-foreground">Last Update</span>

                <span className="font-medium">

                  {new Date(ticket.updatedAt).toLocaleTimeString([], {

                    hour: "2-digit",

                    minute: "2-digit",

                    month: "short",

                    day: "numeric",

                  })}

                </span>

              </div>

              <div className="flex justify-between py-1 border-b border-border">

                <span className="text-muted-foreground">Priority</span>

                <span

                  className={`font-medium ${

                    ticket.priority === "URGENT" || ticket.priority === "HIGH"

                      ? "text-destructive"

                      : ""

                  }`}

                >

                  {ticket.priority}

                </span>

              </div>

              <div className="flex justify-between py-1 border-b border-border">

                <span className="text-muted-foreground">Channel</span>

                <span className="font-medium">{ticket.channel}</span>

              </div>

            </CardContent>

          </Card>



          <Card className="bg-[#006994]/5 border-[#006994]/20">

            <CardContent className="p-4 space-y-3">

              <div className="flex items-center gap-2 text-[#006994]">

                <Clock className="w-4 h-4" />

                <span className="text-sm font-semibold">Support Hours</span>

              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">

                Our support team is available 24/7. However, high-priority issues are resolved faster during business hours (8 AM - 6 PM GMT).

              </p>

            </CardContent>

          </Card>

        </div>

      </div>

    </div>

  )

}



function Loader2(props: any) {

  return (

    <svg

      {...props}

      xmlns="http://www.w3.org/2000/svg"

      width="24"

      height="24"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      <path d="M21 12a9 9 0 1 1-6.219-8.56" />

    </svg>

  )

}

