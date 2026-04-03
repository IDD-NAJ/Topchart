"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, LayoutDashboard, Phone, Wifi, History, LogOut, ArrowRight, User } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/airtime", label: "Airtime", icon: Phone },
  { href: "/dashboard/data", label: "Data", icon: Wifi },
  { href: "/dashboard/history", label: "History", icon: History },
]

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  // Get current page title from pathname
  const pageTitle = navItems.find(item => item.href === pathname)?.label || "Dashboard"

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-40 bg-background/50 backdrop-blur-md border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Mobile Logo & Title */}
          <div className="flex items-center gap-4 lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image 
                src="/logo.svg" 
                alt="Topchart" 
                width={100} 
                height={28} 
                className="h-7 w-auto object-contain"
              />
            </Link>
            <h1 className="text-sm font-bold tracking-tight">{pageTitle}</h1>
          </div>

        {/* Desktop Breadcrumb/Title */}
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Pages</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{pageTitle}</span>
        </div>

        {/* Right Side Utility */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-4 mr-4 text-right">
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">{user?.firstName} {user?.lastName}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Verified User</span>
            </div>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                  <SheetTitle className="sr-only">Dashboard Menu</SheetTitle>
                  <div className="p-6 border-b flex items-center gap-3">
                  <Image 
                    src="/logo.svg" 
                    alt="Topchart" 
                    width={120} 
                    height={32} 
                    className="h-8 w-auto object-contain"
                  />
                </div>
              
              <div className="flex-1 py-6 px-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="p-6 border-t bg-muted/20 mt-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                  className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
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
