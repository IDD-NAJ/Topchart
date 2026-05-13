"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Send,
  User,
  Shield,
  Clock,
  Loader2,
  XCircle,
  RefreshCw,
  Tag,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Ticket, TicketStatus } from "@/lib/actions/tickets"

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "In-App",
  EMAIL: "Email",
  CHAT: "Live Chat",
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; badgeClass: string }> = {
  OPEN:        { label: "Open",        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400" },
  RESOLVED:    { label: "Resolved",    badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400" },
  CLOSED:      { label: "Closed",      badgeClass: "bg-muted text-muted-foreground border-border" },
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isActioning, setIsActioning] = useState(false)
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/dashboard/tickets/${params.id}`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setTicket(data.ticket)
      } else {
        toast({ title: "Error", description: data.error || "Failed to load ticket", variant: "destructive" })
        router.push("/dashboard/tickets")
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTicket() }, [params.id])

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
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setReply("")
        fetchTicket()
      } else {
        toast({ title: "Error", description: data.error || "Failed to send message", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTicketAction = async (action: "close" | "reopen") => {
    setIsActioning(true)
    try {
      const res = await fetch(`/api/dashboard/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        toast({
          title: action === "close" ? "Ticket Closed" : "Ticket Reopened",
          description: action === "close" ? "Your ticket has been closed." : "Your ticket is open again.",
        })
        fetchTicket()
      }
    } catch {
      toast({ title: "Error", description: "Failed to update ticket status", variant: "destructive" })
    } finally {
      setIsActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading ticket…</p>
      </div>
    )
  }

  if (!ticket) return null

  const cfg = STATUS_CONFIG[ticket.status]
  const isClosed = ticket.status === "CLOSED"

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Back + Title */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0 mt-0.5">
          <Link href="/dashboard/tickets"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{ticket.subject}</h1>
            <Badge variant="outline" className={cn("text-xs h-5 px-2", cfg.badgeClass)}>{cfg.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">{ticket.id}</span>
            {ticket.category && (
              <><span>·</span><span className="flex items-center gap-1"><Tag className="w-3 h-3" />{ticket.category}</span></>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col" style={{ height: "560px" }}>
            <CardHeader className="border-b py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-medium">Conversation</CardTitle>
            </CardHeader>
            <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth min-h-0">
              {(!ticket.messages || ticket.messages.length === 0) ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No messages yet.</div>
              ) : ticket.messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.senderType === "USER" ? "justify-end" : "justify-start")}>
                  <div className={cn("flex gap-2.5 max-w-[85%]", msg.senderType === "USER" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.senderType === "USER" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {msg.senderType === "USER" ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div className={cn("space-y-1", msg.senderType === "USER" ? "items-end" : "items-start", "flex flex-col")}>
                      <div className={cn("flex items-center gap-2", msg.senderType === "USER" ? "flex-row-reverse" : "flex-row")}>
                        <span className="text-xs font-semibold">
                          {msg.senderType === "USER" ? "You" : "Support Team"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                        msg.senderType === "USER"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                      )}>
                        {msg.body}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t p-3 shrink-0">
              {isClosed ? (
                <div className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4" />
                  This ticket is closed.
                  <button onClick={() => handleTicketAction("reopen")} className="text-primary underline underline-offset-2 hover:no-underline text-xs ml-1">
                    Reopen it
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex w-full gap-2">
                  <Textarea
                    placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="min-h-[44px] max-h-[120px] resize-none py-3 text-sm"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply(e as any)
                      }
                    }}
                  />
                  <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!reply.trim() || isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {[
                { label: "Status", value: cfg.label },
                { label: "Priority", value: { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" }[ticket.priority] ?? ticket.priority, className: ticket.priority === "URGENT" ? "text-red-600 font-semibold" : ticket.priority === "HIGH" ? "text-orange-600 font-semibold" : "" },
                { label: "Category", value: ticket.category || "General" },
                { label: "Channel", value: CHANNEL_LABELS[ticket.channel] ?? ticket.channel },
                { label: "Created", value: new Date(ticket.createdAt).toLocaleDateString() },
                { label: "Updated", value: new Date(ticket.updatedAt).toLocaleDateString() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={cn("font-medium text-right", row.className)}>{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action */}
          {!isClosed ? (
            <Button
              variant="outline"
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              onClick={() => handleTicketAction("close")}
              disabled={isActioning}
            >
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Close Ticket
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleTicketAction("reopen")}
              disabled={isActioning}
            >
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reopen Ticket
            </Button>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Response Time</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We respond within 2–24 hours. High and Urgent priority tickets are handled first during business hours (8 AM – 6 PM GMT).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
