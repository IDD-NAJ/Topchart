"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  Loader2,
  HelpCircle,
  Tag,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Ticket, TicketStatus, TicketPriority, TICKET_CATEGORIES } from "@/lib/actions/tickets"

const STATUS_FILTERS = ["All", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  OPEN: {
    label: "Open",
    icon: <AlertCircle className="w-4 h-4 text-blue-500" />,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  },
  RESOLVED: {
    label: "Resolved",
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400",
  },
  CLOSED: {
    label: "Closed",
    icon: <CheckCircle2 className="w-4 h-4 text-muted-foreground" />,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
}

const PRIORITY_CLASS: Record<string, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-foreground",
  HIGH: "text-orange-600 font-semibold",
  URGENT: "text-red-600 font-semibold",
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "MEDIUM" as TicketPriority,
    category: "General",
  })

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/tickets")
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) setTickets(data.tickets)
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicket.subject || !newTicket.message) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        toast({ title: "Ticket Created", description: "Our support team will get back to you soon." })
        setIsCreateModalOpen(false)
        setNewTicket({ subject: "", message: "", priority: "MEDIUM", category: "General" })
        fetchTickets()
      } else {
        toast({ title: "Error", description: data.error || "Failed to create ticket", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
  }

  const filtered = tickets.filter((t) => {
    const matchSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === "All" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm">Track your support requests and conversations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/dashboard/faq">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </Link>
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateTicket}>
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription>Describe your issue and our team will assist you within 24 hours.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TICKET_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="e.g. Payment not reflecting"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as TicketPriority })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low — general question</SelectItem>
                        <SelectItem value="MEDIUM">Medium — needs attention</SelectItem>
                        <SelectItem value="HIGH">High — affecting my usage</SelectItem>
                        <SelectItem value="URGENT">Urgent — critical issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">Describe your issue</Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide as much detail as possible..."
                      className="min-h-[120px] resize-none"
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : "Submit Ticket"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: <MessageSquare className="w-4 h-4" />, color: "text-foreground" },
          { label: "Open", value: stats.open, icon: <AlertCircle className="w-4 h-4" />, color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, icon: <Clock className="w-4 h-4" />, color: "text-amber-600" },
          { label: "Resolved", value: stats.resolved, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={cn("mb-1", s.color)}>{s.icon}</div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or ticket ID…"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {s === "All" ? "All" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your tickets…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="font-semibold text-base mb-1">
                {searchTerm || statusFilter !== "All" ? "No matching tickets" : "No tickets yet"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Need help? Create a ticket and our team will respond shortly."}
              </p>
              {!searchTerm && statusFilter === "All" && (
                <Button className="mt-4 gap-2" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4" /> Create First Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border -mx-1">
              {filtered.map((ticket) => {
                const cfg = STATUS_CONFIG[ticket.status]
                return (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-center justify-between py-4 px-2 group hover:bg-muted/40 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="hidden sm:flex w-9 h-9 rounded-full bg-muted items-center justify-center shrink-0">
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                            {ticket.subject}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", cfg.badgeClass)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-mono">{ticket.id}</span>
                          {ticket.category && ticket.category !== "General" && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />{ticket.category}
                              </span>
                            </>
                          )}
                          <span>·</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          {(ticket.priority === "HIGH" || ticket.priority === "URGENT") && (
                            <>
                              <span>·</span>
                              <span className={PRIORITY_CLASS[ticket.priority]}>{ticket.priority}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
