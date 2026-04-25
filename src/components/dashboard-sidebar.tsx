"use client"

import Link from "next/link"
import { LogoVideo } from "@/components/logo-video"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Wifi,
  History,
  User,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Store,
  TrendingUp,
  PhoneCall,
  ClipboardList,
  GraduationCap,
  ShoppingCart,
  Package,
  BarChart3,
  Shield,
  Trophy,
  Megaphone,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  Globe2,
  Gift,
  Receipt,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/data", label: "Buy Data", icon: Wifi },
  { href: "/dashboard/esim", label: "Buy eSIM", icon: Smartphone },
  { href: "/dashboard/giftcards", label: "Gift Cards", icon: Gift },
  { href: "/dashboard/bills", label: "Pay Bills", icon: Receipt },
  { href: "/dashboard/proxies", label: "Proxies", icon: Globe2 },
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall },
  { href: "/dashboard/verification/history", label: "Verification History", icon: ClipboardList, indent: true },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap },
  { href: "/dashboard/history", label: "Transaction History", icon: History },
]

const resellerItems = [
  { href: "/dashboard/reseller", label: "Reseller Programme", icon: Store },
]

const resellerExpandedItems = [
  { href: "/dashboard/reseller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reseller/purchase", label: "Buy Wholesale", icon: ShoppingCart },
  { href: "/dashboard/reseller/inventory", label: "My Inventory", icon: Package },
  { href: "/dashboard/reseller/marketing", label: "Marketing Tools", icon: Megaphone },
  { href: "/dashboard/reseller/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/reseller/security", label: "Security Center", icon: Shield },
  { href: "/dashboard/reseller/tiers", label: "Tier Progress", icon: Trophy },
  { href: "/dashboard/reseller/profile", label: "Profile Settings", icon: User },
]

const secondaryItems = [
  { href: "/dashboard/profile", label: "Profile Settings", icon: User },
  { href: "/dashboard/wallet", label: "My Wallet", icon: CreditCard },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
  { href: "/dashboard/disputes", label: "My Disputes", icon: ShieldAlert },
]

interface DashboardSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function DashboardSidebar({ collapsed: controlledCollapsed, onCollapsedChange }: DashboardSidebarProps = {}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [resellerMenuOpen, setResellerMenuOpen] = useState(true)
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  
  const collapsed = controlledCollapsed ?? internalCollapsed
  const setCollapsed = (value: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange(value)
    } else {
      setInternalCollapsed(value)
    }
  }

  const isReseller = user?.role === 'RESELLER'
  const isResellerPage = pathname?.startsWith('/dashboard/reseller')

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[color:var(--marketing-accent)]/15 bg-[color:var(--marketing-cream)]/95 backdrop-blur-xl lg:flex transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex items-center justify-between", collapsed ? "p-4 justify-center" : "p-6")}>
        <Link href="/dashboard" className={cn("flex items-center gap-2.5 group", collapsed && "hidden")}>
          <LogoVideo
            width={140}
            height={40}
            className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-muted-foreground hover:bg-[color:var(--marketing-accent)]/10 hover:text-[color:var(--marketing-accent)] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
        <div>
          <h3 className={cn(
            "px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-body transition-opacity",
            collapsed && "opacity-0 hidden"
          )}>
            Main Menu
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all group",
                    collapsed ? "justify-center px-2 py-2.5" : (item as any).indent ? "px-4 py-2 ml-4 text-xs" : "px-4 py-2.5",
                    active
                      ? "bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]"
                      : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    collapsed ? "h-5 w-5" : (item as any).indent ? "h-3.5 w-3.5" : "h-4 w-4",
                    active ? "text-[color:var(--marketing-accent)]" : "group-hover:text-[color:var(--marketing-accent)]"
                  )} />
                  {!collapsed && item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <h3 className={cn(
            "px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-body transition-opacity",
            collapsed && "opacity-0 hidden"
          )}>
            Business
          </h3>
          <nav className="space-y-1">
            {!isReseller ? (
              // Simple menu for non-resellers
              resellerItems.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all group",
                      collapsed ? "justify-center px-2 py-2.5" : "px-4 py-2.5",
                      active
                        ? "bg-[#FF5630]/10 text-[#FF5630]"
                        : "text-muted-foreground hover:text-[#FF5630] hover:bg-[#FFE5E8]"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn(collapsed ? "h-5 w-5" : "h-4 w-4", active ? "text-[#FF5630]" : "group-hover:text-[#FF5630]")} />
                    {!collapsed && item.label}
                  </Link>
                )
              })
            ) : (
              // Expanded menu for resellers
              <>
                <button
                  onClick={() => !collapsed && setResellerMenuOpen(!resellerMenuOpen)}
                  className={cn(
                    "w-full flex items-center rounded-lg text-sm font-medium transition-all group",
                    collapsed ? "justify-center px-2 py-2.5" : "justify-between px-4 py-2.5",
                    isResellerPage
                      ? "bg-[#FF5630]/10 text-[#FF5630]"
                      : "text-muted-foreground hover:text-[#FF5630] hover:bg-[#FFE5E8]"
                  )}
                  title={collapsed ? "Reseller Hub" : undefined}
                >
                  <div className={cn("flex items-center gap-3", collapsed && "gap-0")}>
                    <Store className={cn(collapsed ? "h-5 w-5" : "h-4 w-4", isResellerPage ? "text-[#FF5630]" : "group-hover:text-[#FF5630]")} />
                    {!collapsed && <span>Reseller Hub</span>}
                  </div>
                  {!collapsed && (resellerMenuOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ))}
                </button>
                {resellerMenuOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {resellerExpandedItems.map((item) => {
                      const active = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all group",
                            collapsed ? "justify-center px-2 py-2" : "px-4 py-2",
                            active
                              ? "bg-[#FF5630]/10 text-[#FF5630]"
                              : "text-muted-foreground hover:text-[#FF5630] hover:bg-[#FFE5E8]"
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon className={cn(collapsed ? "h-5 w-5" : "h-4 w-4", active ? "text-[#FF5630]" : "group-hover:text-[#FF5630]")} />
                          {!collapsed && item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </nav>
        </div>

        <div>
          <h3 className={cn(
            "px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-body transition-opacity",
            collapsed && "opacity-0 hidden"
          )}>
            Preferences
          </h3>
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all group",
                    collapsed ? "justify-center px-2 py-2.5" : "px-4 py-2.5",
                    active
                      ? "bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]"
                      : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn(collapsed ? "h-5 w-5" : "h-4 w-4", active ? "text-[color:var(--marketing-accent)]" : "group-hover:text-[color:var(--marketing-accent)]")} />
                  {!collapsed && item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-[color:var(--marketing-accent)]/10 bg-[color:var(--marketing-cream-alt)]/40 p-4">
        <div className={cn("flex items-center gap-3 mb-4", collapsed ? "justify-center px-0" : "px-2")}>
          <div className={cn(
            "flex items-center justify-center rounded-full border border-[color:var(--marketing-accent)]/20 bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)] text-xs font-bold uppercase",
            collapsed ? "h-10 w-10 text-sm" : "h-9 w-9"
          )}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-muted-foreground truncate font-medium">{user?.email}</p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          onClick={() => logout()}
          className={cn(
            "gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300",
            collapsed ? "w-full justify-center px-2" : "w-full justify-start"
          )}
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn(collapsed ? "h-5 w-5" : "h-4 w-4")} />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  )
}
