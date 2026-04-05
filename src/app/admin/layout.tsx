"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
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
    ]
  },
  {
    title: "Referrals & Promos",
    icon: Gift,
    children: [
      { title: "Referrals", href: "/admin/referrals", icon: Users },
      { title: "Referral Rewards", href: "/admin/referral-rewards", icon: Award },
      { title: "Referral Visits", href: "/admin/referral-visits", icon: Eye },
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

function NavSection({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon
  const hrefPath = item.href?.split("?")[0]
  const isActive = hrefPath === pathname
  const hasActiveChild = item.children?.some(c => c.href?.split("?")[0] === pathname)

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
            hasActiveChild ? "bg-[#006994]/10 text-[#006994]" : "text-muted-foreground hover:bg-[#EFF6FA] hover:text-[#006994]"
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
              <NavSection key={child.href} item={child} pathname={pathname} collapsed={collapsed} />
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
        isActive ? "bg-[#006994] text-white" : "text-muted-foreground hover:bg-[#EFF6FA] hover:text-[#006994]"
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
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-[#006994]/15 bg-background/90 backdrop-blur-xl transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4 border-b border-[#006994]/10 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#722F37]" />
              <span className="font-bold text-[#006994]">Admin</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavSection key={item.title} item={item} pathname={pathname} collapsed={!sidebarOpen} />
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
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-[#006994]/15 z-50 flex flex-col">
            <div className="p-4 border-b border-[#006994]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#722F37]" />
                <span className="font-bold text-[#006994]">Admin</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavSection key={item.title} item={item} pathname={pathname} collapsed={false} />
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
        <header className="md:hidden border-b border-[#006994]/10 bg-background/90 backdrop-blur-sm p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#722F37]" />
            <span className="font-bold text-[#006994]">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <Users className="h-5 w-5" />
          </Button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex border-b border-[#006994]/10 bg-background/90 backdrop-blur-sm p-4 items-center justify-between">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            <Users className="w-4 h-4 mr-2" />
            User Dashboard
          </Button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        <footer className="border-t border-[#006994]/10 bg-background/50 p-4 text-center text-sm text-muted-foreground hidden md:block">
          <p>© {new Date().getFullYear()} Topchart Admin. All rights reserved.</p>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-[#006994]/10 z-40">
          <div className="flex items-center justify-around p-2">
            <Link
              href="/admin"
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                pathname === "/admin" ? "text-[#006994]" : "text-muted-foreground"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px]">Dashboard</span>
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                pathname.startsWith("/admin/users") ? "text-[#006994]" : "text-muted-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px]">Users</span>
            </Link>
            <Link
              href="/admin/transactions"
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                pathname.startsWith("/admin/transactions") ? "text-[#006994]" : "text-muted-foreground"
              )}
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-[10px]">Txns</span>
            </Link>
            <Link
              href="/admin/tickets"
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                pathname.startsWith("/admin/tickets") ? "text-[#722F37]" : "text-muted-foreground"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-[10px]">Tickets</span>
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                router.replace("/admin/login")
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px]">Logout</span>
            </button>
          </div>
          {/* Safe area padding for mobile devices */}
          <div className="h-safe-area-inset-bottom" />
        </nav>
        {/* Mobile bottom nav spacer */}
        <div className="md:hidden h-20" />
      </div>
    </div>
  )
}
