"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { PageTransition, StaggerReveal, StaggerRevealItem } from "@/components/animations"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroMedia, setHeroMedia] = useState<{ type: "image" | "video"; url: string }>({
    type: "image",
    url: "/images/topchart-way.jpg",
  })

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const res = await fetch("/api/content/faqs", { cache: "no-store" })
        
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`)
        }
        
        const data = await res.json()

        if (data.success) {
          setFaqs(data.faqs)
        } else {
          setError(data.error || "Failed to load FAQs")
        }
      } catch (err) {
        console.error("Failed to load FAQs:", err)
        setError("Failed to load FAQs. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadFAQs()
  }, [])

  useEffect(() => {
    let active = true

    const loadHeroMedia = async () => {
      try {
        const response = await fetch("/api/media?section=hero&slot_key=faq_hero_background", { cache: "no-store" })
        const payload = await response.json()
        const item = Array.isArray(payload?.media) ? payload.media[0] : null
        if (!active || !payload?.success || !item) return

        const type = item.media_type || item.asset_type
        const url = item.file_url || item.public_url
        if (url && (type === "image" || type === "video")) {
          setHeroMedia({ type, url })
        }
      } catch {}
    }

    loadHeroMedia()
    return () => {
      active = false
    }
  }, [])

  return (
    <PageTransition className="flex min-h-screen flex-col bg-[color:var(--marketing-cream)]">
      <Header />

      {/* ── PAGE HERO ── */}
      <section className="relative overflow-hidden bg-[color:var(--marketing-hero-dark)] pb-20 pt-[calc(72px+3rem)] sm:pt-[calc(72px+4rem)]">
        {heroMedia.type === "video" ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            onError={() => setHeroMedia({ type: "image", url: "/images/topchart-way.jpg" })}
          >
            <source src={heroMedia.url} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 h-full w-full object-cover opacity-20 bg-center bg-cover"
            style={{ backgroundImage: `url('${heroMedia.url}')` }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[color:var(--marketing-cream)] to-transparent" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/8 text-white/60 text-xs font-semibold uppercase tracking-widest mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--marketing-accent)]" /> Help Centre
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-5xl sm:text-6xl font-normal text-white leading-tight tracking-tight"
          >
            Frequently asked questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-base text-white/45 max-w-xl mx-auto font-body"
          >
            Everything you need to know about Topchart&apos;s services.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {['Airtime & Data', 'Verification', 'Result Checkers', 'Reseller', 'Payments', 'Security'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-white/15 text-white/50">
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-[color:var(--marketing-accent)]" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-[#6B7280] text-sm">{error}</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-20 text-[#6B7280] text-sm">No FAQs available at the moment.</div>
          ) : (
            <StaggerReveal className="space-y-3">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <StaggerRevealItem key={faq.id}>
                    <AccordionItem
                      value={`item-${index}`}
                      className="rounded-2xl border border-neutral-200 bg-white px-6 transition-all duration-300 data-[state=open]:border-[color:var(--marketing-accent)]/30 data-[state=open]:bg-white overflow-hidden"
                    >
                      <AccordionTrigger className="hover:no-underline py-5 text-left transition-colors hover:text-primary">
                        <span className="font-heading pr-4 text-base font-normal text-neutral-900">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-[#6B7280] leading-relaxed pb-5 font-body">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </StaggerRevealItem>
                ))}
              </Accordion>
            </StaggerReveal>
          )}

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 rounded-2xl bg-[color:var(--marketing-hero-dark)] p-8 text-center"
          >
            <MessageSquare className="mx-auto mb-4 h-8 w-8 text-[color:var(--marketing-accent)]" />
            <h3 className="font-heading text-xl font-normal text-white mb-2">Still have questions?</h3>
            <p className="text-sm text-white/45 mb-6 font-body">
              Our support team is available 24/7 to help with anything.
            </p>
            <Button
              asChild
              className="h-10 rounded-xl bg-white px-6 font-semibold text-neutral-900 transition-all duration-200 hover:bg-[color:var(--marketing-cream-alt)]"
            >
              <Link href="/dashboard/tickets">Open a support ticket</Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
