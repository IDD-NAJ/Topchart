"use client"



import React from "react"

import { useState } from "react"

import { useRouter } from "next/navigation"

import Link from "next/link"

import { useAuth } from "@/lib/auth-context"

import { isAdmin } from "@/lib/roles"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { motion } from "framer-motion"

import { 

  AlertCircle, 

  Eye, 

  EyeOff, 

  Loader2, 

  CheckCircle2, 

  ShieldCheck, 

  Smartphone,

  ArrowRight,

  ChevronLeft,

  Zap,

  Lock,

  Wallet

} from "lucide-react"



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



const benefits = [

  {

    icon: Zap,

    title: "Instant Top-ups",

    description: "Recharge airtime & data in seconds, 24/7 availability"

  },

  {

    icon: ShieldCheck,

    title: "Bank-Level Security",

    description: "PCI DSS compliant with 256-bit encryption"

  },

  {

    icon: Wallet,

    title: "All Networks",

    description: "MTN, Telecel & AirtelTigo supported"

  },

  {

    icon: Lock,

    title: "Secure Wallet",

    description: "Store funds securely for faster transactions"

  }

]



const networks = [

  { name: "MTN", color: "#FFC107", textColor: "#000" },

  { name: "Telecel", color: "#E40046", textColor: "#fff" },

  { name: "AirtelTigo", color: "#E60000", textColor: "#fff" }

]



export default function LoginPage() {

  const router = useRouter()

  const { login } = useAuth()

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState("")

  const [isLoading, setIsLoading] = useState(false)



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setError("")

    setIsLoading(true)



    try {

      const result = await login(email, password)



      if (result.success) {

        const destination = result.user && isAdmin(result.user.role) ? "/admin" : "/dashboard"

        router.push(destination)

        router.refresh()

      } else {

        setError(result.error || "Invalid email or password")

        setIsLoading(false)

      }

    } catch (error) {

      setError("Something went wrong. Please try again.")

      setIsLoading(false)

    }

  }



  return (

    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[1.1fr,0.9fr] bg-background selection:bg-[#006994]/15 selection:text-foreground">

      {/* Left Side: Form */}

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 relative pt-28 lg:pt-24">

        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,105,148,0.03)_0%,transparent_100%)] pointer-events-none" />

        

        <motion.div 

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ duration: 0.5 }}

          className="w-full max-w-sm px-4 space-y-10 relative z-10"

        >

          <div className="space-y-6">

            <motion.div

              initial={{ opacity: 0, x: -10 }}

              animate={{ opacity: 1, x: 0 }}

              transition={{ duration: 0.4, delay: 0.1 }}

            >

              <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-[#006994] transition-all duration-300 group" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>

                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />

                Back to home

              </Link>

            </motion.div>



            <motion.div 

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.5, delay: 0.2 }}

              className="space-y-2"

            >

              <Link href="/" className="block">

                <div className="flex items-center mb-8">

                  <span className="font-heading text-3xl font-normal tracking-tight text-foreground">

                    Topchart

                  </span>

                  <span className="ml-2 text-[11px] font-bold uppercase tracking-widest text-[#006994] bg-[#006994]/10 px-2.5 py-1 rounded-full">

                    GH

                  </span>

                </div>

              </Link>

              <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground">Welcome back</h1>

              <p className="text-muted-foreground font-body">Sign in to access your account and continue topping up.</p>

            </motion.div>

          </div>



          <motion.div 

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.5, delay: 0.3 }}

            className="space-y-6"

          >

            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (

                <motion.div 

                  initial={{ opacity: 0, y: -10 }}

                  animate={{ opacity: 1, y: 0 }}

                  className="flex items-center gap-2 p-3.5 text-sm rounded-xl bg-destructive/5 border border-destructive/10 text-destructive"

                >

                  <AlertCircle className="w-4 h-4 shrink-0" />

                  <span>{error}</span>

                </motion.div>

              )}

              

              <div className="space-y-2">

                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Email address</Label>

                <Input

                  id="email"

                  type="email"

                  placeholder="name@example.com"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  required

                  disabled={isLoading}

                  autoComplete="email"

                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"

                />

              </div>

              

              <div className="space-y-2">

                <div className="flex items-center justify-between">

                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Password</Label>

                  <Link 

                    href="/forgot-password" 

                    className="text-xs font-medium text-[#006994] hover:text-[#004D6E] transition-all duration-300"

                    style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}

                  >

                    Forgot password?

                  </Link>

                </div>

                <div className="relative">

                  <Input

                    id="password"

                    type={showPassword ? "text" : "password"}

                    placeholder="••••••••"

                    value={password}

                    onChange={(e) => setPassword(e.target.value)}

                    required

                    disabled={isLoading}

                    autoComplete="current-password"

                    className="pr-10 h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"

                  />

                  <button

                    type="button"

                    onClick={() => setShowPassword(!showPassword)}

                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"

                  >

                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}

                  </button>

                </div>

              </div>



              <Button type="submit" className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#006994] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#006994] shadow-lg shadow-[#006994]/20 rounded-xl transition-all duration-300" disabled={isLoading} style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>

                {isLoading ? (

                  <>

                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />

                    Signing in...

                  </>

                ) : (

                  "Sign in"

                )}

              </Button>

            </form>



            <div className="relative">

              <div className="absolute inset-0 flex items-center">

                <span className="w-full border-t border-border/50" />

              </div>

              <div className="relative flex justify-center text-xs uppercase">

                <span className="bg-background px-2 text-muted-foreground">New to Topchart?</span>

              </div>

            </div>



            <Button variant="outline" asChild className="w-full h-12 rounded-xl border-border/50 hover:bg-muted/30 font-medium transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>

              <Link href="/register">

                Create an account

                <ArrowRight className="w-4 h-4 ml-2" />

              </Link>

            </Button>

          </motion.div>



          <motion.div 

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            transition={{ duration: 0.5, delay: 0.4 }}

            className="pt-8 mt-8 border-t border-border/30"

          >

            <p className="text-center text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-4 font-body">

              Supported Networks

            </p>

            <div className="flex items-center justify-center gap-3">

              {networks.map((network, index) => (

                <motion.div 

                  key={network.name}

                  initial={{ opacity: 0, scale: 0.9 }}

                  animate={{ opacity: 1, scale: 1 }}

                  transition={{ delay: 0.5 + index * 0.1 }}

                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm"

                  style={{ 

                    backgroundColor: network.color, 

                    color: network.textColor 

                  }}

                >

                  {network.name}

                </motion.div>

              ))}

            </div>

          </motion.div>



          <motion.div 

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            transition={{ duration: 0.5, delay: 0.5 }}

            className="flex items-center justify-center gap-6 pt-4"

          >

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">

              <ShieldCheck className="w-3.5 h-3.5 text-success" />

              SSL Secured

            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">

              <Lock className="w-3.5 h-3.5 text-success" />

              Encrypted

            </div>

          </motion.div>

        </motion.div>

      </main>



      {/* Right Side: Visual Content */}

      <aside className="hidden lg:flex flex-col relative text-white p-16 overflow-hidden border-l border-white/5" style={{ background: 'linear-gradient(135deg, #004D6E 0%, #006994 50%, #1A85B8 100%)' }}>

        {/* Abstract background elements */}

        <div className="absolute inset-0 overflow-hidden">

          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#722F37]/25 rounded-full blur-[120px]" />

          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />

        </div>

        

        <motion.div 

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ duration: 0.7 }}

          className="relative z-10 flex flex-col h-full"

        >

          <div className="flex-1 flex flex-col justify-center">

            <motion.div 

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.5, delay: 0.2 }}

              className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/90 uppercase tracking-widest mb-8 w-fit backdrop-blur-sm"

            >

              <span className="w-1.5 h-1.5 rounded-full bg-success mr-2 animate-pulse"></span>

              Platform Operational

            </motion.div>

            

            <motion.h2 

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.6, delay: 0.3 }}

              className="font-heading text-5xl xl:text-6xl font-normal tracking-tight mb-10 leading-[1.05]"

            >

              Ghana&apos;s #1 <br />

              <span className="text-[#FDF2F3]">Digital Recharge</span><br />

              Platform

            </motion.h2>

            

            <motion.div 

              variants={staggerContainer}

              initial="initial"

              animate="animate"

              className="space-y-8 max-w-md"

            >

              {benefits.map((benefit, i) => (

                <motion.div 

                  key={i} 

                  variants={fadeInUp}

                  transition={{ delay: 0.4 + i * 0.1 }}

                  className="flex gap-4 group"

                >

                  <motion.div 

                    whileHover={{ scale: 1.05 }}

                    className="h-12 w-12 shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white"

                  >

                    <benefit.icon className="h-6 w-6" />

                  </motion.div>

                  <div className="pt-0.5">

                    <h3 className="font-heading text-lg font-normal mb-1 text-white">{benefit.title}</h3>

                    <p className="text-white/60 text-sm leading-relaxed font-body">

                      {benefit.description}

                    </p>

                  </div>

                </motion.div>

              ))}

            </motion.div>

          </div>

          

          <motion.div 

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.5, delay: 0.8 }}

            className="pt-12 mt-auto"

          >

            <div className="grid grid-cols-2 gap-6">

              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm">

                <div className="font-heading text-3xl font-normal text-white mb-1">500K+</div>

                <div className="text-[11px] font-bold uppercase tracking-widest text-white/50 font-body">Active Users</div>

              </div>

              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm">

                <div className="font-heading text-3xl font-normal text-white mb-1">99.9%</div>

                <div className="text-[11px] font-bold uppercase tracking-widest text-white/50 font-body">Uptime</div>

              </div>

            </div>

          </motion.div>

        </motion.div>

      </aside>

    </div>

  )

}

