"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogoVideo } from "@/components/logo-video"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Menu,
  LayoutDashboard,
  Wifi,
  History,
  LogOut,
  User,
  Store,
  CreditCard,
  PhoneCall,
  ClipboardList,
  ShoppingCart,
  Package,
  BarChart3,
  Shield,
  Trophy,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  GraduationCap,
  Receipt,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NotificationsPanel } from "@/components/notifications-panel"
import { useLiveBalance } from "@/hooks/use-live-balance"
import { formatCurrency } from "@/lib/networks"

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/data", label: "Buy Data", icon: Wifi },
  { href: "/dashboard/verification", label: "Foreign Numbers", icon: PhoneCall },
  { href: "/dashboard/verification/history", label: "Verification History", icon: ClipboardList, indent: true },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap },
  { href: "/dashboard/bills", label: "Pay Bills", icon: Receipt },
  { href: "/dashboard/history", label: "Transaction History", icon: History },
]

const resellerNavExpanded = [
  { href: "/dashboard/reseller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reseller/purchase", label: "Buy Wholesale", icon: ShoppingCart },
  { href: "/dashboard/reseller/inventory", label: "My Inventory", icon: Package },
  { href: "/dashboard/reseller/marketing", label: "Marketing Tools", icon: Megaphone },
  { href: "/dashboard/reseller/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/reseller/security", label: "Security Center", icon: Shield },
  { href: "/dashboard/reseller/tiers", label: "Tier Progress", icon: Trophy },
  { href: "/dashboard/reseller/profile", label: "Profile Settings", icon: User },
]

const resellerNavSimple = [
  { href: "/dashboard/reseller", label: "Reseller Programme", icon: Store },
]

const preferencesNavItems = [
  { href: "/dashboard/profile", label: "Profile Settings", icon: User },
  { href: "/dashboard/wallet", label: "My Wallet", icon: CreditCard },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
  { href: "/dashboard/disputes", label: "My Disputes", icon: ShieldAlert },
]

const extraTitleRoutes: { href: string; label: string }[] = [
  { href: "/dashboard/reseller/apply", label: "Reseller Application" },
  { href: "/dashboard/reseller/status", label: "Application Status" },
  { href: "/dashboard/reseller/payment", label: "Reseller Payment" },
  { href: "/dashboard/reseller/payment/callback", label: "Payment Status" },
  { href: "/dashboard/verification/callback", label: "Verification" },
  { href: "/dashboard/scheduled", label: "Scheduled Purchases" },
]

const titleCandidates = [
  ...mainNavItems,
  ...resellerNavExpanded,
  ...resellerNavSimple,
  ...preferencesNavItems,
  ...extraTitleRoutes,
]

function resolvePageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard"
  let best: { href: string; label: string } | null = null
  for (const item of titleCandidates) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.href.length) {
        best = item
      }
    }
  }
  return best?.label ?? "Dashboard"
}

interface DashboardHeaderProps {
  sidebarCollapsed?: boolean
}

export function DashboardHeader({ sidebarCollapsed = false }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pageTitle = resolvePageTitle(pathname)
  const isReseller = user?.role === "RESELLER"
  const { balance, isValidating: balanceRefreshing } = useLiveBalance()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setOpen(false)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      setOpen(false)
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl transition-all duration-300 ease-out",
        "left-0 lg:left-64",
        sidebarCollapsed && "lg:left-[4.5rem]"
      )}
    >
      <div className="flex h-16 min-w-0 items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: logo (mobile) + page title */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Link href="/" className="flex shrink-0 items-center">
              <LogoVideo width={90} height={26} className="h-7 w-auto" />
            </Link>
            <div className="h-5 w-px bg-border shrink-0" />
            <h1 className="truncate text-sm font-semibold text-foreground">{pageTitle}</h1>
          </div>

          <div className="hidden min-w-0 flex-1 lg:flex lg:flex-col">
            <h1 className="text-base font-semibold tracking-tight text-foreground truncate">{pageTitle}</h1>
          </div>
        </div>

          {/* Right: live balance + notifications + user + mobile menu */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Live wallet balance chip */}
            {balance !== null && (
              <Link
                href="/dashboard/wallet"
                className={cn(
                  "hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 transition-colors hover:bg-muted",
                  balanceRefreshing && "opacity-70"
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground">Balance</span>
                <span className="text-xs font-bold text-foreground">{formatCurrency(balance)}</span>
                {balanceRefreshing && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-live-ping shrink-0" />
                )}
              </Link>
            )}
            <NotificationsPanel />

          {/* User info (desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[160px]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[280px] flex-col p-0 bg-card border-border">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex items-center gap-3 border-b border-border px-5 h-16">
                <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center">
                  <LogoVideo width={110} height={32} className="h-8 w-auto" />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                <nav className="space-y-0.5">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Main</p>
                  {mainNavItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          (item as { indent?: boolean }).indent ? "ml-4 py-2 text-xs" : "",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <nav className="space-y-0.5">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Business</p>
                  {(isReseller ? resellerNavExpanded : resellerNavSimple).map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <nav className="space-y-0.5">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Preferences</p>
                  {preferencesNavItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="h-10 w-full justify-start gap-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  {isLoggingOut ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
