"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CreditCard, 
  Gift, 
  Copy, 
  Check, 
  ArrowLeft,
  Target,
  Zap,
  ShieldAlert,
  Fingerprint,
  Activity,
  History,
  Link as LinkIcon
} from "lucide-react"
import { formatCurrency } from "@/lib/networks"
import { copyToClipboard } from "@/lib/clipboard"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Registry Updated",
          description: "Your local profile synchronization is complete.",
        })
        await refreshUser()
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to synchronize profile changes.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "System Error",
        description: "An unexpected connectivity error occurred during sync.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New authentication keys do not match.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePassword",
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Keys Rotated",
          description: "Your authentication credentials have been successfully updated.",
        })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "The provider node rejected the key rotation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "System Error",
        description: "An unexpected error occurred during credential update.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCopyReferral = async () => {
    const link = `${window.location.origin}/r/${user?.id?.slice(0, 8).toUpperCase()}`
    const success = await copyToClipboard(link)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">
      
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest mb-2 group">
            <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Back to Command Center
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Account Configuration</h1>
          <p className="text-muted-foreground">Securely manage your identity and network access protocols.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Encrypted Session</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Profile Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-primary/20">
            <div className="h-28 bg-primary/10 relative">
               <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <div className="h-24 w-24 rounded-2xl bg-background border-4 border-background shadow-2xl flex items-center justify-center text-primary font-bold text-3xl uppercase ring-1 ring-primary/10">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
               </div>
            </div>
            <CardContent className="pt-16 pb-8 text-center space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">{user.firstName} {user.lastName}</h2>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Badge variant={user.isVerified ? "outline" : "secondary"} className={cn(
                  "px-3 py-1 uppercase text-[10px] font-bold tracking-tighter",
                  user.isVerified ? "bg-green-50 text-green-600 border-green-200" : "bg-amber-50 text-amber-600 border-amber-200"
                )}>
                  {user.isVerified ? "Node Verified" : "Awaiting Audit"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dashed">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Liquidity</p>
                  <p className="text-sm font-black text-primary">{formatCurrency(user.walletBalance || 0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Audit Score</p>
                  <p className="text-sm font-black text-foreground">A+</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth Node (Referral) */}
          <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 rotate-12">
                <Gift className="w-32 h-32 text-primary" />
             </div>
             <CardHeader className="pb-2">
               <CardTitle className="text-base flex items-center gap-2">
                 <Gift className="w-4 h-4 text-primary" />
                 Growth Incentives
               </CardTitle>
               <CardDescription>Scale your earnings by expanding our network.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 pt-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-primary/20">
                 <div className="flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono truncate max-w-[120px]">{user.id.slice(0, 8).toUpperCase()}</span>
                 </div>
                 <Button 
                   size="sm" 
                   variant="ghost"
                   className="h-7 w-7 p-0"
                   onClick={handleCopyReferral}
                 >
                   {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                 </Button>
               </div>
               <div className="flex gap-2">
                 <Button asChild size="sm" className="flex-1 h-8 text-[9px] uppercase font-bold tracking-widest">
                    <Link href="/dashboard">View Earnings</Link>
                 </Button>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Configuration Forms */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Identity Sync */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
               <Fingerprint className="w-4 h-4 text-primary" />
               <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Identity Registry</h2>
            </div>
            <Card>
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle className="text-base">Personal Parameters</CardTitle>
                <CardDescription>Modify your core identity fields and communication endpoint.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        required
                        className="h-11 font-medium"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        required
                        className="h-11 font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Endpoint</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input id="email" value={user.email} disabled className="pl-10 h-11 bg-muted/30 border-dashed font-medium opacity-70" />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Endpoint is locked to primary account ID.</p>
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mobile Endpoint</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="pl-10 h-11 font-medium"
                          placeholder="024 000 0000"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isUpdatingProfile} className="h-11 px-8 font-bold uppercase tracking-widest text-xs group">
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Synchronizing...
                        </>
                      ) : (
                        <>
                          Authorize Updates
                          <Zap className="w-3 h-3 ml-2 group-hover:scale-125 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Key Rotation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
               <ShieldAlert className="w-4 h-4 text-primary" />
               <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Security Protocol</h2>
            </div>
            <Card>
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle className="text-base">Credential Rotation</CardTitle>
                <CardDescription>Cycle your authentication keys to maintain node security.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleUpdatePassword} className="space-y-8">
                  <div className="space-y-2.5 max-w-sm">
                    <Label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Authentication Key</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Access Key</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm New Access Key</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                     <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] font-bold uppercase text-amber-700">8+ Characters Required</span>
                     </div>
                    <Button type="submit" disabled={isUpdatingPassword} variant="secondary" className="h-11 px-8 font-bold uppercase tracking-widest text-xs">
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rotating Keys...
                        </>
                      ) : (
                        "Rotate Credentials"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* System Audit Log Access */}
          <section className="space-y-4">
            <Card className="bg-muted/30 border-dashed">
               <CardContent className="p-6 flex items-center justify-between gap-4">
                 <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center shrink-0">
                      <History className="w-5 h-5 text-muted-foreground" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider">Access Audit Logs</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                        Review all account activity, synchronization events, and security logs for your infrastructure nodes.
                      </p>
                   </div>
                 </div>
                 <Button asChild variant="outline" size="sm" className="h-9 px-6 font-bold uppercase tracking-tighter text-[10px]">
                    <Link href="/dashboard/history">Audit Trail</Link>
                 </Button>
               </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, variant = "outline", className }: { children: React.ReactNode, variant?: "outline" | "secondary", className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "outline" ? "text-foreground" : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      className
    )}>
      {children}
    </span>
  )
}
