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
import { HelpCircle, MessageSquare, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { PageTransition, ScrollReveal } from "@/components/animations"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: "easeOut" as const }
}

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  viewport: { once: true, amount: 0.2 }
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const res = await fetch("/api/content/faqs", { cache: "no-store" })
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

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background selection:bg-[#006994]/15 selection:text-foreground">
      <Header />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h1 className="font-heading text-4xl font-normal tracking-tight text-foreground sm:text-5xl mb-4">
                Frequently Asked <span className="bg-gradient-to-r from-[#722F37] to-[#9B4450] bg-clip-text text-transparent">Questions</span>
              </h1>
              <p className="text-xl text-muted-foreground font-body leading-relaxed">
                Everything you need to know about Topchart&apos;s services and features.
              </p>
            </motion.div>

            {/* Search Hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <Card className="border-[#006994]/20 bg-[#EFF6FA]/50 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#006994]/10 text-[#006994] flex items-center justify-center flex-shrink-0">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-normal mb-2">Can&apos;t find what you&apos;re looking for?</h3>
                      <p className="text-sm text-muted-foreground font-body mb-4">
                        Browse through our FAQ categories below or reach out to our support team for personalized assistance.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Delivery', 'Payments', 'Security', 'Refunds'].map((tag) => (
                          <span key={tag} className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#006994]/10 text-[#006994]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20 text-muted-foreground">{error}</div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No FAQs available at the moment.
              </div>
            ) : (
              /* FAQ Accordion */
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, amount: 0.1 }}
                className="space-y-4"
              >
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, index) => (
                    <motion.div key={faq.id} variants={fadeInUp}>
                      <AccordionItem 
                        value={`item-${index}`}
                        className="group border border-[#006994]/15 bg-background/50 backdrop-blur-sm rounded-2xl px-6 transition-all duration-300 hover:border-[#006994]/30 hover:bg-[#EFF6FA]/50 data-[state=open]:border-[#722F37]/40 data-[state=open]:bg-[#FDF2F3]/30"
                        style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
                      >
                        <AccordionTrigger className="hover:no-underline py-6">
                          <div className="flex items-center gap-4 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#006994]/10 text-[#006994] group-data-[state=open]:bg-[#722F37] group-data-[state=open]:text-white transition-colors duration-300">
                              <HelpCircle className="h-5 w-5" />
                            </div>
                            <span className="font-heading text-lg font-normal text-foreground">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-6 pl-14 font-body">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </motion.div>
            )}

            {/* Contact CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16 text-center"
            >
              <div className="p-8 rounded-2xl bg-muted/30 border border-border/50">
                <MessageSquare className="h-10 w-10 text-[#006994] mx-auto mb-4" />
                <h3 className="font-heading text-xl font-normal mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-6 font-body">
                  Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
                </p>
                <Button asChild className="bg-gradient-to-r from-[#006994] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#006994] rounded-xl transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                  <Link href="/dashboard/tickets">
                    Contact Support
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
