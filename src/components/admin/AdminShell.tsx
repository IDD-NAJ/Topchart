"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/disputes", label: "Disputes", icon: AlertCircle },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin navigation">
      {navItems.map((item) => {
        const Icon = item.icon
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooterLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-3">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ExternalLink className="h-5 w-5 shrink-0" />
        User Dashboard
      </Link>
    </div>
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Topchart Admin</span>
        </div>
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-3">
          <NavLinks />
          <SidebarFooterLinks />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-border px-4 py-4">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Shield className="h-5 w-5 text-primary" />
                    Topchart Admin
                  </SheetTitle>
                </SheetHeader>
                <div className="flex h-[calc(100%-4rem)] flex-col justify-between overflow-y-auto p-3">
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                  <SidebarFooterLinks onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="flex items-center gap-2 font-semibold text-foreground lg:hidden">
              <Shield className="h-5 w-5 text-primary" />
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.role || "ADMIN"}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  )
}
