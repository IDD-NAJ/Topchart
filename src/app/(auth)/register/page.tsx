"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  BadgePercent,
  ChevronRight,
  Gift,
  Lock,
  Mail,
  ChevronLeft,
  ArrowRight
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { detectNetwork, type Network } from "@/lib/networks"

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

const stats = [
  { label: "Active Users", value: "500k+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Support", value: "24/7" }
]

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)
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
    manualReferralCode: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check URL query params first
    const urlParams = new URLSearchParams(window.location.search)
    const urlRef = urlParams.get("ref")
    
    if (urlRef) {
      localStorage.setItem("referral_code", urlRef)
      setReferralCode(urlRef)
      setFormData(prev => ({ ...prev, manualReferralCode: urlRef }))
      return
    }
    
    // Fall back to localStorage
    const storedCode = localStorage.getItem("referral_code")
    if (storedCode) {
      setReferralCode(storedCode)
      setFormData(prev => ({ ...prev, manualReferralCode: storedCode }))
    }
  }, [])

  useEffect(() => {
    if (formData.phone.length >= 3) {
      setSelectedNetwork(detectNetwork(formData.phone))
    } else {
      setSelectedNetwork(null)
    }
  }, [formData.phone])

  const passwordRequirements = [
    { label: "8+ characters", met: formData.password.length >= 8 },
    { label: "Number", met: /\d/.test(formData.password) },
    { label: "Uppercase", met: /[A-Z]/.test(formData.password) },
    { label: "Special char", met: /[^A-Za-z0-9]/.test(formData.password) },
  ]

  const allRequirementsMet = passwordRequirements.every((req) => req.met)
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  const getStrengthColor = () => {
    const metCount = passwordRequirements.filter(r => r.met).length
    if (metCount === 0) return "bg-muted"
    if (metCount === 1) return "bg-red-500"
    if (metCount === 2) return "bg-yellow-500"
    return "bg-green-500"
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim()) {
      setError("Please fill in all required fields")
      return
    }

    if (!allRequirementsMet) {
      setError("Please meet all password requirements")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms and Privacy Policy")
      return
    }

    const phoneRegex = /^0[2-5][0-9]\d{7}$/
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid Ghanaian phone number")
      return
    }

    setIsLoading(true)

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        referralCode: formData.manualReferralCode || undefined,
      })

      if (result.success) {
        localStorage.removeItem("referral_code")
        router.replace("/dashboard")
      } else {
        setError(result.error || "Registration failed")
        setIsLoading(false)
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--marketing-cream-alt)] selection:bg-[color:var(--marketing-accent)]/15 lg:grid lg:grid-cols-[1.1fr,0.9fr]">
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 pt-8 md:p-12 lg:p-16 lg:pt-12">
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,105,148,0.03)_0%,transparent_100%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-4 space-y-10 relative z-10 py-8"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Link href="/" className="group inline-flex items-center text-sm font-medium text-neutral-600 transition-colors hover:text-[color:var(--marketing-accent)]">
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
              <Link href="/" className="mb-8 block">
                <span className="font-marketing-script text-4xl text-[color:var(--marketing-gold)]">Topchart</span>
                <span className="ml-2 inline-block rounded-full bg-[color:var(--marketing-accent)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[color:var(--marketing-accent)]">
                  GH
                </span>
              </Link>
              <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground">Create account</h1>
              <p className="text-muted-foreground font-body">Join thousands of users enjoying instant connectivity.</p>
            </motion.div>
          </div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            {error && (
              <div className="flex items-center gap-2 p-3.5 text-sm rounded-xl bg-destructive/5 border border-destructive/10 text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl pl-10"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Phone Number</Label>
                {selectedNetwork && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 animate-in zoom-in" style={{ borderColor: selectedNetwork.color + '40', color: selectedNetwork.color, backgroundColor: selectedNetwork.color + '10' }}>
                    <Smartphone className="w-3 h-3" />
                    {selectedNetwork.name}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0241234567"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  maxLength={10}
                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl pl-10"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm grayscale opacity-70">
                  🇬🇭
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl pl-10 pr-10"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {formData.password && (
                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                      style={{ width: `${(passwordRequirements.filter(r => r.met).length / passwordRequirements.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {passwordRequirements.map((req, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          req.met ? "bg-[color:var(--marketing-accent)]/15 text-[color:var(--marketing-accent)]" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className={`w-3 h-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualReferralCode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                Referral Code <span className="font-normal normal-case opacity-60">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="manualReferralCode"
                  name="manualReferralCode"
                  placeholder="Enter code"
                  value={formData.manualReferralCode}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl pl-10 uppercase placeholder:normal-case"
                />
                <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleCheckboxChange("agreeToTerms", !!checked)}
                  disabled={isLoading}
                  className="mt-1 rounded-md"
                />
                <Label htmlFor="agreeToTerms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  I agree to the{" "}
                  <Link href="/terms" className="font-bold text-[color:var(--marketing-accent)] hover:opacity-90">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="font-bold text-[color:var(--marketing-accent)] hover:opacity-90">Privacy Policy</Link>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onCheckedChange={(checked) => handleCheckboxChange("marketingOptIn", !!checked)}
                  disabled={isLoading}
                  className="mt-1 rounded-md"
                />
                <Label htmlFor="marketingOptIn" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  Notify me about exclusive discounts and network updates.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: "var(--marketing-accent)" }}
              disabled={isLoading || !allRequirementsMet || !formData.agreeToTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.form>

          <div className="space-y-6 pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[color:var(--marketing-cream-alt)] px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full h-12 rounded-xl border-border/50 hover:bg-muted/30 font-medium transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
              <Link href="/login">
                Sign in to your account
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Right Side: Visual Content */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative hidden flex-col overflow-hidden border-l border-white/10 p-16 text-white lg:flex"
        style={{ backgroundColor: "var(--marketing-hero-dark)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='0.5' d='M40 200 Q100 80 200 200 T360 200'/%3E%3C/svg%3E")`,
              backgroundSize: "380px 380px",
            }}
          />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-[-10%] top-[20%] h-[50%] w-[50%] rounded-full bg-[color:var(--marketing-accent)]/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-[color:var(--marketing-accent)]/10 blur-[120px]" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center"></div>
        </div>
      </motion.aside>
    </div>
  )
}
