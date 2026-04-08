"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Phone, 
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
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/airtime", label: "Buy Airtime", icon: Phone },
  { href: "/dashboard/data", label: "Buy Data", icon: Wifi },
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall },
  { href: "/dashboard/verification/history", label: "Verification History", icon: ClipboardList, indent: true },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap },
  { href: "/dashboard/history", label: "Transaction History", icon: History },
]

const resellerItems = [
  { href: "/dashboard/reseller", label: "Reseller Programme", icon: Store },
]

const secondaryItems = [
  { href: "/dashboard/profile", label: "Profile Settings", icon: User },
  { href: "/dashboard/wallet", label: "My Wallet", icon: CreditCard },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
  { href: "/dashboard/disputes", label: "My Disputes", icon: ShieldAlert },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-[#006994]/15 bg-background/80 backdrop-blur-xl z-40"
    >
      <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <Image 
              src="/logo.svg" 
              alt="Topchart" 
              width={140} 
              height={40} 
              className="h-9 w-auto object-contain"
            />
          </Link>
      </div>

      <div className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
        <div>
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-body">
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
                    (item as any).indent ? "px-4 py-2 ml-4 text-xs" : "px-4 py-2.5",
                    active
                      ? "bg-[#006994]/10 text-[#006994]"
                      : "text-muted-foreground hover:text-[#006994] hover:bg-[#EFF6FA]"
                  )}
                >
                  <Icon className={cn(
                    (item as any).indent ? "h-3.5 w-3.5" : "h-4 w-4",
                    active ? "text-[#006994]" : "group-hover:text-[#006994]"
                  )} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-body">
            Business
          </h3>
          <nav className="space-y-1">
            {resellerItems.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    active
                      ? "bg-[#722F37]/10 text-[#722F37]"
                      : "text-muted-foreground hover:text-[#722F37] hover:bg-[#FDF2F3]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-[#722F37]" : "group-hover:text-[#722F37]")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-body">
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
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    active
                      ? "bg-[#006994]/10 text-[#006994]"
                      : "text-muted-foreground hover:text-[#006994] hover:bg-[#EFF6FA]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-[#006994]" : "group-hover:text-[#006994]")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-[#006994]/10 bg-[#EFF6FA]/30">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-[#006994]/10 border border-[#006994]/20 flex items-center justify-center text-[#006994] font-bold text-xs uppercase">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate font-medium">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => logout()}
          className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300"
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </motion.aside>
  )
}
