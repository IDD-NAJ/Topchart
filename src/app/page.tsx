"use client"



import Link from "next/link"

import Image from "next/image"

import { Header } from "@/components/header"

import { Footer } from "@/components/footer"

import { Button } from "@/components/ui/button"

import {

  Accordion,

  AccordionContent,

  AccordionItem,

  AccordionTrigger,

} from "@/components/ui/accordion"

import {

  ArrowRight,

  CheckCircle2,

  Phone,

  Wifi,

  PhoneCall,

  Store,

  GraduationCap,

  ChevronRight,

} from "lucide-react"

import { motion } from "framer-motion"

import { ScrollReveal, StaggerReveal, StaggerRevealItem, PageTransition } from "@/components/animations"



const SERVICES = [

  {

    icon: Phone,

    title: "Airtime Top-Up",

    description: "Instant airtime for MTN, Telecel, and AirtelTigo. Credits within seconds.",

    href: "/dashboard/airtime",

    label: "Top up now",

  },

  {

    icon: Wifi,

    title: "Data Bundles",

    description: "Affordable daily, weekly and monthly data packages for every network.",

    href: "/dashboard/data",

    label: "Browse bundles",

  },

  {

    icon: PhoneCall,

    title: "Verification Numbers",

    description: "Temporary virtual phone numbers for OTP verification on any platform.",

    href: "/dashboard/verification",

    label: "Get a number",

  },

  {

    icon: GraduationCap,

    title: "Result Checkers",

    description: "Access WAEC, BECE, and NOVDEC results instantly with your index number.",

    href: "/dashboard/result-checkers",

    label: "Check results",

  },

  {

    icon: Store,

    title: "Reseller Program",

    description: "Earn recurring commissions reselling our services under your own brand.",

    href: "/dashboard/reseller",

    label: "Become a reseller",

  },

]



const STATS = [

  { value: "2M+", label: "Transactions Processed" },

  { value: "500K+", label: "Registered Users" },

  { value: "99.9%", label: "Platform Uptime" },

  { value: "5", label: "Core Services" },

]



const STEPS = [

  { step: "01", title: "Create Account", body: "Sign up free in under 60 seconds with your email and phone number." },

  { step: "02", title: "Fund Your Wallet", body: "Add funds via Mobile Money, Visa, or Mastercard securely through Paystack." },

  { step: "03", title: "Use Any Service", body: "Buy airtime, data, verification numbers, result checkers, or join the reseller programme." },

]



const FAQS = [

  {

    q: "How fast is airtime and data delivery?",

    a: "Most orders complete within 5 seconds. In rare cases of network congestion it may take up to 2 minutes.",

  },

  {

    q: "What payment methods are supported?",

    a: "MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, Mastercard, and wallet balance.",

  },

  {

    q: "How do verification numbers work?",

    a: "You rent a temporary Ghanaian or international number. Any OTP SMS sent to it appears in your dashboard in real time.",

  },

  {

    q: "Can I resell Topchart services?",

    a: "Yes. Our Reseller Programme gives you a branded storefront, commission on every transaction, and dedicated support.",

  },

  {

    q: "What happens if a transaction fails?",

    a: "Your wallet is refunded automatically within seconds. You can also raise a dispute from the dashboard.",

  },

  {

    q: "Which exam results can I check?",

    a: "WAEC WASSCE, BECE, NOVDEC, and selected university admission results.",

  },

]



export default function HomePage() {

  return (

    <PageTransition className="min-h-screen flex flex-col bg-[#F5F4F1]">

      <Header />



      <main className="flex-1">



        {/* ── HERO ── */}

        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0B1F3A]">

          {/* Pexels background */}

          <Image

            src="https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=1600"

            alt=""

            fill

            priority

            className="object-cover opacity-20"

            sizes="100vw"

          />

          {/* grid overlay */}

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px]" />

          {/* bottom fade */}

          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#F5F4F1] to-transparent" />



          <div className="relative z-10 container mx-auto px-4 pt-32 pb-24">

            <div className="max-w-4xl mx-auto text-center">

              <motion.div

                initial={{ opacity: 0, scale: 0.9 }}

                animate={{ opacity: 1, scale: 1 }}

                transition={{ duration: 0.5 }}

                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/8 text-white/70 text-xs font-semibold uppercase tracking-widest mb-8"

              >

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                All systems operational · 99.9% uptime

              </motion.div>



              <motion.h1

                initial={{ opacity: 0, y: 24 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}

                className="font-heading text-5xl sm:text-6xl lg:text-7xl font-normal text-white leading-[1.02] tracking-tight text-balance"

              >

                Ghana&apos;s Complete<br className="hidden md:block" />{" "}

                <span className="text-[#7EB8D4]">Digital Services</span> Platform

              </motion.h1>



              <motion.p

                initial={{ opacity: 0, y: 24 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}

                className="mt-7 text-lg text-white/55 leading-relaxed max-w-2xl mx-auto font-body"

              >

                Airtime, data bundles, verification numbers, exam results, and a full reseller programme — all in one secure platform.

              </motion.p>



              <motion.div

                initial={{ opacity: 0, y: 24 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}

                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"

              >

                <Button asChild size="lg"

                  className="h-13 px-9 text-base rounded-xl bg-white text-[#0B1F3A] hover:bg-[#EFF6FA] font-semibold shadow-lg transition-all duration-200 active:scale-[0.98]">

                  <Link href="/register">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>

                </Button>

                <Button asChild size="lg" variant="ghost"

                  className="h-13 px-9 text-base rounded-xl border border-white/20 text-white hover:bg-white/8 font-medium transition-all duration-200">

                  <Link href="/login">Sign in to dashboard</Link>

                </Button>

              </motion.div>

            </div>



            {/* Network badges */}

            <motion.div

              initial={{ opacity: 0, y: 32 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.7, delay: 0.5 }}

              className="mt-20 flex flex-wrap items-center justify-center gap-6"

            >

              {[

                { label: "MTN", color: "#FFCC00", text: "#000" },

                { label: "Telecel", color: "#E40046", text: "#fff" },

                { label: "AirtelTigo", color: "#E60000", text: "#fff" },

              ].map((n) => (

                <div key={n.label} className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/8 border border-white/12 backdrop-blur-sm">

                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: n.color }} />

                  <span className="text-xs font-bold text-white/80 tracking-wider">{n.label}</span>

                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">Live</span>

                </div>

              ))}

            </motion.div>

          </div>

        </section>



        {/* ── SERVICES GRID ── */}

        <section id="services" className="py-28 bg-[#F5F4F1]">

          <div className="container mx-auto px-4">

            <ScrollReveal className="text-center mb-16">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#006994] mb-4">What we offer</p>

              <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight text-balance">

                Five services, one platform

              </h2>

            </ScrollReveal>



            <StaggerReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {SERVICES.map((s) => (

                <StaggerRevealItem key={s.title}>

                  <Link href={s.href}

                    className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-[#E2E1DC] hover:border-[#006994]/30 hover:shadow-lg hover:shadow-[#006994]/6 transition-all duration-300">

                    <div className="mb-5 w-11 h-11 rounded-xl bg-[#EFF6FA] flex items-center justify-center text-[#006994] group-hover:bg-[#006994] group-hover:text-white transition-all duration-300">

                      <s.icon className="h-5 w-5" />

                    </div>

                    <h3 className="font-heading text-xl font-normal text-[#0B1F3A] mb-2">{s.title}</h3>

                    <p className="text-sm text-[#6B7280] leading-relaxed mb-6 flex-1">{s.description}</p>

                    <span className="inline-flex items-center text-xs font-semibold text-[#006994] group-hover:gap-2 gap-1.5 transition-all duration-200">

                      {s.label} <ChevronRight className="h-3.5 w-3.5" />

                    </span>

                  </Link>

                </StaggerRevealItem>

              ))}

            </StaggerReveal>

          </div>

        </section>



        {/* ── HOW IT WORKS ── */}

        <section className="py-28 bg-white border-y border-[#E2E1DC]">

          <div className="container mx-auto px-4">

            <ScrollReveal className="text-center mb-16">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#722F37] mb-4">Simple by design</p>

              <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight">

                Up and running in 3 steps

              </h2>

            </ScrollReveal>



            <StaggerReveal className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">

              {STEPS.map((s, i) => (

                <StaggerRevealItem key={s.step}>

                  <div className="flex flex-col items-start">

                    <span className="font-heading text-6xl font-normal text-[#0B1F3A]/8 mb-4 leading-none">{s.step}</span>

                    <div className="w-8 h-0.5 bg-[#006994] mb-5" />

                    <h3 className="font-heading text-xl font-normal text-[#0B1F3A] mb-3">{s.title}</h3>

                    <p className="text-sm text-[#6B7280] leading-relaxed">{s.body}</p>

                  </div>

                </StaggerRevealItem>

              ))}

            </StaggerReveal>

          </div>

        </section>



        {/* ── STATS ── */}

        <section className="py-24 bg-[#0B1F3A] relative overflow-hidden">

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div className="container mx-auto px-4 relative z-10">

            <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">

              {STATS.map((s) => (

                <StaggerRevealItem key={s.label}>

                  <div className="text-center px-1">

                    <p className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-2 tracking-tight">{s.value}</p>

                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider md:tracking-widest text-white/40 leading-snug">{s.label}</p>

                  </div>

                </StaggerRevealItem>

              ))}

            </StaggerReveal>

          </div>

        </section>



        {/* ── PEXELS FEATURE IMAGE ── */}

        <section className="py-28 bg-[#F5F4F1]">

          <div className="container mx-auto px-4">

            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

              <ScrollReveal>

                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#006994] mb-4">Why Topchart</p>

                <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight mb-8 text-balance">

                  Built for Ghana. <br />Trusted by thousands.

                </h2>

                <ul className="space-y-5">

                  {[

                    "Bank-grade encryption on every transaction",

                    "PCI DSS Level 1 compliant payment processing",

                    "Instant delivery — average 3 seconds",

                    "24 / 7 support via live chat and tickets",

                    "Wallet, Mobile Money, and card payments accepted",

                  ].map((item) => (

                    <li key={item} className="flex items-start gap-3 text-sm text-[#374151]">

                      <CheckCircle2 className="h-4 w-4 text-[#006994] shrink-0 mt-0.5" />

                      {item}

                    </li>

                  ))}

                </ul>

                <div className="mt-10">

                  <Button asChild size="lg"

                    className="h-12 px-8 rounded-xl bg-[#0B1F3A] text-white hover:bg-[#1C3558] font-semibold transition-all duration-200">

                    <Link href="/register">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>

                  </Button>

                </div>

              </ScrollReveal>



              <ScrollReveal className="relative">

                <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-[#0B1F3A]/15">

                  <Image

                    src="https://images.pexels.com/photos/5926393/pexels-photo-5926393.jpeg?auto=compress&cs=tinysrgb&w=900"

                    alt="Mobile fintech in Ghana"

                    fill

                    className="object-cover"

                    sizes="(max-width: 1024px) 100vw, 50vw"

                  />

                </div>

                <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl border border-[#E2E1DC] shadow-lg px-5 py-4">

                  <p className="text-2xl font-heading text-[#0B1F3A] mb-0.5">99.9%</p>

                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Platform Uptime</p>

                </div>

              </ScrollReveal>

            </div>

          </div>

        </section>



        {/* ── FAQ ── */}

        <section id="faq" className="py-28 bg-white border-t border-[#E2E1DC]">

          <div className="container mx-auto px-4 max-w-3xl">

            <ScrollReveal className="text-center mb-16">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#722F37] mb-4">FAQ</p>

              <h2 className="font-heading text-4xl lg:text-5xl font-normal text-[#0B1F3A] tracking-tight">

                Common questions

              </h2>

            </ScrollReveal>



            <StaggerReveal>

              <Accordion type="single" collapsible className="space-y-3">

                {FAQS.map((faq, i) => (

                  <StaggerRevealItem key={i}>

                    <AccordionItem

                      value={`faq-${i}`}

                      className="border border-[#E2E1DC] rounded-2xl px-6 bg-[#F5F4F1]/60 data-[state=open]:bg-white data-[state=open]:border-[#006994]/25 transition-all duration-300"

                    >

                      <AccordionTrigger className="hover:no-underline py-5 text-left">

                        <span className="font-heading text-base font-normal text-[#0B1F3A] pr-4">{faq.q}</span>

                      </AccordionTrigger>

                      <AccordionContent className="text-sm text-[#6B7280] leading-relaxed pb-5 font-body">

                        {faq.a}

                      </AccordionContent>

                    </AccordionItem>

                  </StaggerRevealItem>

                ))}

              </Accordion>

            </StaggerReveal>

          </div>

        </section>



        {/* ── CTA ── */}

        <section className="py-28 bg-[#F5F4F1]">

          <div className="container mx-auto px-4">

            <ScrollReveal>

              <div className="relative rounded-3xl overflow-hidden bg-[#0B1F3A] px-8 py-20 text-center md:px-20">

                <Image

                  src="https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1600"

                  alt=""

                  fill

                  className="object-cover opacity-10"

                  sizes="100vw"

                />

                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

                <div className="relative z-10 max-w-2xl mx-auto">

                  <motion.h2

                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}

                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}

                    className="font-heading text-4xl sm:text-5xl font-normal text-white tracking-tight mb-6 text-balance"

                  >

                    Start using Topchart today — it&apos;s free

                  </motion.h2>

                  <motion.p

                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}

                    transition={{ duration: 0.6, delay: 0.1 }}

                    className="text-white/50 text-base mb-10 leading-relaxed font-body"

                  >

                    Join 500,000+ Ghanaians already using our platform. No subscription fees — pay only for what you use.

                  </motion.p>

                  <motion.div

                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}

                    transition={{ duration: 0.6, delay: 0.2 }}

                    className="flex flex-col sm:flex-row items-center justify-center gap-4"

                  >

                    <Button asChild size="lg"

                      className="h-12 px-8 w-full sm:w-auto rounded-xl bg-white text-[#0B1F3A] hover:bg-[#EFF6FA] font-semibold transition-all duration-200 active:scale-[0.98]">

                      <Link href="/register">Create free account</Link>

                    </Button>

                    <Button asChild size="lg" variant="ghost"

                      className="h-12 px-8 w-full sm:w-auto rounded-xl border border-white/20 text-white hover:bg-white/8 font-medium transition-all duration-200">

                      <Link href="/login">Sign in</Link>

                    </Button>

                  </motion.div>

                </div>

              </div>

            </ScrollReveal>

          </div>

        </section>



      </main>



      <Footer />

    </PageTransition>

  )

}

