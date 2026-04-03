"use client"

import React from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { 
  Users, 
  Target, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary-accent/20 selection:text-foreground">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative pt-32 pb-24 overflow-hidden bg-gradient-hero"
        >
          {/* Background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8B735508_1px,transparent_1px),linear-gradient(to_bottom,#8B735508_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(45%_50%_at_50%_20%,rgba(var(--primary-rgb),0.06)_0%,transparent_100%)]" />
          {/* Ghana accent colours */}
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-[#FFC107]/5 blur-[100px]" />
          <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-[#E40046]/5 blur-[100px]" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-accent/10 border border-primary-accent/20 text-primary-accent text-xs font-bold uppercase tracking-widest mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-accent" />
                Est. 2023 · Accra, Ghana
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-heading text-4xl font-normal tracking-tight text-foreground sm:text-6xl mb-6"
              >
                Redefining Digital <br />
                <span className="text-primary-accent">Infrastructure in Ghana</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-muted-foreground leading-relaxed font-body max-w-2xl mx-auto"
              >
                Topchart is building the most reliable, secure, and lightning-fast platform for digital transactions, starting with airtime and data.
              </motion.p>
            </div>

            {/* Network badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-14 flex flex-wrap justify-center gap-4"
            >
              {[
                { name: 'MTN', bg: '#FFC107', text: '#000', desc: 'Mobile Money' },
                { name: 'Telecel', bg: '#E40046', text: '#fff', desc: 'Vodafone Cash' },
                { name: 'AirtelTigo', bg: '#E60000', text: '#fff', desc: 'AT Money' },
              ].map((n) => (
                <motion.div 
                  key={n.name} 
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: n.bg, color: n.text }}>
                    {n.name === 'MTN' ? 'M' : n.name === 'Telecel' ? 'T' : 'AT'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{n.name}</p>
                    <p className="text-[10px] text-muted-foreground">{n.desc}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Stats Banner */}
        <section className="py-12 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="container mx-auto px-4 relative"
          >
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              {[
                { value: '500K+', label: 'Active Users' },
                { value: '2M+', label: 'Transactions' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '24/7', label: 'Support' },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="font-heading text-4xl font-normal text-white">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1 font-body">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Our Mission */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-accent mb-4 font-body">Our Mission</h2>
                <h3 className="font-heading text-3xl font-normal mb-6">Empowering every Ghanaian with seamless digital access.</h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-body">
                  We believe that digital connectivity should be effortless. Our mission is to eliminate the friction in purchasing digital services by providing a robust, enterprise-grade infrastructure that works for everyone—from individuals to large businesses.
                </p>
                <ul className="space-y-4">
                  {[
                    "Reliability at the core of every transaction",
                    "Security that exceeds global standards",
                    "Customer-centric design and support",
                    "Innovation that drives the digital economy"
                  ].map((item, index) => (
                    <motion.li 
                      key={item} 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-primary-accent flex-shrink-0" />
                      <span className="font-medium font-body">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-primary-accent/10 rounded-3xl blur-2xl" />
                <Card className="relative border-primary-accent/20 bg-background overflow-hidden shadow-xl">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FFC107] via-[#E40046] to-[#E60000]" />
                  <CardContent className="p-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-accent mb-6 font-body">Platform Metrics</p>
                    <motion.div 
                      variants={staggerContainer}
                      initial="initial"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="grid grid-cols-2 gap-6"
                    >
                      {[
                        { value: '500K+', label: 'Active Users', color: 'from-amber-500/20 to-amber-500/5' },
                        { value: '2M+', label: 'Transactions', color: 'from-rose-500/20 to-rose-500/5' },
                        { value: '99.9%', label: 'Uptime', color: 'from-emerald-500/20 to-emerald-500/5' },
                        { value: '24/7', label: 'Support', color: 'from-blue-500/20 to-blue-500/5' },
                      ].map((s, index) => (
                        <motion.div 
                          key={s.label}
                          variants={fadeInUp}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-2xl bg-gradient-to-br ${s.color} border border-border/50`}
                        >
                          <p className="font-heading text-3xl font-normal text-foreground">{s.value}</p>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1 font-body">{s.label}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-accent mb-4 font-body">Our Values</h2>
              <h3 className="font-heading text-3xl font-normal sm:text-4xl">The principles that guide us</h3>
            </motion.div>
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Zap,
                  title: "Speed",
                  description: "We obsess over latency. Every millisecond matters when it comes to your transactions.",
                  gradient: "from-amber-500/20 to-amber-500/5",
                  iconColor: "text-amber-600 dark:text-amber-400",
                  border: "hover:border-amber-500/30"
                },
                {
                  icon: ShieldCheck,
                  title: "Security",
                  description: "We employ bank-grade encryption and rigorous security protocols to protect your data.",
                  gradient: "from-emerald-500/20 to-emerald-500/5",
                  iconColor: "text-emerald-600 dark:text-emerald-400",
                  border: "hover:border-emerald-500/30"
                },
                {
                  icon: Target,
                  title: "Precision",
                  description: "Accuracy is non-negotiable. We ensure every cedi and every megabyte is accounted for.",
                  gradient: "from-blue-500/20 to-blue-500/5",
                  iconColor: "text-blue-600 dark:text-blue-400",
                  border: "hover:border-blue-500/30"
                }
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border-border/50 ${value.border} transition-all duration-300 group overflow-hidden`} style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                    <CardContent className="p-8">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-6`}
                      >
                        <value.icon className={`h-7 w-7 ${value.iconColor}`} />
                      </motion.div>
                      <h4 className="font-heading text-xl font-normal mb-3">{value.title}</h4>
                      <p className="text-muted-foreground font-body leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Team / Culture strip */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-accent mb-4 font-body">Our Team</h2>
              <h3 className="font-heading text-3xl font-normal sm:text-4xl">Built by Ghanaians, for Ghana</h3>
            </motion.div>
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {[
                { role: 'Engineering', count: '6+', icon: '💻', color: 'from-violet-500/20 to-violet-500/5' },
                { role: 'Design', count: '2+', icon: '🎨', color: 'from-pink-500/20 to-pink-500/5' },
                { role: 'Operations', count: '3+', icon: '⚙️', color: 'from-orange-500/20 to-orange-500/5' },
                { role: 'Support', count: '4+', icon: '🤝', color: 'from-teal-500/20 to-teal-500/5' },
              ].map((dept, index) => (
                <motion.div 
                  key={dept.role}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${dept.color} border border-border/50 text-center`}
                >
                  <div className="text-3xl mb-3">{dept.icon}</div>
                  <p className="font-heading text-2xl font-normal text-foreground">{dept.count}</p>
                  <p className="text-sm font-medium text-muted-foreground font-body mt-1">{dept.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="bg-gradient-primary text-primary-foreground border-none overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                <CardContent className="p-12 md:p-20 text-center relative z-10">
                  <h3 className="font-heading text-3xl md:text-5xl font-normal mb-6">Join our growing community</h3>
                  <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto font-body">
                    Experience the future of digital transactions today. Create an account and start topping up in seconds.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" variant="secondary" asChild className="h-12 px-8 rounded-xl transition-all duration-300 font-medium" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                      <Link href="/register">Get Started Now</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="h-12 px-8 border-white/20 hover:bg-white/10 text-white rounded-xl transition-all duration-300 font-medium" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                      <Link href="/dashboard/tickets">Contact Support</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
