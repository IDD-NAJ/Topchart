"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Phone,
  Wifi,
  History,
  LogOut,
  User,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  MoreHorizontal,
  PhoneCall,
  GraduationCap,
  Store,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const mainNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/airtime", label: "Airtime", icon: Phone },
  { href: "/dashboard/data", label: "Data", icon: Wifi },
  { href: "/dashboard/history", label: "History", icon: History },
]

const moreNavItems = [
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap },
  { href: "/dashboard/reseller", label: "Reseller Programme", icon: Store },
  { href: "/dashboard/wallet", label: "My Wallet", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile Settings", icon: User },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
  { href: "/dashboard/disputes", label: "Disputes", icon: ShieldAlert },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-50 pb-safe">
        <div className="flex items-center justify-around px-1 py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[60px] min-h-[48px]",
                  active ? "text-[#006994]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            )
          })}

          {/* More Sheet Trigger */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[60px] min-h-[48px]",
                  moreNavItems.some(item => pathname === item.href)
                    ? "text-[#006994]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MoreHorizontal className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[70vh]">
              <SheetHeader className="pb-4">
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              <nav className="space-y-2 pb-6">
                {moreNavItems.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-[#006994]/10 text-[#006994]"
                          : "text-muted-foreground hover:text-[#006994] hover:bg-[#EFF6FA]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
                <div className="pt-4 border-t mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMoreOpen(false)
                      logout()
                    }}
                    className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        {/* Safe area padding for mobile devices */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>

      {/* Mobile bottom nav spacer */}
      <div className="lg:hidden h-20" />
    </>
  )
}
