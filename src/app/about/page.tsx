"use client"

import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { PageTransition, ScrollReveal, StaggerReveal, StaggerRevealItem } from "@/components/animations"

const VALUES = [
  {
    title: "Speed",
    body: "We obsess over latency. Every millisecond matters — airtime, data, or results delivered in seconds.",
  },
  {
    title: "Security",
    body: "Bank-grade encryption and PCI DSS Level 1 compliance on every transaction.",
  },
  {
    title: "Reliability",
    body: "99.9% uptime SLA. Our infrastructure is built to be always-on.",
  },
  {
    title: "Precision",
    body: "Every cedi, every megabyte, every OTP — accounted for and verified.",
  },
  {
    title: "Transparency",
    body: "No hidden fees. No surprise charges. What you see is exactly what you pay.",
  },
  {
    title: "Accessibility",
    body: "A platform designed for everyone — from individuals to large-scale resellers.",
  },
]

const SERVICES_OFFERED = [
  "Airtime top-up for MTN, Telecel, and AirtelTigo",
  "Daily, weekly, and monthly data bundles",
  "Temporary verification numbers for OTP services",
  "WAEC, BECE, and NOVDEC result checkers",
  "Full reseller programme with commission earnings",
  "Wallet funding via Mobile Money and cards",
]

export default function AboutPage() {
  return (
    <PageTransition className="min-h-screen flex flex-col bg-[#F5F4F1]">
      <Header />

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative pt-40 pb-28 overflow-hidden bg-[#0B1F3A]">
          <Image
            src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            fill
            priority
            className="object-cover opacity-15"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F5F4F1] to-transparent" />

          <div className="relative z-10 container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/8 text-white/60 text-xs font-semibold uppercase tracking-widest mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7EB8D4]" />
              Est. 2023 · Accra, Ghana
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-normal text-white leading-[1.05] tracking-tight max-w-3xl mx-auto text-balance"
            >
              Building Ghana&apos;s digital infrastructure
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-lg text-white/50 leading-relaxed max-w-2xl mx-auto font-body"
            >
              Topchart is on a mission to make every digital service in Ghana instant, affordable, and accessible to everyone.
            </motion.p>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="py-20 bg-white border-b border-[#E2E1DC]">
          <div className="container mx-auto px-4">
            <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-4xl mx-auto">
              {[
                { value: "500K+", label: "Registered Users" },
                { value: "2M+", label: "Transactions" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "5", label: "Core Services" },
              ].map((s) => (
                <StaggerRevealItem key={s.label}>
                  <div className="text-center">
                    <p className="font-heading text-4xl font-normal text-[#0B1F3A] mb-1">{s.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">{s.label}</p>
                  </div>
                </StaggerRevealItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* ── MISSION ── */}
        <section className="py-28 bg-[#F5F4F1]">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <ScrollReveal>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#722F37] mb-4">Our Mission</p>
                <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight mb-8 text-balance">
                  Eliminating friction in digital services across Ghana.
                </h2>
                <p className="text-base text-[#6B7280] leading-relaxed mb-8 font-body">
                  We believe digital services should work for everyone — from a student checking exam results to a business owner reselling airtime. Topchart builds infrastructure that is fast, transparent, and always available.
                </p>
                <ul className="space-y-4">
                  {SERVICES_OFFERED.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#374151]">
                      <CheckCircle2 className="h-4 w-4 text-[#006994] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>

              <ScrollReveal className="relative">
                <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-[#0B1F3A]/12">
                  <Image
                    src="https://images.pexels.com/photos/5926393/pexels-photo-5926393.jpeg?auto=compress&cs=tinysrgb&w=900"
                    alt="Team working on fintech platform"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="py-28 bg-white border-y border-[#E2E1DC]">
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#006994] mb-4">What drives us</p>
              <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight">
                Our core values
              </h2>
            </ScrollReveal>

            <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {VALUES.map((v) => (
                <StaggerRevealItem key={v.title}>
                  <div className="p-7 rounded-2xl bg-[#F5F4F1] border border-[#E2E1DC] hover:border-[#006994]/25 hover:bg-white transition-all duration-300">
                    <div className="w-8 h-0.5 bg-[#006994] mb-5" />
                    <h3 className="font-heading text-xl font-normal text-[#0B1F3A] mb-3">{v.title}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed font-body">{v.body}</p>
                  </div>
                </StaggerRevealItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* ── TEAM ── */}
        <section className="py-28 bg-[#F5F4F1]">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <ScrollReveal className="relative order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-[#0B1F3A]/12">
                  <Image
                    src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=900"
                    alt="Team collaboration"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </ScrollReveal>

              <ScrollReveal className="order-1 lg:order-2">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#722F37] mb-4">Our Team</p>
                <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight mb-8 text-balance">
                  Built by Ghanaians, for Ghana.
                </h2>
                <p className="text-base text-[#6B7280] leading-relaxed mb-8 font-body">
                  Our team spans engineering, product, design, and support — united by a shared belief that technology should remove barriers, not create them.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { role: "Engineering", count: "6+" },
                    { role: "Design", count: "2+" },
                    { role: "Operations", count: "3+" },
                    { role: "Support", count: "4+" },
                  ].map((d) => (
                    <div key={d.role} className="p-5 rounded-xl bg-white border border-[#E2E1DC]">
                      <p className="font-heading text-3xl font-normal text-[#0B1F3A] mb-1">{d.count}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{d.role}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 bg-[#0B1F3A] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative z-10 container mx-auto px-4 text-center">
            <ScrollReveal>
              <h2 className="font-heading text-4xl lg:text-5xl font-normal text-white tracking-tight mb-6 text-balance max-w-2xl mx-auto">
                Ready to experience Topchart?
              </h2>
              <p className="text-base text-white/45 mb-10 max-w-xl mx-auto font-body leading-relaxed">
                Join 500,000+ Ghanaians using our platform. Free to sign up, no subscription fees.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg"
                  className="h-12 px-8 rounded-xl bg-white text-[#0B1F3A] hover:bg-[#EFF6FA] font-semibold transition-all duration-200 active:scale-[0.98]">
                  <Link href="/register">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="ghost"
                  className="h-12 px-8 rounded-xl border border-white/20 text-white hover:bg-white/8 font-medium transition-all duration-200">
                  <Link href="/faq">Read our FAQ</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>

      <Footer />
    </PageTransition>
  )
}
