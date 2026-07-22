"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wifi,
  History,
  User,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  MoreHorizontal,
  HelpCircle,
  PhoneCall,
  GraduationCap,
  Store,
  Receipt,
  LogOut,
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
  { href: "/dashboard/data", label: "Data", icon: Wifi },
  { href: "/dashboard/history", label: "History", icon: History },
]

const moreNavItems = [
  { href: "/dashboard/bills", label: "Pay Bills", icon: Receipt },
  { href: "/dashboard/verification", label: "Foreign Numbers", icon: PhoneCall },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: GraduationCap },
  { href: "/dashboard/reseller", label: "Reseller Programme", icon: Store },
  { href: "/dashboard/wallet", label: "My Wallet", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile Settings", icon: User },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
  { href: "/dashboard/faq", label: "Help & FAQ", icon: HelpCircle },
  { href: "/dashboard/disputes", label: "Disputes", icon: ShieldAlert },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setMoreOpen(false)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      setMoreOpen(false)
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-safe backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around px-1 py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                  moreNavItems.some((item) => pathname === item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium leading-none">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[72vh] bg-card border-border rounded-t-2xl">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-sm font-semibold">More Options</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 pb-2">
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
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/40 text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              <div className="pt-3 border-t border-border mt-2 pb-safe">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  {isLoggingOut ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer for mobile */}
      <div className="lg:hidden h-20" />
    </>
  )
}
