"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TICKET_CATEGORIES, type TicketPriority } from "@/lib/actions/tickets"

type TicketCreateFormProps = {
  defaultCategory?: string
  onSuccess: (ticketId: string) => void
  onCancel?: () => void
  submitLabel?: string
  showCancel?: boolean
}

function resolveCategory(category?: string) {
  if (!category) return "General"
  return TICKET_CATEGORIES.includes(category as (typeof TICKET_CATEGORIES)[number])
    ? category
    : "General"
}

export function TicketCreateForm({
  defaultCategory,
  onSuccess,
  onCancel,
  submitLabel = "Submit Ticket",
  showCancel = true,
}: TicketCreateFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "MEDIUM" as TicketPriority,
    category: resolveCategory(defaultCategory),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.status === 401) {
        toast({
          title: "Sign in required",
          description: "Please sign in to create a support ticket.",
          variant: "destructive",
        })
        const next = encodeURIComponent("/dashboard/tickets?new=1")
        window.location.href = `/login?next=${next}`
        return
      }

      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()

      if (data.success) {
        toast({ title: "Ticket Created", description: "Our support team will get back to you soon." })
        onSuccess(data.id)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create ticket",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="ticket-category">Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm({ ...form, category: v })}
        >
          <SelectTrigger id="ticket-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {TICKET_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ticket-subject">Subject</Label>
        <Input
          id="ticket-subject"
          placeholder="e.g. Payment not reflecting"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ticket-priority">Priority</Label>
        <Select
          value={form.priority}
          onValueChange={(v) => setForm({ ...form, priority: v as TicketPriority })}
        >
          <SelectTrigger id="ticket-priority">
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
        <Label htmlFor="ticket-message">Describe your issue</Label>
        <Textarea
          id="ticket-message"
          placeholder="Please provide as much detail as possible..."
          className="min-h-[120px] resize-none"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
