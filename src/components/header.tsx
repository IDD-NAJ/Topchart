"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Menu,
  ArrowRight,
  User,
  ChevronDown,
  LayoutDashboard,
  Phone,
  Wifi,
  PhoneCall,
  GraduationCap,
  Gift,
  ShieldCheck,
  Sparkles,
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
  {
    href: "/dashboard/giftcards",
    label: "Gift cards",
    description: "Digital brands and denominations",
    icon: Gift,
  },
]

const topLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/faq", label: "Support" },
] as const

export function Header() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#1C252C]",
        scrolled
          ? "border-b border-white/10 shadow-lg backdrop-blur-xl bg-[#1C252C]/95"
          : "border-b border-white/5"
      )}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            opacity: scrolled ? 0.3 : 0,
            scale: scrolled ? 1 : 1.2,
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -left-20 top-0 h-full w-64 bg-gradient-to-r from-primary/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            delay: 4,
          }}
          className="absolute -right-20 top-0 h-full w-64 bg-gradient-to-l from-primary/20 to-transparent blur-3xl"
        />
      </div>

      <div className="relative mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          onHoverStart={() => setLogoHovered(true)}
          onHoverEnd={() => setLogoHovered(false)}
        >
          <Link href="/" className="shrink-0 flex items-center gap-2 group">
            <motion.span
              className="font-sans text-xl font-bold tracking-tight text-white relative"
              animate={{
                textShadow: logoHovered ? "0 0 20px rgba(var(--primary-rgb), 0.5)" : "none",
              }}
              transition={{ duration: 0.3 }}
            >
              Topchart
              <motion.span
                className="absolute -top-1 -right-2"
                animate={{
                  rotate: logoHovered ? 360 : 0,
                  scale: logoHovered ? 1 : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.span>
            </motion.span>
          </Link>
        </motion.div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Link
              href="/"
              className="relative text-sm font-medium text-white/70 transition-colors hover:text-white group"
            >
              <span className="relative z-10">Home</span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ borderRadius: '4px' }}
              />
            </Link>
          </motion.div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 text-sm font-medium text-white/70 outline-none transition-colors hover:text-white data-[state=open]:text-white group"
            >
              <span className="relative z-10">Services</span>
              <motion.div
                animate={{ rotate: servicesOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" aria-hidden />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="min-w-[320px] rounded border border-[#3A4B59] bg-[#27343E] p-3 text-white shadow-xl"
            >
              <div className="grid gap-1">
                {serviceLinks.map((s, index) => {
                  const Icon = s.icon
                  return (
                    <DropdownMenuItem key={s.href} asChild>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Link
                          href={s.href}
                          className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 outline-none transition-colors hover:bg-white/5 focus:bg-white/5 focus:text-white group relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <motion.div
                            className="flex mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-white/70 group-hover:bg-primary/20 group-hover:text-primary transition-colors relative z-10"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </motion.div>
                          <div className="flex flex-col gap-0.5 relative z-10">
                            <span className="text-sm font-medium text-white/95 group-hover:text-white">
                              {s.label}
                            </span>
                            <span className="text-xs text-white/50 leading-snug">
                              {s.description}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {topLinks
            .filter((l) => l.href !== "/")
            .map((l) => (
              <motion.div key={l.href} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Link
                  href={l.href}
                  className="relative text-sm font-medium text-white/70 transition-colors hover:text-white group"
                >
                  <span className="relative z-10">{l.label}</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.span
                    className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ borderRadius: '4px' }}
                  />
                </Link>
              </motion.div>
            ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {user ? (
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
               <Button
                 asChild
                 variant="ghost"
                 className="h-10 rounded bg-white/5 border border-white/10 px-4 text-white hover:bg-white/10 hover:border-primary/30 sm:px-5 transition-all font-sans font-semibold tracking-wide uppercase text-xs group relative overflow-hidden"
               >
                 <Link href="/dashboard" className="flex items-center gap-2 relative z-10">
                   <motion.div
                     animate={{ rotate: [0, 10, -10, 0] }}
                     transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                   >
                     <User className="h-4 w-4" />
                   </motion.div>
                   <span className="hidden sm:inline">DASHBOARD</span>
                 </Link>
               </Button>
             </motion.div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Link
                  href="/login"
                  className="relative text-sm font-semibold text-white/70 transition-colors hover:text-white uppercase tracking-wide group"
                >
                  <span className="relative z-10">Sign in</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Button asChild className="h-10 rounded bg-primary hover:bg-primary-dark text-primary-foreground font-bold px-6 border-none transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] uppercase tracking-widest text-xs relative overflow-hidden group">
                  <Link href="/register" className="flex items-center gap-2 relative z-10">
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="relative z-10">Get Started</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      className="relative z-10"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          )}

          <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden transition-colors"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-full sm:max-w-sm flex-col border-l border-[#3A4B59] bg-[#1C252C] p-0 text-white"
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-6 pt-12">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/5 transition-colors"
                    >
                      Home
                    </Link>
                  </motion.div>
                  <div className="rounded-lg">
                    <button
                      type="button"
                      onClick={() => setServicesOpen((o) => !o)}
                      className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-white/80 hover:bg-white/5 transition-colors"
                      aria-expanded={servicesOpen}
                    >
                      Services
                      <motion.div
                        animate={{ rotate: servicesOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown
                          className={cn("h-4 w-4 shrink-0 transition-transform opacity-70", servicesOpen && "rotate-180")}
                          aria-hidden
                        />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {servicesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-l border-white/10 ml-6 pl-2 py-2 mt-1 space-y-1">
                            {serviceLinks.map((s, index) => {
                              const Icon = s.icon
                              return (
                                <motion.div
                                  key={s.href}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                  <Link
                                    href={s.href}
                                    onClick={() => {
                                      setIsOpen(false)
                                      setServicesOpen(false)
                                    }}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                                  >
                                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                                    <span className="text-sm font-medium">{s.label}</span>
                                  </Link>
                                </motion.div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {topLinks
                    .filter((l) => l.href !== "/")
                    .map((l, index) => (
                      <motion.div
                        key={l.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                      >
                        <Link
                          href={l.href}
                          onClick={() => setIsOpen(false)}
                          className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/5 transition-colors"
                        >
                          {l.label}
                        </Link>
                      </motion.div>
                    ))}
                  {!user && (
                     <motion.div
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ duration: 0.3, delay: 0.3 }}
                     >
                       <Link
                         href="/login"
                         onClick={() => setIsOpen(false)}
                         className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/5 transition-colors md:hidden"
                       >
                         Sign in
                       </Link>
                     </motion.div>
                  )}
                </div>
                <div className="border-t border-[#3A4B59] p-6 bg-[#131A1F]">
                  {user ? (
                     <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                       <Button
                         asChild
                         className="w-full h-11 rounded bg-primary hover:bg-primary-dark text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-none"
                       >
                         <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                           Go to Dashboard
                         </Link>
                       </Button>
                     </motion.div>
                  ) : (
                     <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                       <Button
                         asChild
                         className="w-full h-11 rounded bg-primary hover:bg-primary-dark text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-none"
                       >
                         <Link href="/register" onClick={() => setIsOpen(false)}>
                           Get Started
                         </Link>
                       </Button>
                     </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </motion.div>
                    <span>Secure & Encrypted Platform</span>
                  </motion.div>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
