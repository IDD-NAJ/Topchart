"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  AlertCircle,
  TrendingUp,
  Settings,
  Menu,
  LogOut,
  Shield,
  ExternalLink,
  Database,
  ShoppingCart,
  Store,
  AlertTriangle,
  ClipboardList,
  FileText,
  Image,
  Navigation,
  Bell,
  CheckSquare,
  Wrench,
  Activity,
  Gift,
  CreditCard,
  Receipt,
  ServerCog,
  Tag,
  Wifi,
  Network,
  Smartphone,
  Tickets,
  DollarSign,
  Zap,
  BookOpen,
  Eye,
  Box,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

type NavSection = {
  label: string
  items: {
    href: string
    label: string
    icon: React.ElementType
  }[]
}

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Users & Orders",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/guest-orders", label: "Guest Orders", icon: Receipt },
      { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Commerce & Products",
    items: [
      { href: "/admin/data-bundles", label: "Data Bundles", icon: Database },
      { href: "/admin/networks", label: "Networks", icon: Network },
      { href: "/admin/esim-products", label: "eSIM Products", icon: Smartphone },
      { href: "/admin/esim-orders", label: "eSIM Orders", icon: Tickets },
      { href: "/admin/proxy-services", label: "Proxy Services", icon: Zap },
      { href: "/admin/gift-cards", label: "Gift Cards", icon: CreditCard },
      { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
      { href: "/admin/datamart-setup", label: "Data Provider Setup", icon: Wifi },
      { href: "/admin/bulk-orders", label: "Bulk Orders", icon: Box },
      { href: "/admin/verification-pricing", label: "Verification Pricing", icon: DollarSign },
      { href: "/admin/resellers", label: "Resellers", icon: Store },
      { href: "/admin/referrals", label: "Referrals", icon: Gift },
      { href: "/admin/billing", label: "Billing", icon: Receipt },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { href: "/admin/disputes", label: "Disputes", icon: AlertCircle },
      { href: "/admin/fraud", label: "Fraud Alerts", icon: AlertTriangle },
      { href: "/admin/kyc-reviews", label: "KYC Reviews", icon: Eye },
      { href: "/admin/payment-events", label: "Payment Events", icon: DollarSign },
      { href: "/admin/audit", label: "Audit Logs", icon: ClipboardList },
      { href: "/admin/verification", label: "Verification", icon: CheckSquare },
      { href: "/admin/smspva-management", label: "Intl Numbers Management", icon: Smartphone },
    ],
  },
  {
    label: "Content & Marketing",
    items: [
      { href: "/admin/cms", label: "CMS / Pages", icon: FileText },
      { href: "/admin/media", label: "Media Library", icon: Image },
      { href: "/admin/marketing-assets", label: "Marketing Assets", icon: BookOpen },
      { href: "/admin/navigation-config", label: "Navigation", icon: Navigation },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Users & Permissions",
    items: [
      { href: "/admin/permissions", label: "Permissions", icon: Shield },
      { href: "/admin/roles", label: "Roles", icon: Users },
      { href: "/admin/favorites", label: "User Favorites", icon: Gift },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/result-checkers", label: "Result Checkers", icon: CheckSquare },
      { href: "/admin/service-status", label: "Service Status", icon: Activity },
      { href: "/admin/config", label: "Configuration", icon: ServerCog },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Admin navigation">
      {navSections.map((section, si) => (
        <div key={section.label} className={cn("space-y-0.5", si > 0 && "mt-3")}>
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none">
            {section.label}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                style={active ? { backgroundColor: "var(--marketing-accent,#F38F20)" } : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "Administrator"

  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground leading-tight">Topchart</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-2 py-2">
          <NavContent />
        </ScrollArea>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-border p-2 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            User Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-56">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="border-b border-border px-4 py-3">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
                      <Shield className="h-3.5 w-3.5 text-white" />
                    </div>
                    Topchart Admin
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-56px)]">
                  <div className="px-2 py-2">
                    <NavContent onNavigate={() => setMobileOpen(false)} />
                    <Separator className="my-3" />
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                      <ExternalLink className="h-4 w-4" />User Dashboard
                    </Link>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <span className="flex items-center gap-2 font-semibold text-foreground lg:hidden">
              <Shield className="h-4 w-4" style={{ color: "var(--marketing-accent,#F38F20)" }} />
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.role || "ADMIN"}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0" style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}>
              {initials}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out" className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 min-h-0">{children}</main>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  )
}
