"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Menu,
  ChevronDown,
  LayoutDashboard,
  Phone,
  Wifi,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
  Asterisk,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const serviceLinks: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Balances, referrals, and activity",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/airtime",
    label: "Airtime",
    description: "Instant top-ups for all networks",
    icon: Phone,
  },
  {
    href: "/dashboard/data",
    label: "Data bundles",
    description: "Plans for every need",
    icon: Wifi,
  },
  {
    href: "/dashboard/verification",
    label: "Verification numbers",
    description: "Temporary numbers for SMS codes",
    icon: PhoneCall,
  },
  {
    href: "/dashboard/result-checkers",
    label: "Result checkers",
    description: "Exam results and PINs",
    icon: GraduationCap,
  },
]

const topLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "Support" },
] as const

export function Header() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 transition-all duration-300"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* LOGO */}
        <Link href="/" className="shrink-0 flex items-center group relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0071CE] flex items-center justify-center shadow-sm">
              <Asterisk className="w-4 h-4 text-white" />
            </div>
            <span className="font-sans text-xl font-bold tracking-tight flex items-center text-slate-900">
              Topchart
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {topLinks.map((l) => {
            if (l.label === "Home") {
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-slate-700 hover:text-[#0071CE] transition-colors"
                >
                  {l.label}
                </Link>
              )
            }
            return null
          })}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-[#0071CE] outline-none transition-colors group data-[state=open]:text-[#0071CE]"
            >
              Services
              <ChevronDown className="h-4 w-4 opacity-70 group-data-[state=open]:rotate-180 transition-transform duration-200" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="min-w-[320px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              <div className="grid gap-1">
                {serviceLinks.map((s) => {
                  const Icon = s.icon
                  return (
                    <DropdownMenuItem key={s.href} asChild className="focus:bg-[#0071CE]/5 focus:text-[#0071CE] cursor-pointer rounded-md">
                      <Link
                        href={s.href}
                        className="flex items-center gap-3 px-3 py-2.5 outline-none transition-colors w-full"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#0071CE]/10 text-[#0071CE]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-slate-900">
                            {s.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {s.description}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {topLinks.map((l) => {
            if (l.label !== "Home") {
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-slate-700 hover:text-[#0071CE] transition-colors"
                >
                  {l.label}
                </Link>
              )
            }
            return null
          })}
        </nav>

        {/* CTA ACTIONS */}
        <div className="flex shrink-0 items-center gap-4 z-10">
          {user ? (
             <Button
               asChild
               variant="outline"
               className="h-9 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-sm font-medium px-5"
             >
               <Link href="/dashboard">
                 Dashboard
               </Link>
             </Button>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-[#0071CE] transition-colors px-2"
              >
                Sign In
              </Link>
              <Button
                asChild
                className="h-9 rounded-lg bg-[#0071CE] hover:bg-[#0056a8] text-white text-sm font-medium px-5"
              >
                <Link href="/register">
                  Get Started
                </Link>
              </Button>
            </div>
          )}

          {/* MOBILE MENU TRIGGER */}
          <Sheet
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) setServicesOpen(false)
            }}
          >
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg md:hidden text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full sm:max-w-sm flex-col border-l border-slate-200 bg-white p-0"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4 pt-12">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Home
                </Link>

                <div className="rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setServicesOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    aria-expanded={servicesOpen}
                  >
                    Services
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 transition-transform text-slate-400", servicesOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-l border-slate-200 ml-5 pl-2 py-1 mt-1 space-y-1">
                          {serviceLinks.map((s) => {
                            const Icon = s.icon
                            return (
                              <Link
                                key={s.href}
                                href={s.href}
                                onClick={() => {
                                  setIsOpen(false)
                                  setServicesOpen(false)
                                }}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Icon className="h-4 w-4 shrink-0 text-[#0071CE]" aria-hidden />
                                <span className="text-sm font-medium">{s.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {topLinks
                  .filter((l) => l.href !== "/")
                  .map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}

                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors sm:hidden"
                  >
                    Sign In
                  </Link>
                )}
              </div>

              <div className="border-t border-slate-200 p-6 bg-slate-50">
                {user ? (
                   <Button
                     asChild
                     className="w-full h-10 rounded-lg bg-[#0071CE] hover:bg-[#0056a8] text-white font-medium"
                   >
                     <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                       Go to Dashboard
                     </Link>
                   </Button>
                ) : (
                   <Button
                     asChild
                     className="w-full h-10 rounded-lg bg-[#0071CE] hover:bg-[#0056a8] text-white font-medium"
                   >
                     <Link href="/register" onClick={() => setIsOpen(false)}>
                       Get Started
                     </Link>
                   </Button>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Secure & Encrypted</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
