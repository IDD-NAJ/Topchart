"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Search,
  MessageSquare,
  Plus,
  Loader2,
  HelpCircle,
  CreditCard,
  Shield,
  Wifi,
  PhoneCall,
  GraduationCap,
  Store,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQ {
  id: string
  question: string
  answer: string
  priority?: number
}

const QUICK_LINKS = [
  {
    icon: CreditCard,
    label: "Payment & Billing",
    description: "Deposits, refunds, and payment issues",
    href: "/dashboard/tickets?new=1&category=Payment%20%26%20Billing",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Shield,
    label: "Account & Security",
    description: "Password, profile, and security settings",
    href: "/dashboard/tickets?new=1&category=Account%20%26%20Security",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  },
  {
    icon: Wifi,
    label: "Data & Airtime",
    description: "Bundle issues, failed purchases",
    href: "/dashboard/tickets?new=1&category=Data%20%26%20Airtime",
    color: "text-green-600 bg-green-50 dark:bg-green-950/30",
  },
  {
    icon: PhoneCall,
    label: "Verification Numbers",
    description: "SMS verification and number issues",
    href: "/dashboard/tickets?new=1&category=Verification%20Numbers",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: GraduationCap,
    label: "Result Checkers",
    description: "WAEC, BECE, and exam card help",
    href: "/dashboard/tickets?new=1&category=Technical%20Issue",
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
  },
  {
    icon: Store,
    label: "Reseller Programme",
    description: "Wholesale, commissions, and tiers",
    href: "/dashboard/tickets?new=1&category=Reseller",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30",
  },
]

export default function DashboardFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/homepage/faqs", { cache: "no-store" })
        const data = await res.json()
        if (data.success) {
          setFaqs(data.faqs || [])
          setError(null)
        } else {
          setError(data.error || "Failed to load FAQs")
        }
      } catch {
        setError("Failed to load FAQs. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return faqs
    const q = search.toLowerCase()
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    )
  }, [faqs, search])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help & FAQ</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Find answers to common questions or open a support ticket.
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" asChild>
          <Link href="/dashboard/tickets?new=1">
            <Plus className="w-4 h-4" />
            Open Ticket
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search frequently asked questions…"
          className="pl-10 h-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Quick links (only shown when not searching) */}
      {!search && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Browse by Topic
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="group hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", link.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
                          {link.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {link.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* FAQ Accordion */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {search ? `Results for "${search}"` : "Frequently Asked Questions"}
          </h2>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading FAQs…</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-16 text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-destructive/30 mb-3" />
              <h3 className="font-semibold mb-1">Could not load FAQs</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="font-semibold mb-1">
                {search ? "No matching questions" : "No FAQs yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[260px] mx-auto mb-4">
                {search
                  ? "Try a different search term, or open a ticket and our team will help."
                  : "Check back soon — our team is adding answers to common questions."}
              </p>
              <Button asChild size="sm" className="gap-2">
                <Link href="/dashboard/tickets?new=1">
                  <MessageSquare className="w-4 h-4" />
                  Open a Ticket
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="divide-y divide-border">
                {filtered.map((faq, idx) => (
                  <AccordionItem
                    key={faq.id}
                    value={`faq-${idx}`}
                    className="px-5 border-none"
                  >
                    <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Still need help CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-0.5">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team is available 24/7. Create a ticket and we'll get back to you within 2–24 hours.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" asChild size="sm">
                <Link href="/dashboard/tickets">
                  View My Tickets
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link href="/dashboard/tickets?new=1">
                  <Plus className="w-4 h-4" />
                  New Ticket
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
