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
import { motion, AnimatePresence } from "framer-motion"
import { detectNetwork, type Network } from "@/lib/networks"
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  Gift,
  Lock,
  Mail,
  ArrowRight,
  User,
} from "lucide-react"

const passwordRequirementsList = (pw: string) => [
  { label: "8+ characters", met: pw.length >= 8 },
  { label: "Number", met: /\d/.test(pw) },
  { label: "Uppercase", met: /[A-Z]/.test(pw) },
  { label: "Special char", met: /[^A-Za-z0-9]/.test(pw) },
]

function strengthColor(metCount: number) {
  if (metCount === 0) return "bg-muted"
  if (metCount === 1) return "bg-destructive"
  if (metCount === 2) return "bg-warning"
  if (metCount === 3) return "bg-blue-500"
  return "bg-success"
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    marketingOptIn: false,
    manualReferralCode: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlRef = urlParams.get("ref")
    if (urlRef) {
      localStorage.setItem("referral_code", urlRef)
      setFormData((p) => ({ ...p, manualReferralCode: urlRef }))
      return
    }
    const stored = localStorage.getItem("referral_code")
    if (stored) setFormData((p) => ({ ...p, manualReferralCode: stored }))
  }, [])

  useEffect(() => {
    if (formData.phone.length >= 3) setSelectedNetwork(detectNetwork(formData.phone))
    else setSelectedNetwork(null)
  }, [formData.phone])

  const requirements = passwordRequirementsList(formData.password)
  const metCount = requirements.filter((r) => r.met).length
  const allMet = metCount === 4
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleCheckbox = (name: string, checked: boolean) => {
    setFormData((p) => ({ ...p, [name]: checked }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const { firstName, lastName, email, phone, password, confirmPassword, agreeToTerms } = formData
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill in all required fields")
      return
    }
    if (!allMet) { setError("Please meet all password requirements"); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }
    if (!agreeToTerms) { setError("You must agree to the Terms and Privacy Policy"); return }
    if (!/^0[2-5][0-9]\d{7}$/.test(phone)) { setError("Please enter a valid Ghanaian phone number"); return }

    setIsLoading(true)
    try {
      const result = await register({
        email,
        password,
        firstName,
        lastName,
        phone,
        referralCode: formData.manualReferralCode || undefined,
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
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[480px_1fr]">
      {/* Left: Form */}
      <main className="flex flex-col justify-start overflow-y-auto px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm mx-auto space-y-7"
        >
          {/* Mobile logo */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="font-marketing-script text-2xl text-[color:var(--marketing-gold,#c9a227)]">Topchart</Link>
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />Home
            </Link>
          </div>
          <Link href="/" className="hidden lg:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to home
          </Link>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Create account</h2>
            <p className="text-muted-foreground text-sm">Join 500,000+ users on Topchart</p>
          </div>

          {/* Guest shortcut */}
          <div className="rounded-2xl border-2 p-3.5 space-y-2" style={{ borderColor: "var(--marketing-accent,#F38F20)", backgroundColor: "rgba(243,143,32,0.04)" }}>
            <Button asChild className="h-11 w-full rounded-xl font-semibold text-white" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
              <Link href="/checkout"><Smartphone className="w-4 h-4 mr-2" />Buy as Guest — no account needed</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">Checkout in under 30 seconds</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-medium">Or sign up with</span></div>
          </div>

          <GoogleAuthButton text="Continue with Google" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-medium">Or email</span></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 text-sm rounded-xl bg-destructive/5 border border-destructive/20 text-destructive"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</Label>
                <div className="relative">
                  <Input id="firstName" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required disabled={isLoading} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background pl-9" />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required disabled={isLoading} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Input id="email" name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background pl-9" />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                {selectedNetwork && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border animate-in zoom-in" style={{ borderColor: selectedNetwork.color + "40", color: selectedNetwork.color, backgroundColor: selectedNetwork.color + "12" }}>
                    {selectedNetwork.name}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input id="phone" name="phone" type="tel" placeholder="0241234567" value={formData.phone} onChange={handleChange} required disabled={isLoading} maxLength={10} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background pl-9" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-70">🇬🇭</span>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={isLoading} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background pl-9 pr-10" />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 rounded-full ${strengthColor(metCount)}`} style={{ width: `${(metCount / 4) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {requirements.map((r) => (
                      <span key={r.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${r.met ? "bg-[color:var(--marketing-accent,#F38F20)]/15 text-[color:var(--marketing-accent,#F38F20)]" : "bg-muted text-muted-foreground"}`}>
                        <Check className={`w-2.5 h-2.5 ${r.met ? "opacity-100" : "opacity-25"}`} />
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
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                {formData.confirmPassword && (
                  <span className={`text-[10px] font-semibold ${passwordsMatch ? "text-success" : "text-destructive"}`}>
                    {passwordsMatch ? "Passwords match" : "Does not match"}
                  </span>
                )}
              </div>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background" />
            </div>

            {/* Referral */}
            <div className="space-y-1.5">
              <Label htmlFor="manualReferralCode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Referral Code <span className="normal-case font-normal opacity-60">(Optional)</span>
              </Label>
              <div className="relative">
                <Input id="manualReferralCode" name="manualReferralCode" placeholder="Enter code" value={formData.manualReferralCode} onChange={handleChange} disabled={isLoading} className="h-11 rounded-xl bg-muted/40 border-border/60 focus:bg-background pl-9 uppercase placeholder:normal-case" />
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <Checkbox id="agreeToTerms" checked={formData.agreeToTerms} onCheckedChange={(c) => handleCheckbox("agreeToTerms", !!c)} disabled={isLoading} className="mt-0.5 rounded" />
                <Label htmlFor="agreeToTerms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  I agree to the{" "}
                  <Link href="/terms" className="font-bold text-[color:var(--marketing-accent,#F38F20)] hover:opacity-80">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="font-bold text-[color:var(--marketing-accent,#F38F20)] hover:opacity-80">Privacy Policy</Link>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="marketingOptIn" checked={formData.marketingOptIn} onCheckedChange={(c) => handleCheckbox("marketingOptIn", !!c)} disabled={isLoading} className="mt-0.5 rounded" />
                <Label htmlFor="marketingOptIn" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  Notify me about exclusive discounts and network updates.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !allMet || !formData.agreeToTerms}
              className="h-11 w-full rounded-xl font-semibold text-white shadow-sm disabled:opacity-60"
              style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
              ) : (
                <>Create account<ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[color:var(--marketing-accent,#F38F20)] hover:opacity-80 transition-opacity">Sign in</Link>
          </p>
        </motion.div>
      </main>

      {/* Right: Brand panel (desktop only) */}
      <aside
        className="relative hidden lg:flex flex-col overflow-hidden"
        style={{ backgroundColor: "var(--marketing-hero-dark, #0f172a)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[color:var(--marketing-accent,#F38F20)]/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="relative z-10 flex flex-col h-full px-12 py-12 justify-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-white leading-tight">
              Everything you need.<br />
              <span style={{ color: "var(--marketing-accent,#F38F20)" }}>Right here.</span>
            </h2>
            <div className="space-y-4">
              {[
                { label: "500,000+", desc: "Active users" },
                { label: "99.9%", desc: "Uptime guarantee" },
                { label: "< 10s", desc: "Average delivery time" },
                { label: "24/7", desc: "Customer support" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-5 py-4">
                  <span className="text-2xl font-black" style={{ color: "var(--marketing-accent,#F38F20)" }}>{stat.label}</span>
                  <span className="text-sm text-white/60">{stat.desc}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest font-semibold">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              SSL secured · PCI DSS compliant · 256-bit encrypted
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
