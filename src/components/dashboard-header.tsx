"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Menu,
  LayoutDashboard,
  Phone,
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
  Gift,
  GraduationCap,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/airtime", label: "Buy Airtime", icon: Phone },
  { href: "/dashboard/data", label: "Buy Data", icon: Wifi },
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall },
  { href: "/dashboard/verification/history", label: "Verification History", icon: ClipboardList, indent: true },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap },
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
  { href: "/dashboard/giftcards", label: "Gift Cards", icon: Gift },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
  { href: "/dashboard/disputes", label: "My Disputes", icon: ShieldAlert },
]

const extraTitleRoutes: { href: string; label: string }[] = [
  { href: "/dashboard/reseller/apply", label: "Reseller application" },
  { href: "/dashboard/reseller/status", label: "Application status" },
  { href: "/dashboard/reseller/payment", label: "Reseller payment" },
  { href: "/dashboard/reseller/payment/callback", label: "Payment status" },
  { href: "/dashboard/verification/callback", label: "Verification" },
]

const titleCandidates: { href: string; label: string }[] = [
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
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const pageTitle = resolvePageTitle(pathname)
  const isReseller = user?.role === "RESELLER"

  return (
    <header className={cn(
      "fixed right-0 top-0 z-40 border-b border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream)]/90 shadow-sm backdrop-blur-xl transition-all duration-300 ease-out",
      "left-0 lg:left-64",
      sidebarCollapsed && "lg:left-20"
    )}>
      <div className="flex h-16 min-w-0 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Topchart"
                width={100}
                height={28}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <div className="h-6 w-px shrink-0 bg-border" />
            <h1 className="truncate text-sm font-semibold">{pageTitle}</h1>
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Current page
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden max-w-[200px] md:flex md:flex-col md:items-end lg:max-w-[240px]">
            <span className="truncate text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[color:var(--marketing-accent)]/25 bg-[color:var(--marketing-accent)]/10 text-sm font-bold text-[color:var(--marketing-accent)] md:flex">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[280px] flex-col p-0">
              <SheetTitle className="sr-only">Dashboard Menu</SheetTitle>
              <div className="flex items-center gap-3 border-b p-6">
                <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center">
                  <Image
                    src="/logo.svg"
                    alt="Topchart"
                    width={120}
                    height={32}
                    className="h-8 w-auto object-contain"
                  />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6">
                <nav className="space-y-1">
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Main
                  </div>
                  {mainNavItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                          (item as { indent?: boolean }).indent ? "ml-2 py-2 text-xs" : "",
                          active
                            ? "bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]"
                            : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <nav className="mt-4 space-y-1">
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Business
                  </div>
                  {isReseller
                    ? resellerNavExpanded.map((item) => {
                        const active = pathname === item.href
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                              active
                                ? "bg-[#FF5630]/10 text-[#FF5630]"
                                : "text-muted-foreground hover:bg-[#FFE5E8] hover:text-[#FF5630]"
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {item.label}
                          </Link>
                        )
                      })
                    : resellerNavSimple.map((item) => {
                        const active = pathname === item.href
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                              active
                                ? "bg-[#FF5630]/10 text-[#FF5630]"
                                : "text-muted-foreground hover:bg-[#FFE5E8] hover:text-[#FF5630]"
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {item.label}
                          </Link>
                        )
                      })}
                </nav>

                <nav className="mt-4 space-y-1">
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Preferences
                  </div>
                  {preferencesNavItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                          active
                            ? "bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]"
                            : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="mt-auto border-t border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream-alt)]/40 p-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                  className="h-11 w-full justify-start gap-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-semibold">Sign Out</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
