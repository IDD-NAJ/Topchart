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
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Smartphone,
  Lock,
  Wallet,
  ArrowRight,
  Zap,
} from "lucide-react"

function LoginPageContent() {
  const { login }   = useAuth()
  const router      = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]           = useState("")
  const [isLoading, setIsLoading]   = useState(false)

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
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_460px]">

      {/* ── Left: Branding panel ── */}
      <aside
        className="relative hidden lg:flex flex-col overflow-hidden"
        style={{ backgroundColor: "#0c1220" }}
      >
        {/* Subtle dot-grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        {/* Accent glow */}
        <div
          className="pointer-events-none absolute top-0 left-0 w-[480px] h-[480px] opacity-20"
          style={{
            background: "radial-gradient(circle at 0% 0%, #F38F20 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col px-12 py-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-marketing-script text-3xl" style={{ color: "#c9a227" }}>Topchart</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: "rgba(243,143,32,0.15)", color: "#F38F20" }}
            >
              GH
            </span>
          </Link>

          {/* Headline */}
          <div className="mt-auto mb-auto space-y-5 max-w-sm">
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Ghana&apos;s #1<br />
              <span style={{ color: "#F38F20" }}>data & airtime</span><br />
              platform.
            </h1>
            <p className="text-base text-white/50 leading-relaxed">
              Top up any Ghanaian network instantly. Trusted by over 500,000 users.
            </p>

            {/* Feature list */}
            <ul className="space-y-3 pt-2">
              {[
                { icon: Zap,         text: "Instant top-ups in seconds" },
                { icon: ShieldCheck, text: "Bank-grade 256-bit encryption" },
                { icon: Wallet,      text: "Smart wallet for faster checkout" },
                { icon: Smartphone,  text: "MTN, Telecel & AirtelTigo" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/70">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(243,143,32,0.18)" }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: "#F38F20" }} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Network chips */}
          <div className="mt-auto border-t border-white/10 pt-6">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Supported networks</p>
            <div className="flex gap-2">
              {[
                { name: "MTN",       bg: "#FFCC00", fg: "#000" },
                { name: "Telecel",   bg: "#E40046", fg: "#fff" },
                { name: "AirtelTigo",bg: "#E60000", fg: "#fff" },
              ].map((n) => (
                <span
                  key={n.name}
                  className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: n.bg, color: n.fg }}
                >
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right: Login form ── */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-7">

          {/* Mobile logo */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="font-marketing-script text-2xl" style={{ color: "#c9a227" }}>Topchart</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your Topchart account</p>
          </div>

          {/* Google */}
          <GoogleAuthButton text="Continue with Google" />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="flex-1 border-t border-border" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">or</span>
            <span className="flex-1 border-t border-border" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "#F38F20" }}
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
                  className="h-11 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl font-semibold text-white"
              style={{ backgroundColor: "#F38F20" }}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </form>

          {/* Sign up + Guest */}
          <div className="space-y-3 border-t border-border pt-5">
            <p className="text-center text-sm text-muted-foreground">
              New to Topchart?{" "}
              <Link href="/register" className="font-semibold hover:opacity-80" style={{ color: "#F38F20" }}>
                Create an account
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href="/checkout" className="font-semibold text-foreground hover:opacity-70">
                Buy as guest
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-500" />SSL</span>
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-green-500" />256-bit</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-500" />PCI</span>
          </div>
        </div>
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
