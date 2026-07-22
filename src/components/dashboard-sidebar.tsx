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
  HelpCircle,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Store,
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
  Receipt,
  Wrench,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, serviceKey: null },
  { href: "/dashboard/data", label: "Buy Data", icon: Wifi, serviceKey: SERVICE_KEYS.DATA },
  { href: "/dashboard/bills", label: "Pay Bills", icon: Receipt, serviceKey: SERVICE_KEYS.BILLS },
  { href: "/dashboard/verification", label: "Foreign Numbers", icon: PhoneCall, serviceKey: SERVICE_KEYS.VERIFICATION },
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

  const isReseller = user?.role === "RESELLER"
  const isResellerPage = pathname?.startsWith("/dashboard/reseller")

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

  const NavLink = ({
    href,
    label,
    icon: Icon,
    indent = false,
    maintenance = false,
    maintenanceMsg = null,
    accent = false,
  }: {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    indent?: boolean
    maintenance?: boolean
    maintenanceMsg?: string | null
    accent?: boolean
  }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
          collapsed ? "justify-center px-2 py-2.5" : indent ? "px-4 py-2 ml-4 text-xs" : "px-3 py-2.5",
          active
            ? accent
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
            : accent
              ? "text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          maintenance && "opacity-60"
        )}
        title={collapsed ? (maintenance ? maintenanceMsg || "Under maintenance" : label) : maintenance ? maintenanceMsg || "Under maintenance" : undefined}
      >
        {active && !collapsed && (
          <span
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full",
              accent ? "bg-destructive" : "bg-primary"
            )}
          />
        )}
        <div className="relative shrink-0">
          <Icon
            className={cn(
              collapsed ? "h-5 w-5" : indent ? "h-3.5 w-3.5" : "h-4 w-4",
              active
                ? accent ? "text-destructive" : "text-primary"
                : "text-current"
            )}
          />
          {maintenance && !collapsed && (
            <Wrench className="absolute -top-1 -right-1 h-2.5 w-2.5 text-warning" />
          )}
        </div>
        {!collapsed && (
          <span className="flex items-center gap-2 truncate">
            {label}
            {maintenance && (
              <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-warning/10 text-warning border-warning/20">
                MAINT
              </Badge>
            )}
          </span>
        )}
      </Link>
    )
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-card lg:flex transition-all duration-300 ease-out",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center border-b border-border", collapsed ? "h-16 justify-center px-4" : "h-16 justify-between px-5")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <LogoVideo
              width={120}
              height={34}
              className="h-8 w-auto transition-opacity group-hover:opacity-80"
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "mx-auto"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Main Menu
            </p>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              if (item.serviceKey && !isEnabled(item.serviceKey)) return null
              const maintenance = item.serviceKey ? isMaintenance(item.serviceKey) : false
              const maintenanceMsg = item.serviceKey ? getMaintenanceMessage(item.serviceKey) : null
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  indent={(item as any).indent}
                  maintenance={maintenance}
                  maintenanceMsg={maintenanceMsg}
                />
              )
            })}
          </nav>
        </div>

        {/* Business */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Business
            </p>
          )}
          <nav className="space-y-0.5">
            {!isReseller ? (
              resellerItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))
            ) : (
              <>
                <button
                  onClick={() => !collapsed && setResellerMenuOpen(!resellerMenuOpen)}
                  className={cn(
                    "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5",
                    isResellerPage
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? "Reseller Hub" : undefined}
                >
                  <div className={cn("flex items-center gap-3", collapsed && "gap-0")}>
                    <Store className={cn(collapsed ? "h-5 w-5" : "h-4 w-4")} />
                    {!collapsed && <span>Reseller Hub</span>}
                  </div>
                  {!collapsed && (
                    resellerMenuOpen
                      ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                {resellerMenuOpen && !collapsed && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {resellerExpandedItems.map((item) => (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Preferences */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Preferences
            </p>
          )}
          <nav className="space-y-0.5">
            {secondaryItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* User footer */}
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase border border-primary/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase border border-primary/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full",
            collapsed ? "justify-center px-2" : "justify-start gap-3"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          {isLoggingOut ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut className={cn(collapsed ? "h-5 w-5" : "h-4 w-4")} />
          )}
          {!collapsed && (
            <span className="text-sm font-medium">
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </span>
          )}
        </Button>
      </div>
    </motion.aside>
  )
}
