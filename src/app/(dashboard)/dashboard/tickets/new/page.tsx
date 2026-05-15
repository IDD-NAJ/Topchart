"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketCreateForm } from "@/components/dashboard/ticket-create-form"
import { TICKET_CATEGORIES } from "@/lib/actions/tickets"

function NewTicketPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const defaultCategory =
    categoryParam && TICKET_CATEGORIES.includes(categoryParam as (typeof TICKET_CATEGORIES)[number])
      ? categoryParam
      : undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tickets">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Support Ticket</h1>
          <p className="text-sm text-muted-foreground">Describe your issue and we will respond shortly.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket details</CardTitle>
          <CardDescription>All fields are required unless noted.</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketCreateForm
            defaultCategory={defaultCategory}
            showCancel={false}
            onSuccess={(ticketId) => router.push(`/dashboard/tickets/${ticketId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading form…</p>
        </div>
      }
    >
      <NewTicketPageContent />
    </Suspense>
  )
}
