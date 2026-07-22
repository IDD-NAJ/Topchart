"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { detectNetwork, type Network } from "@/lib/networks"
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Check,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"

const pwChecks = (pw: string) => [
  { label: "8+ chars",   met: pw.length >= 8 },
  { label: "Number",     met: /\d/.test(pw) },
  { label: "Uppercase",  met: /[A-Z]/.test(pw) },
  { label: "Special",    met: /[^A-Za-z0-9]/.test(pw) },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", agreeToTerms: false, manualReferralCode: "",
  })
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref") || localStorage.getItem("referral_code") || ""
    if (ref) setForm((f) => ({ ...f, manualReferralCode: ref }))
  }, [])

  useEffect(() => {
    if (form.phone.length >= 3) setSelectedNetwork(detectNetwork(form.phone))
    else setSelectedNetwork(null)
  }, [form.phone])

  const requirements = pwChecks(form.password)
  const allMet       = requirements.every((r) => r.met)
  const pwMatch      = form.password && form.confirmPassword && form.password === form.confirmPassword

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      setError("Please fill in all required fields")
      return
    }
    if (!allMet) { setError("Please meet all password requirements"); return }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return }
    if (!form.agreeToTerms) { setError("You must agree to the Terms and Privacy Policy"); return }
    if (!/^0[2-5][0-9]\d{7}$/.test(form.phone)) { setError("Enter a valid Ghanaian phone number (e.g. 0241234567)"); return }

    setIsLoading(true)
    try {
      const result = await register({
        email:        form.email,
        password:     form.password,
        firstName:    form.firstName,
        lastName:     form.lastName,
        phone:        form.phone,
        referralCode: form.manualReferralCode || undefined,
      })
      if (result.success) {
        localStorage.removeItem("referral_code")
        router.replace("/dashboard")
      } else {
        setError(result.error || "Registration failed")
        setIsLoading(false)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_540px]">

      {/* ── Left: Branding panel ── */}
      <aside
        className="relative hidden lg:flex flex-col overflow-hidden"
        style={{ backgroundColor: "#0c1220" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 w-[480px] h-[480px] opacity-20"
          style={{ background: "radial-gradient(circle at 100% 100%, #F38F20 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex h-full flex-col justify-center px-12 py-12">
          <Link href="/" className="mb-16 flex items-center gap-2.5">
            <span className="font-marketing-script text-3xl" style={{ color: "#c9a227" }}>Topchart</span>
          </Link>

          <div className="space-y-6 max-w-xs">
            <h1 className="text-4xl font-black text-white leading-tight">
              Everything you need.<br />
              <span style={{ color: "#F38F20" }}>Right here.</span>
            </h1>
            <div className="space-y-3">
              {[
                { label: "500,000+", desc: "Active users" },
                { label: "99.9%",    desc: "Uptime guaranteed" },
                { label: "< 10s",   desc: "Average delivery" },
                { label: "24/7",     desc: "Customer support" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5"
                >
                  <span className="text-xl font-black" style={{ color: "#F38F20" }}>{s.label}</span>
                  <span className="text-sm text-white/60">{s.desc}</span>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              SSL secured · PCI DSS · 256-bit encrypted
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right: Form ── */}
      <main className="flex flex-col justify-start overflow-y-auto px-6 py-10 sm:px-10">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="font-marketing-script text-2xl" style={{ color: "#c9a227" }}>Topchart</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Create account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Join 500,000+ users on Topchart</p>
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
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name</Label>
                <Input id="firstName" placeholder="John" value={form.firstName} onChange={set("firstName")} required disabled={isLoading} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</Label>
                <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={set("lastName")} required disabled={isLoading} className="h-11 rounded-xl" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email address</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={form.email} onChange={set("email")} required disabled={isLoading} autoComplete="email" className="h-11 rounded-xl" />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone number</Label>
                {selectedNetwork && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: selectedNetwork.color + "18", color: selectedNetwork.color }}
                  >
                    {selectedNetwork.name}
                  </span>
                )}
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="0241234567"
                value={form.phone}
                onChange={set("phone")}
                required
                disabled={isLoading}
                maxLength={10}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="space-y-2">
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(requirements.filter((r) => r.met).length / 4) * 100}%`,
                        backgroundColor: requirements.filter((r) => r.met).length < 2 ? "#ef4444" : requirements.filter((r) => r.met).length < 4 ? "#F38F20" : "#22c55e",
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {requirements.map((r) => (
                      <span
                        key={r.label}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={r.met
                          ? { backgroundColor: "rgba(243,143,32,0.12)", color: "#F38F20" }
                          : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
                        }
                      >
                        <Check className={`h-2.5 w-2.5 ${r.met ? "" : "opacity-20"}`} />
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="confirmPw" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm password</Label>
                {form.confirmPassword && (
                  <span className={`text-[10px] font-semibold ${pwMatch ? "text-green-500" : "text-destructive"}`}>
                    {pwMatch ? "Match" : "No match"}
                  </span>
                )}
              </div>
              <Input
                id="confirmPw"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                required
                disabled={isLoading}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Referral */}
            <div className="space-y-1.5">
              <Label htmlFor="referral" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Referral code <span className="normal-case font-normal opacity-60">(optional)</span>
              </Label>
              <Input
                id="referral"
                placeholder="Enter code"
                value={form.manualReferralCode}
                onChange={set("manualReferralCode")}
                disabled={isLoading}
                className="h-11 rounded-xl uppercase placeholder:normal-case"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={form.agreeToTerms}
                onCheckedChange={(c) => setForm((f) => ({ ...f, agreeToTerms: !!c }))}
                disabled={isLoading}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="font-bold hover:opacity-80" style={{ color: "#F38F20" }}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="font-bold hover:opacity-80" style={{ color: "#F38F20" }}>Privacy Policy</Link>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !allMet || !form.agreeToTerms}
              className="h-11 w-full rounded-xl font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#F38F20" }}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating account...</>
              ) : (
                <>Create account <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground pb-6">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:opacity-80" style={{ color: "#F38F20" }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
