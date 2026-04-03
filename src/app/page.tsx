"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Zap, 
  Shield, 
  Clock, 
  CreditCard, 
  ArrowRight,
  Star,
  HelpCircle,
} from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Get your airtime and data credited within seconds of payment confirmation.",
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "Bank-grade encryption protects all your transactions and personal data.",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Buy airtime and data anytime, anywhere. We never close.",
  },
  {
    icon: CreditCard,
    title: "Multiple Payment Options",
    description: "Pay with Mobile Money, cards, or your wallet balance.",
  },
]

const stats = [
  { value: "2M+", label: "Transactions" },
  { value: "500K+", label: "Happy Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9", label: "App Rating", icon: Star },
]

const faqs = [
  {
    question: "How fast is the delivery?",
    answer: "Most transactions are completed within 5 seconds. In rare cases of network delays, it may take up to 5 minutes.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), debit cards (Mastercard, Visa), and wallet balance.",
  },
  {
    question: "Is my payment information secure?",
    answer: "Yes! We use bank-grade encryption and are PCI DSS compliant. We never store your card details.",
  },
  {
    question: "Can I get a refund?",
    answer: "If a transaction fails, your money is automatically refunded to your wallet within minutes.",
  },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: "easeOut" as any }
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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary-accent/20 selection:text-foreground">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-16 md:pt-40 md:pb-28 bg-gradient-hero">
          {/* Background Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8B735508_1px,transparent_1px),linear-gradient(to_bottom,#8B735508_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,115,85,0.08)_0%,transparent_50%)]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
              <div className="mx-auto max-w-5xl text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-accent/10 border border-primary-accent/20 text-primary-accent text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  System Status: Nominal • 99.9% Uptime
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="font-heading text-5xl font-normal tracking-tight text-foreground sm:text-7xl lg:text-8xl text-balance leading-[0.95] lg:tracking-[-0.04em]"
                >
                The Infrastructure for <br className="hidden md:block" />
                <span className="text-primary-accent">Instant Logistics</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-balance font-body"
              >
                Top-tier connectivity for the digital economy. Powering airtime, data, and utility payments across Ghana with millisecond latency and bank-grade security.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              >
                <Button
                  size="lg"
                  asChild
                  className="w-full sm:w-auto h-14 px-10 text-lg bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] rounded-xl font-medium"
                >
                  <Link href="/register">
                    Deploy Instant Credit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-14 px-10 text-lg bg-background/50 backdrop-blur-sm transition-all duration-300 active:scale-[0.98] rounded-xl border-border hover:bg-muted font-medium">
                  <Link href="/login">View Console</Link>
                </Button>
              </motion.div>
            </div>

            {/* Trusted Networks - Redesigned */}
            <motion.div 
              id="networks"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-20 max-w-4xl mx-auto scroll-mt-28"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-2xl" />
                <div className="relative flex flex-col items-center p-8 rounded-[2.5rem] border border-border/40 bg-background/40 backdrop-blur-[2px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-10">
                    Network Connectivity Matrix
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
                    {[
                      { name: "MTN", bgColor: "#FFC107", textColor: "#000", status: "Live" },
                      { name: "Telecel", bgColor: "#E40046", textColor: "#fff", status: "Live" },
                      { name: "AirtelTigo", bgColor: "#E60000", textColor: "#fff", status: "Live" }
                    ].map((network) => (
                      <div key={network.name} className="flex flex-col items-center gap-3 group/item">
                        <div className="relative">
                          <div 
                            className="h-16 w-16 rounded-full shadow-xl transition-all duration-500 group-hover/item:scale-110 flex items-center justify-center border-2 border-white/20"
                            style={{ 
                              backgroundColor: network.bgColor,
                              boxShadow: `0 12px 40px -8px ${network.bgColor}60`
                            }}
                          >
                            <span className="font-bold text-xs uppercase tracking-tight" style={{ color: network.textColor }}>
                              {network.name === "MTN" ? "MTN" : network.name === "Telecel" ? "t" : "AT"}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm animate-pulse" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-foreground tracking-tight text-sm">{network.name}</span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            {network.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-muted/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              {...fadeInUp}
              className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16"
            >
              <div className="max-w-2xl">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-accent mb-3 font-body">Core Platform</h2>
                <h3 className="font-heading text-3xl font-normal text-foreground sm:text-4xl lg:text-5xl tracking-tight">
                  Built for speed. <br />
                  Designed for reliability.
                </h3>
              </div>
              <p className="text-muted-foreground max-w-sm">
                We've built the ultimate top-up experience so you can focus on what matters most.
              </p>
            </motion.div>
            
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              >
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.title} 
                  variants={fadeInUp}
                  className="group relative flex flex-col p-8 rounded-2xl border border-border/50 bg-background hover:border-primary-accent/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary-accent/5"
                  style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-accent/10 text-primary-accent group-hover:scale-110 transition-transform duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-heading text-xl font-normal text-foreground mb-3">{feature.title}</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm font-body">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8B735512_1px,transparent_1px),linear-gradient(to_bottom,#8B735512_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          <div className="container mx-auto px-4 relative">
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-2 gap-12 md:grid-cols-4"
            >
              {stats.map((stat) => (
                <motion.div 
                  key={stat.label} 
                  variants={fadeInUp}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-heading text-4xl md:text-5xl font-normal tracking-tighter text-white">
                      {stat.value}
                    </span>
                    {stat.icon && <stat.icon className="h-6 w-6 text-primary-accent fill-primary-accent" />}
                  </div>
                  <p className="text-sm font-medium uppercase tracking-widest text-white/60 font-body">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div 
                {...fadeInUp}
                className="text-center mb-16"
              >
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-accent mb-3 font-body">FAQ</h2>
                <h3 className="font-heading text-3xl font-normal text-foreground sm:text-4xl tracking-tight">
                  Everything you need to know
                </h3>
              </motion.div>
              
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, amount: 0.1 }}
                className="space-y-4"
              >
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, index) => (
                    <motion.div key={faq.question} variants={fadeInUp}>
                      <AccordionItem 
                        value={`item-${index}`}
                        className="group border border-border/50 bg-background/50 backdrop-blur-sm rounded-2xl px-6 transition-all duration-300 hover:border-primary-accent/30 hover:bg-background/80 data-[state=open]:border-primary-accent/50 data-[state=open]:bg-background/90"
                        style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
                      >
                        <AccordionTrigger className="hover:no-underline py-6">
                          <div className="flex items-center gap-4 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-accent/10 text-primary-accent group-data-[state=open]:bg-primary-accent group-data-[state=open]:text-primary-accent-foreground transition-colors duration-300">
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
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl overflow-hidden bg-gradient-primary px-8 py-20 text-center text-primary-foreground md:px-16"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <motion.h2 
                  {...fadeInUp}
                  className="font-heading text-3xl font-normal sm:text-5xl mb-6 tracking-tight"
                >
                  Ready to experience the future of top-ups?
                </motion.h2>
                <motion.p 
                  {...fadeInUp}
                  className="text-primary-foreground/80 text-lg mb-10 leading-relaxed font-body"
                >
                  Join 500k+ Ghanaians already using Topchart. Fast, secure, and reliable infrastructure for your digital life.
                </motion.p>
                <motion.div 
                  {...fadeInUp}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button size="lg" variant="secondary" asChild className="h-12 px-8 text-base w-full sm:w-auto active:scale-[0.98] transition-all duration-300 rounded-xl font-medium" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                    <Link href="/register">Create Free Account</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base w-full sm:w-auto border-white/20 hover:bg-white/10 text-white active:scale-[0.98] transition-all duration-300 rounded-xl font-medium" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
