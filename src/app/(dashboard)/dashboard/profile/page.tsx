"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getAppOrigin } from "@/lib/app-url"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Gift,
  Copy,
  Check,
  ShieldAlert,
  History,
  Link as LinkIcon,
  Eye,
  EyeOff,
  User,
  TrendingUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/networks"
import { copyToClipboard } from "@/lib/clipboard"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [referralStats, setReferralStats] = useState<{
    referralCode: string
    totalReferred: number
    qualifiedReferrals: number
    totalEarnings: number
  } | null>(null)

  const [profileData, setProfileData] = useState({ firstName: "", lastName: "", phone: "" })
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [isDirty, setIsDirty] = useState(false)

  // Track original values for dirty detection
  const originalProfile = useRef({ firstName: "", lastName: "", phone: "" })

  useEffect(() => {
    if (user) {
      const initial = { firstName: user.firstName || "", lastName: user.lastName || "", phone: user.phone || "" }
      setProfileData(initial)
      originalProfile.current = initial
    }
  }, [user])

  // Debounced auto-save
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfileData((prev) => {
      const next = { ...prev, [field]: value }
      const dirty = Object.entries(next).some(([k, v]) => v !== originalProfile.current[k as keyof typeof originalProfile.current])
      setIsDirty(dirty)
      return next
    })
  }, [])

  useEffect(() => {
    fetch("/api/referral/stats", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((json) => { if (json?.success && json?.data) setReferralStats(json.data) })
      .catch(() => {})
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setIsUpdatingProfile(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Profile Updated", description: "Your changes have been saved." })
        await refreshUser()
        originalProfile.current = { ...profileData }
        setIsDirty(false)
      } else {
        toast({ title: "Update Failed", description: result.error || "Failed to save changes.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirm password must be identical.", variant: "destructive" })
      return
    }
    setIsUpdatingPassword(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updatePassword", currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Password Updated", description: "Your password has been changed successfully." })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        toast({ title: "Update Failed", description: result.error || "Password change failed.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const referralCode = referralStats?.referralCode || (user?.id ? user.id.slice(0, 8).toUpperCase() : "")
  const referralLink = `${getAppOrigin()}/r/${referralCode}`

  const handleCopyReferral = async () => {
    const success = await copyToClipboard(referralLink)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast({ title: "Copied!", description: "Referral link copied to clipboard." })
    }
  }

  if (!user) return null

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="My Profile"
        description="Manage your personal details and account settings"
        backHref="/dashboard"
        actions={
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success">Verified Session</span>
          </div>
        }
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column */}
        <motion.div variants={fadeUp} className="lg:col-span-4 space-y-5">

          {/* Identity card */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="h-20 bg-muted relative">
              <div className="h-0.5 w-full bg-primary absolute bottom-0" />
            </div>
            <div className="px-6 pb-6 -mt-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border-4 border-card flex items-center justify-center text-primary font-bold text-lg mb-3 ring-1 ring-border">
                  {initials || <User className="h-6 w-6" />}
                </div>
                <h2 className="text-base font-bold text-foreground">{user.firstName} {user.lastName}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />{user.email}
                </p>
                <span className={cn(
                  "mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                  user.isVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                )}>
                  {user.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Balance</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(user.walletBalance || 0)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Member Since</p>
                  <p className="text-sm font-bold text-foreground">
                    {user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral card */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Refer & Earn</h3>
              </div>
              <p className="text-xs text-muted-foreground">Share your link and earn rewards for every friend you invite.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2.5">
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">{referralLink}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={handleCopyReferral} aria-label="Copy referral link">
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {referralStats && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Referred", value: referralStats.totalReferred },
                    { label: "Qualified", value: referralStats.qualifiedReferrals },
                    { label: "Earnings", value: formatCurrency(referralStats.totalEarnings) },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-muted/40 border border-border p-2.5 text-center">
                      <p className="text-[9px] uppercase text-muted-foreground font-medium">{label}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button asChild size="sm" className="w-full gap-2 h-9" variant="outline">
                <Link href="/dashboard/history?type=referral">
                  <TrendingUp className="h-3.5 w-3.5" />
                  View Earnings
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
            {[
              { href: "/dashboard/history", icon: History, label: "Transaction History", sub: "View all past transactions" },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Right column */}
        <div className="lg:col-span-8 space-y-5">

          {/* Personal information */}
          <motion.div variants={fadeUp} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Update your name and contact details</p>
              </div>
              {isDirty && (
                <span className="text-[10px] text-warning font-medium px-2 py-0.5 rounded-full bg-warning/10">Unsaved changes</span>
              )}
            </div>
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange("firstName", e.target.value)}
                    required
                    className="h-10 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange("lastName", e.target.value)}
                    required
                    className="h-10 bg-background"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input id="email" value={user.email} disabled className="pl-9 h-10 bg-muted/30 opacity-70" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Email address cannot be changed</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      placeholder="024 000 0000"
                      className="pl-9 h-10 bg-background"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={isUpdatingProfile || !isDirty} size="sm" className="h-9 px-6 gap-2">
                  {isUpdatingProfile ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Password & Security */}
          <motion.div variants={fadeUp} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Password & Security</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Keep your account safe with a strong password</p>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-5 space-y-5">
              <div className="space-y-1.5 max-w-sm">
                <Label htmlFor="currentPassword" className="text-xs font-medium text-muted-foreground">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPw ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="pl-9 pr-10 h-10 bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrentPw ? "Hide password" : "Show password"}
                  >
                    {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-medium text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPw ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                      className="pr-10 h-10 bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showNewPw ? "Hide password" : "Show password"}
                    >
                      {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    className="h-10 bg-background"
                  />
                </div>
              </div>

              {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Minimum 8 characters required
                </div>
                <Button
                  type="submit"
                  disabled={
                    isUpdatingPassword ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                  variant="secondary"
                  size="sm"
                  className="h-9 px-6 gap-2"
                >
                  {isUpdatingPassword ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Updating...</> : "Update Password"}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Account info strip */}
          <motion.div variants={fadeUp} className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Account Protected</p>
              <p className="text-xs text-muted-foreground">Your session is encrypted and secured end-to-end.</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
