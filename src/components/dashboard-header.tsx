"use client"



import Link from "next/link"

import Image from "next/image"

import { usePathname, useRouter } from "next/navigation"

import { useState } from "react"

import { Menu, LayoutDashboard, Phone, Wifi, History, LogOut, ArrowRight, User, Store, CreditCard, ChevronDown, Shield, Trophy, Megaphone, BarChart3, PhoneCall, ClipboardList } from "lucide-react"



import { useAuth } from "@/lib/auth-context"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"



const mainNavItems = [

  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },

  { href: "/dashboard/airtime", label: "Airtime", icon: Phone },

  { href: "/dashboard/data", label: "Data", icon: Wifi },

  { href: "/dashboard/verification", label: "Verification", icon: PhoneCall },

  { href: "/dashboard/verification/history", label: "Verif. History", icon: ClipboardList, indent: true },

  { href: "/dashboard/history", label: "History", icon: History },

  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: CreditCard },

]



const resellerNavItems = [

  { href: "/dashboard/reseller", label: "Reseller", icon: Store },

  { href: "/dashboard/reseller/security", label: "Security", icon: Shield },

  { href: "/dashboard/reseller/tiers", label: "Tiers", icon: Trophy },

  { href: "/dashboard/reseller/marketing", label: "Marketing", icon: Megaphone },

  { href: "/dashboard/reseller/analytics", label: "Analytics", icon: BarChart3 },

]



const allNavItems = [...mainNavItems, ...resellerNavItems]



export function DashboardHeader() {

  const pathname = usePathname()

  const router = useRouter()

  const { user, logout } = useAuth()

  const [open, setOpen] = useState(false)



  // Get current page title from pathname

  const pageTitle = allNavItems.find(item => item.href === pathname)?.label || "Dashboard"



  return (

    <header className="fixed top-0 left-0 right-0 lg:left-64 z-40 bg-background/80 backdrop-blur-xl border-b border-[#006994]/10 shadow-sm">

      <div className="flex h-16 items-center justify-between px-4 md:px-6">

        {/* Mobile Logo & Title */}

        <div className="flex items-center gap-3 lg:hidden">

          <Link href="/dashboard" className="flex items-center gap-2">

            <Image 

              src="/logo.svg" 

              alt="Topchart" 

              width={100} 

              height={28} 

              className="h-7 w-auto object-contain"

            />

          </Link>

          <div className="h-6 w-px bg-border" />

          <h1 className="text-sm font-semibold">{pageTitle}</h1>

        </div>



        {/* Desktop Navigation Pills */}

        <div className="hidden lg:flex items-center gap-1">

          {allNavItems.map((item) => {

            const active = pathname === item.href

            const Icon = item.icon

            return (

              <Link

                key={item.href}

                href={item.href}

                className={cn(

                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",

                  active

                    ? "bg-[#006994] text-white shadow-md shadow-[#006994]/20"

                    : "text-muted-foreground hover:text-[#006994] hover:bg-[#EFF6FA]"

                )}

              >

                <Icon className="h-4 w-4" />

                {item.label}

              </Link>

            )

          })}

        </div>



        {/* Right Side User Menu */}

        <div className="flex items-center gap-3">

          <div className="hidden md:flex items-center gap-3">

            <div className="flex flex-col items-end">

              <span className="text-sm font-semibold">{user?.firstName} {user?.lastName}</span>

              <span className="text-xs text-muted-foreground">{user?.email}</span>

            </div>

            <div className="h-10 w-10 rounded-full bg-[#006994]/10 border-2 border-[#006994]/25 flex items-center justify-center text-[#006994] font-bold text-sm">

              {user?.firstName?.[0]}{user?.lastName?.[0]}

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

              

              <div className="flex-1 py-6 px-4 overflow-y-auto">

                <nav className="space-y-1">

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">

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

                </nav>

                <nav className="space-y-1 mt-4">

                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">

                    Reseller

                  </div>

                  {resellerNavItems.map((item) => {

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

                            ? "bg-[#722F37]/10 text-[#722F37]"

                            : "text-muted-foreground hover:text-[#722F37] hover:bg-[#FDF2F3]"

                        )}

                      >

                        <Icon className="h-5 w-5" />

                        {item.label}

                      </Link>

                    )

                  })}

                </nav>

              </div>



              <div className="p-6 border-t border-[#006994]/10 bg-[#EFF6FA]/30 mt-auto">

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

