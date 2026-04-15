"use client"

import React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InactivityWarningModal } from "@/components/inactivity-warning-modal"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Database,
  Users,
  Shield,
  LogOut,
  LayoutDashboard,
  CreditCard,
  Wallet,
  Receipt,
  Gift,
  MessageSquare,
  Settings,
  Network,
  Phone,
  Wifi,
  ChevronDown,
  ChevronRight,
  UserCog,
  Activity,
  FileText,
  Lock,
  Key,
  History,
  AlertCircle,
  Tag,
  Award,
  Eye,
  Layers,
  Menu,
  X,
  Building2,
  DollarSign,
  BarChart3,
  ShieldAlert,
  Megaphone,
  Trophy,
  Sliders,
  Smartphone,
  LayoutGrid
} from "lucide-react"

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    title: "User Management",
    icon: Users,
    children: [
      { title: "All Users", href: "/admin/users", icon: Users },
      { title: "Active Users", href: "/admin/active-users", icon: Activity },
      { title: "User Profiles", href: "/admin/user-profiles", icon: UserCog },
      { title: "User Sessions", href: "/admin/user-sessions", icon: History },
      { title: "Wallets", href: "/admin/wallets", icon: Wallet },
    ]
  },
  {
    title: "KYC Management",
    icon: FileText,
    children: [
      { title: "KYC Profiles", href: "/admin/kyc-profiles", icon: FileText },
      { title: "KYC Documents", href: "/admin/kyc-documents", icon: Eye },
      { title: "KYC Reviews", href: "/admin/kyc-reviews", icon: Shield },
    ]
  },
  {
    title: "Transactions",
    icon: CreditCard,
    children: [
      { title: "All Transactions", href: "/admin/transactions", icon: CreditCard },
      { title: "Payment Intents", href: "/admin/payment-intents", icon: Receipt },
      { title: "Provider Events", href: "/admin/payment-events", icon: Activity },
      { title: "Ledger Accounts", href: "/admin/ledger-accounts", icon: Layers },
      { title: "Ledger Entries", href: "/admin/ledger-entries", icon: FileText },
    ]
  },
  {
    title: "Purchases",
    icon: Phone,
    children: [
      { title: "Airtime Purchases", href: "/admin/airtime-purchases", icon: Phone },
      { title: "Data Purchases", href: "/admin/data-purchases", icon: Wifi },
    ]
  },
  {
    title: "Products",
    icon: Network,
    children: [
      { title: "Networks", href: "/admin/networks", icon: Network },
      { title: "Data Bundles", href: "/admin/data-bundles", icon: Wifi },
      { title: "Bundle Categories", href: "/admin/bundle-categories", icon: Layers },
      { title: "Result Checkers", href: "/admin/result-checkers", icon: CreditCard },
    ]
  },
  {
    title: "Reseller Management",
    icon: Building2,
    children: [
      { title: "Resellers", href: "/admin/resellers", icon: Users },
      { title: "Applications", href: "/admin/resellers?tab=applications", icon: FileText },
      { title: "Commissions", href: "/admin/resellers?tab=commissions", icon: DollarSign },
      { title: "Transactions", href: "/admin/resellers?tab=transactions", icon: CreditCard },
    ]
  },
  {
    title: "Referrals & Promos",
    icon: Gift,
    children: [
      { title: "Referrals", href: "/admin/referrals", icon: Users },
      { title: "Referral Rewards", href: "/admin/referral-rewards", icon: Award },
      { title: "Referral Visits", href: "/admin/referral-visits", icon: Eye },
      { title: "Referral Settings", href: "/admin/referral-settings", icon: Settings },
      { title: "Promo Codes", href: "/admin/promo-codes", icon: Tag },
      { title: "Promo Redemptions", href: "/admin/promo-redemptions", icon: Gift },
    ]
  },
  {
    title: "Support",
    icon: MessageSquare,
    children: [
      { title: "Tickets", href: "/admin/tickets", icon: MessageSquare },
      { title: "Ticket Messages", href: "/admin/ticket-messages", icon: FileText },
      { title: "Disputes", href: "/admin/disputes", icon: AlertCircle },
    ]
  },
  {
    title: "Admin Settings",
    icon: Settings,
    children: [
      { title: "Admin Users", href: "/admin/admin-users", icon: Shield },
      { title: "Action Logs", href: "/admin/action-logs", icon: History },
      { title: "Roles", href: "/admin/roles", icon: Key },
      { title: "Permissions", href: "/admin/permissions", icon: Lock },
    ]
  },
  {
    title: "Reseller Config",
    icon: Sliders,
    children: [
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { title: "Tiers", href: "/admin/tiers", icon: Trophy },
      { title: "Fraud Alerts", href: "/admin/fraud-alerts", icon: ShieldAlert },
      { title: "Marketing Assets", href: "/admin/marketing-assets", icon: Megaphone },
      { title: "Form Config", href: "/admin/reseller-form-config", icon: Sliders },
    ]
  },
  {
    title: "Verification",
    icon: Smartphone,
    children: [
      { title: "Overview", href: "/admin/verification", icon: Smartphone },
      { title: "Numbers", href: "/admin/verification/numbers", icon: Phone },
      { title: "Pricing", href: "/admin/verification/pricing", icon: DollarSign },
      { title: "SMS Log", href: "/admin/verification/sms", icon: MessageSquare },
    ]
  },
  { title: "Management", href: "/admin/management", icon: LayoutGrid },
  { title: "Raw Database", href: "/admin/db", icon: Database },
]

const INACTIVITY_TIMEOUT = 5 * 60 * 1000
const WARNING_BEFORE_LOGOUT = 30 * 1000

function isNavHrefActive(href: string, pathname: string, currentTab: string | null): boolean {
  const [hrefPath, hrefQuery = ""] = href.split("?");
  if (hrefPath !== pathname) {
    return false;
  }
  const params = new URLSearchParams(hrefQuery);
  const hrefTab = params.get("tab");
  if (!hrefTab) {
    return pathname !== "/admin/resellers" ? true : !currentTab || currentTab === "resellers";
  }
  return pathname === "/admin/resellers" && currentTab === hrefTab;
}

function NavSection({
  item,
  pathname,
  currentTab,
  collapsed
}: {
  item: NavItem;
  pathname: string;
  currentTab: string | null;
  collapsed: boolean
}) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon
  const isActive = item.href ? isNavHrefActive(item.href, pathname, currentTab) : false
  const hasActiveChild = item.children?.some(c => c.href ? isNavHrefActive(c.href, pathname, currentTab) : false)

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            hasActiveChild ? "bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]" : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children.map((child) => (
              <NavSection
                key={child.href}
                item={child}
                pathname={pathname}
                currentTab={currentTab}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive ? "bg-[color:var(--marketing-accent)] text-white" : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentTab = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tab")
    : null
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(30)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null }
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null }
  }, [])

  const handleLogout = useCallback(async () => {
    clearAllTimers()
    setShowWarning(false)
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.replace("/admin/login?reason=inactive")
  }, [clearAllTimers, router])

  const resetInactivityTimer = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsRemaining(30)
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) { handleLogout(); return 0 }
          return prev - 1
        })
      }, 1000)
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT)

    inactivityTimerRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT)
  }, [clearAllTimers, handleLogout])

  useEffect(() => {
    if (pathname === "/admin/login") { clearAllTimers(); return }

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click", "mousemove"]
    const onActivity = () => resetInactivityTimer()

    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
    resetInactivityTimer()

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity))
      clearAllTimers()
    }
  }, [pathname, resetInactivityTimer, clearAllTimers])

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false)
      return
    }
    const checkAdminAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth", {
          credentials: "include",
          cache: "no-store",
        })
        if (response.ok) {
          const result = await response.json()
          if (!result.success) {
            router.replace("/admin/login")
            return false
          }
          return true
        } else {
          router.replace("/admin/login")
          return false
        }
      } catch (error) {
        console.error("Admin auth check failed:", error)
        router.replace("/admin/login")
        return false
      }
    }
    checkAdminAuth().then((ok) => {
      if (!ok) return
      setLoading(false)
    })
  }, [pathname, router])

  if (pathname === "/admin/login") return <>{children}</>

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--marketing-cream)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--marketing-accent)]/30 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--marketing-cream)]">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden flex-col border-r border-[color:var(--marketing-accent)]/15 bg-[color:var(--marketing-cream)]/95 backdrop-blur-xl transition-all duration-300 md:flex",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="flex items-center justify-between border-b border-[color:var(--marketing-accent)]/10 p-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#FF5630]" />
              <span className="font-bold text-[color:var(--marketing-accent)]">Admin</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavSection
              key={item.title}
              item={item}
              pathname={pathname}
              currentTab={currentTab}
              collapsed={!sidebarOpen}
            />
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
              router.replace("/admin/login")
            }}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-[color:var(--marketing-accent)]/15 bg-[color:var(--marketing-cream)]">
            <div className="flex items-center justify-between border-b border-[color:var(--marketing-accent)]/10 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#FF5630]" />
                <span className="font-bold text-[color:var(--marketing-accent)]">Admin</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavSection
                  key={item.title}
                  item={item}
                  pathname={pathname}
                  currentTab={currentTab}
                  collapsed={false}
                />
              ))}
            </nav>
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                  router.replace("/admin/login")
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream)]/95 p-4 backdrop-blur-sm md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#FF5630]" />
            <span className="font-bold text-[color:var(--marketing-accent)]">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <Users className="h-5 w-5" />
          </Button>
        </header>

        {/* Desktop Header */}
        <header className="hidden items-center justify-between border-b border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream)]/95 p-4 backdrop-blur-sm md:flex">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            <Users className="w-4 h-4 mr-2" />
            User Dashboard
          </Button>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 pb-24 md:pb-6 overflow-x-hidden">
          {children}
        </main>

        <InactivityWarningModal
          isOpen={showWarning}
          secondsRemaining={secondsRemaining}
          onStayActive={resetInactivityTimer}
          onLogout={handleLogout}
        />

        <footer className="hidden border-t border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream-alt)]/50 p-4 text-center text-sm text-muted-foreground md:block">
          <p>© {new Date().getFullYear()} Topchart Admin. All rights reserved.</p>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream)]/95 pb-safe backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-around px-1 py-2 safe-area-bottom">
            <Link
              href="/admin"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                pathname === "/admin" ? "text-[color:var(--marketing-accent)]" : "text-muted-foreground"
              )}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">Dashboard</span>
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                pathname.startsWith("/admin/users") ? "text-[color:var(--marketing-accent)]" : "text-muted-foreground"
              )}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">Users</span>
            </Link>
            <Link
              href="/admin/transactions"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                pathname.startsWith("/admin/transactions") ? "text-[color:var(--marketing-accent)]" : "text-muted-foreground"
              )}
            >
              <CreditCard className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">Txns</span>
            </Link>
            <Link
              href="/admin/tickets"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                pathname.startsWith("/admin/tickets") ? "text-[#FF5630]" : "text-muted-foreground"
              )}
            >
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">Tickets</span>
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                router.replace("/admin/login")
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg text-muted-foreground min-w-[56px] min-h-[44px]"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">Logout</span>
            </button>
          </div>
          {/* Safe area padding for mobile devices */}
          <div className="h-safe-area-inset-bottom" />
        </nav>
        {/* Mobile bottom nav spacer */}
        <div className="md:hidden h-[calc(5rem+env(safe-area-inset-bottom))]" />
      </div>
    </div>
  )
}
