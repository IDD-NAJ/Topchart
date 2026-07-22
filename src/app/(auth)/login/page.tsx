"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { isAdmin } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Smartphone,
  ChevronLeft,
  Zap,
  Lock,
  Wallet,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const benefits = [
  { icon: Zap, title: "Instant Top-ups", description: "Recharge airtime & data in seconds" },
  { icon: ShieldCheck, title: "Bank-Level Security", description: "256-bit encrypted transactions" },
  { icon: Wallet, title: "Smart Wallet", description: "Store funds for faster checkout" },
  { icon: Smartphone, title: "All Networks", description: "MTN, Telecel & AirtelTigo" },
]

const networks = [
  { name: "MTN", color: "#FFCC00", text: "#000" },
  { name: "Telecel", color: "#E40046", text: "#fff" },
  { name: "AirtelTigo", color: "#E60000", text: "#fff" },
]

function LoginPageContent() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
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
        const next = searchParams.get("next")
        const destination =
          next && next.startsWith("/") && !next.startsWith("//")
            ? next
            : result.user && isAdmin(result.user.role)
            ? "/admin"
            : "/dashboard"
        window.dispatchEvent(new Event("auth:changed"))
        setTimeout(() => window.location.assign(destination), 300)
      } else {
        setError(result.error || "Invalid email or password")
        setIsLoading(false)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_480px]">
      {/* Left: Branding panel */}
      <aside
        className="relative hidden lg:flex flex-col overflow-hidden"
        style={{ backgroundColor: "var(--marketing-hero-dark, #0f172a)" }}
      >
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[color:var(--marketing-accent,#F38F20)]/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-auto">
            <span className="font-marketing-script text-3xl text-[color:var(--marketing-gold,#c9a227)]">Topchart</span>
            <span className="inline-block rounded-full bg-[color:var(--marketing-accent,#F38F20)]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--marketing-accent,#F38F20)]">GH</span>
          </Link>

          {/* Headline */}
          <div className="my-auto space-y-6">
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
              Ghana&apos;s fastest<br />
              <span style={{ color: "var(--marketing-accent, #F38F20)" }}>data & airtime</span><br />
              platform.
            </h1>
            <p className="text-lg text-white/60 max-w-xs leading-relaxed">
              Top up any Ghanaian number in seconds. Trusted by over 500,000 users.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {benefits.map((b) => {
                const Icon = b.icon
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{b.title}</p>
                      <p className="text-[11px] text-white/50 mt-0.5">{b.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Networks */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-3">Supported networks</p>
            <div className="flex items-center gap-2">
              {networks.map((n) => (
                <span key={n.name} className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: n.color, color: n.text }}>
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Right: Login form */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm mx-auto space-y-8"
        >
          {/* Mobile logo + back */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="font-marketing-script text-2xl text-[color:var(--marketing-gold,#c9a227)]">Topchart</span>
            </Link>
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
          </div>

          {/* Back link — desktop */}
          <Link href="/" className="hidden lg:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your Topchart account</p>
          </div>

          {/* Guest shortcut */}
          <div className="rounded-2xl border-2 p-4 space-y-2" style={{ borderColor: "var(--marketing-accent,#F38F20)", backgroundColor: "rgba(243,143,32,0.04)" }}>
            <Button asChild className="h-11 w-full rounded-xl font-semibold text-white shadow-sm" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
              <Link href="/checkout">
                <Smartphone className="w-4 h-4 mr-2" />
                Buy as Guest — no account needed
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">Checkout in under 30 seconds</p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">Or sign in with</span>
            </div>
          </div>

          {/* Google */}
          <GoogleAuthButton text="Continue with Google" />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">Or email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 text-sm rounded-xl bg-destructive/5 border border-destructive/20 text-destructive"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[color:var(--marketing-accent,#F38F20)] hover:opacity-80 transition-opacity">
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
                  className="h-11 pr-10 rounded-xl bg-muted/40 border-border/60 focus:bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl font-semibold text-white shadow-sm disabled:opacity-60"
              style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
              ) : (
                <>Sign in<ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          {/* Sign up CTA */}
          <p className="text-center text-sm text-muted-foreground">
            New to Topchart?{" "}
            <Link href="/register" className="font-semibold text-[color:var(--marketing-accent,#F38F20)] hover:opacity-80 transition-opacity">
              Create an account
            </Link>
          </p>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              SSL Secured
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-green-500" />
              256-bit Encrypted
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              PCI Compliant
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
