"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogoVideo } from "@/components/logo-video"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useServiceStatus, SERVICE_KEYS } from "@/hooks/use-service-status"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Wrench,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, serviceKey: null },
  { href: "/dashboard/data", label: "Buy Data", icon: Wifi, serviceKey: SERVICE_KEYS.DATA },
  { href: "/dashboard/esim", label: "Buy eSIM", icon: Smartphone, serviceKey: SERVICE_KEYS.ESIM },
  { href: "/dashboard/giftcards", label: "Gift Cards", icon: Gift, serviceKey: SERVICE_KEYS.GIFTCARDS },
  { href: "/dashboard/bills", label: "Pay Bills", icon: Receipt, serviceKey: SERVICE_KEYS.BILLS },
  { href: "/dashboard/proxies", label: "Proxies", icon: Globe2, serviceKey: SERVICE_KEYS.PROXY },
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall, serviceKey: SERVICE_KEYS.VERIFICATION },
  { href: "/dashboard/verification/history", label: "Verification History", icon: ClipboardList, indent: true, serviceKey: SERVICE_KEYS.VERIFICATION },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap, serviceKey: SERVICE_KEYS.RESULT_CHECKER },
  { href: "/dashboard/history", label: "Transaction History", icon: History, serviceKey: null },
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
  { href: "/dashboard/faq", label: "Help & FAQ", icon: HelpCircle },
  { href: "/dashboard/disputes", label: "My Disputes", icon: ShieldAlert },
]

interface DashboardSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function DashboardSidebar({ collapsed: controlledCollapsed, onCollapsedChange }: DashboardSidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { isEnabled, isMaintenance, getMaintenanceMessage } = useServiceStatus()
  const [resellerMenuOpen, setResellerMenuOpen] = useState(true)
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
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

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
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
              if (item.serviceKey && !isEnabled(item.serviceKey)) return null
              const active = pathname === item.href
              const Icon = item.icon
              const maintenance = item.serviceKey ? isMaintenance(item.serviceKey) : false
              const maintenanceMsg = item.serviceKey ? getMaintenanceMessage(item.serviceKey) : null
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all group",
                    collapsed ? "justify-center px-2 py-2.5" : (item as any).indent ? "px-4 py-2 ml-4 text-xs" : "px-4 py-2.5",
                    active
                      ? "bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]"
                      : "text-muted-foreground hover:bg-[color:var(--marketing-cream-alt)] hover:text-[color:var(--marketing-accent)]",
                    maintenance && "opacity-60"
                  )}
                  title={collapsed ? (maintenance ? maintenanceMsg || "Under maintenance" : item.label) : maintenance ? maintenanceMsg || "Under maintenance" : undefined}
                >
                  <div className="relative">
                    <Icon className={cn(
                      collapsed ? "h-5 w-5" : (item as any).indent ? "h-3.5 w-3.5" : "h-4 w-4",
                      active ? "text-[color:var(--marketing-accent)]" : "group-hover:text-[color:var(--marketing-accent)]"
                    )} />
                    {maintenance && !collapsed && (
                      <Wrench className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-500" />
                    )}
                  </div>
                  {!collapsed && (
                    <span className="flex items-center gap-2">
                      {item.label}
                      {maintenance && <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-amber-100 text-amber-700 border-amber-200">MAINT</Badge>}
                    </span>
                  )}
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
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300",
            collapsed ? "w-full justify-center px-2" : "w-full justify-start"
          )}
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
          title={collapsed ? "Sign Out" : undefined}
        >
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut className={cn(collapsed ? "h-5 w-5" : "h-4 w-4")} />
          )}
          {!collapsed && <span className="text-sm font-medium">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>}
        </Button>
      </div>
    </motion.aside>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[color:var(--marketing-cream)]/95 backdrop-blur-xl border-t border-[color:var(--marketing-accent)]/15 safe-area-bottom">
        <nav className="flex items-center justify-around h-16 px-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
              pathname === "/dashboard"
                ? "text-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/10"
                : "text-muted-foreground hover:text-[color:var(--marketing-accent)]"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Overview</span>
          </Link>
          
          <Link
            href="/dashboard/data"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
              pathname?.startsWith("/dashboard/data")
                ? "text-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/10"
                : "text-muted-foreground hover:text-[color:var(--marketing-accent)]"
            )}
          >
            <Wifi className="h-5 w-5" />
            <span className="text-[10px] font-medium">Data</span>
          </Link>
          
          <Link
            href="/dashboard/history"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
              pathname === "/dashboard/history"
                ? "text-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/10"
                : "text-muted-foreground hover:text-[color:var(--marketing-accent)]"
            )}
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] font-medium">History</span>
          </Link>
          
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
              pathname === "/dashboard/profile"
                ? "text-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/10"
                : "text-muted-foreground hover:text-[color:var(--marketing-accent)]"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
          
          <button
            onClick={() => logout()}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </nav>
      </div>
    </>
  )
}
