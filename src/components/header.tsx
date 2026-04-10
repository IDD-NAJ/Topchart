"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Menu,
  CreditCard,
  User,
  Home,
  Building2,
  Newspaper,
  Briefcase,
  Phone,
  PhoneCall,
  Wifi,
  History,
  Store,
  Shield,
  Trophy,
  Megaphone,
  BarChart3,
  ChevronDown,
  Zap,
  Signal,
  Grid3X3,
  Info,
  LifeBuoy,
  MessageSquare,
  FileText,
  HelpCircle,
  Gift,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  description?: string
  showOn: ('mobile' | 'desktop')[]
  auth?: 'authenticated' | 'unauthenticated' | 'all'
}

const navConfig: NavItem[] = [
  { href: "/", label: "Home", icon: Home, showOn: ['mobile', 'desktop'], auth: 'all' },
  { href: "/dashboard", label: "Services", icon: Grid3X3, showOn: ['mobile', 'desktop'], auth: 'all' },
  { href: "/about", label: "Company", icon: Building2, showOn: ['mobile', 'desktop'], auth: 'all' },
  { href: "/faq", label: "Support", icon: LifeBuoy, showOn: ['mobile', 'desktop'], auth: 'all' },
]

const servicesConfig: NavItem[] = [
  { href: "/dashboard/airtime", label: "Airtime", icon: Phone, description: "Instant top-up for all networks", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/data", label: "Data Bundles", icon: Wifi, description: "Affordable data packages", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/giftcards", label: "Gift Cards", icon: Gift, description: "Buy gift cards for popular brands", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall, description: "Temporary phone numbers for OTPs", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: CreditCard, description: "WAEC, BECE, NOVDEC results", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/reseller", label: "Reseller Program", icon: Store, description: "Earn commissions as a reseller", showOn: ['mobile'], auth: 'all' },
  { href: "/#networks", label: "Networks", icon: Signal, description: "MTN, Telecel, AirtelTigo", showOn: ['mobile'], auth: 'all' },
]

const companyConfig: NavItem[] = [
  { href: "/about", label: "About Us", icon: Info, description: "Our story and mission", showOn: ['mobile'], auth: 'all' },
  { href: "/blog", label: "Blog", icon: Newspaper, description: "News and updates", showOn: ['mobile'], auth: 'all' },
  { href: "/careers", label: "Careers", icon: Briefcase, description: "Join our team", showOn: ['mobile'], auth: 'all' },
]

const supportConfig: NavItem[] = [
  { href: "/faq", label: "FAQ", icon: HelpCircle, description: "Common questions", showOn: ['mobile'], auth: 'all' },
  { href: "/contact", label: "Contact", icon: MessageSquare, description: "Get in touch", showOn: ['mobile'], auth: 'all' },
  { href: "/terms", label: "Terms", icon: FileText, description: "Terms of service", showOn: ['mobile'], auth: 'all' },
]

const dashboardConfig: NavItem[] = [
  { href: "/dashboard/history", label: "History", icon: History, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller", label: "Reseller", icon: Store, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/security", label: "Security", icon: Shield, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/tiers", label: "Tiers", icon: Trophy, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/marketing", label: "Marketing", icon: Megaphone, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/analytics", label: "Analytics", icon: BarChart3, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
]

function filterNavItems(items: NavItem[], device: 'mobile' | 'desktop', isAuthenticated: boolean): NavItem[] {
  return items.filter(item => {
    const deviceMatch = item.showOn.includes(device)
    const authMatch = item.auth === 'all' ||
      (item.auth === 'authenticated' && isAuthenticated) ||
      (item.auth === 'unauthenticated' && !isAuthenticated)
    return deviceMatch && authMatch
  })
}

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative group px-3 py-2 text-sm font-semibold text-slate-800 hover:text-[#006994] transition-colors duration-200"
    >
      {children}
      <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-[#006994] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out rounded-full" />
    </Link>
  )
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 420, damping: 26 },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.13 } },
}

export function Header() {
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [servicesExpanded, setServicesExpanded] = useState(false)
  const servicesDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300",
        scrolled
          ? "border-b border-slate-200 shadow-[0_1px_16px_0_rgba(0,0,0,0.08)] py-2"
          : "border-b border-slate-100 py-3"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">

          {/* Logo + Desktop Nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
              <Link href="/" className="flex items-center gap-2">
                <span className="font-bold text-xl lg:text-[1.35rem] tracking-tight text-slate-900">
                  Topchart
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-white bg-[#006994] px-2 py-0.5 rounded-full">
                  GH
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5">
              <NavLink href="/">Home</NavLink>

              {/* Services Dropdown */}
              <div ref={servicesDropdownRef} className="relative z-50">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={cn(
                    "relative group flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors duration-200",
                    servicesOpen ? "text-[#006994]" : "text-slate-800 hover:text-[#006994]"
                  )}
                >
                  Services
                  <motion.span
                    animate={{ rotate: servicesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.span>
                  <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-[#006994] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out rounded-full" />
                </button>

                <AnimatePresence>
                  {servicesOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full left-0 mt-2.5 w-[300px] bg-white rounded-xl shadow-xl shadow-slate-200/70 border border-slate-200 p-2 z-50"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 px-3 pt-1">Our Services</p>
                      <div className="grid gap-0.5">
                        {servicesConfig.slice(0, 5).map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setServicesOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors duration-150 group"
                            >
                              <div className="p-1.5 rounded-md bg-[#006994]/8 shrink-0">
                                <Icon className="h-4 w-4 text-[#006994]" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 group-hover:text-[#006994] transition-colors duration-150">{item.label}</p>
                                <p className="text-xs text-slate-400 leading-tight">{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink href="/about">Company</NavLink>
              <NavLink href="/faq">Support</NavLink>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <Button
                    variant="ghost"
                    asChild
                    className="h-9 rounded-lg px-4 font-semibold text-sm bg-[#006994] text-white hover:bg-[#00567A] shadow-sm transition-colors duration-200"
                  >
                    <Link href="/dashboard" className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span className="hidden xl:inline">Dashboard</span>
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="relative group hidden md:flex text-sm font-semibold text-slate-700 hover:text-[#006994] transition-colors duration-200 px-3 py-2"
                  >
                    Sign in
                    <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-[#006994] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out rounded-full" />
                  </Link>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <Button
                      asChild
                      className="h-9 px-5 rounded-lg bg-[#006994] text-white hover:bg-[#00567A] font-semibold text-sm transition-colors duration-200 shadow-sm"
                    >
                      <Link href="/register" className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 hidden sm:block" />
                        <span className="hidden sm:inline">Get started</span>
                        <span className="sm:hidden">Start</span>
                      </Link>
                    </Button>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-700 hover:text-[#006994] transition-colors duration-200 xl:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </motion.button>
              </SheetTrigger>

              <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col bg-white">
                <SheetTitle className="sr-only">Menu</SheetTitle>

                {/* Drawer Header */}
                <div className="px-6 py-5 flex items-center border-b border-slate-200">
                  <span className="font-bold text-xl tracking-tight text-slate-900">Topchart</span>
                  <span className="ml-2 text-[9px] font-extrabold uppercase tracking-widest text-white bg-[#006994] px-2 py-0.5 rounded-full">GH</span>
                </div>

                <div className="flex-1 py-5 overflow-y-auto">
                  {/* Main Nav */}
                  <nav className="grid gap-0.5 px-4 mb-6">
                    {filterNavItems(navConfig, 'mobile', isAuthenticated).map((link, index) => (
                      <motion.div
                        key={link.label}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          visible: {
                            opacity: 1, x: 0,
                            transition: { delay: index * 0.05, type: "spring", stiffness: 380, damping: 30 }
                          }
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-50 transition-colors duration-200 text-base font-bold text-slate-800 hover:text-[#006994]"
                        >
                          <div className="p-2 rounded-lg bg-slate-100">
                            <link.icon className="h-4 w-4 text-slate-600" />
                          </div>
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Services - Collapsible */}
                  <div className="px-4 mb-6">
                    <button
                      onClick={() => setServicesExpanded(!servicesExpanded)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-200"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Services</span>
                      <motion.span
                        animate={{ rotate: servicesExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {servicesExpanded && (
                        <motion.nav
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="grid gap-0.5 mt-1 overflow-hidden"
                        >
                          {filterNavItems(servicesConfig, 'mobile', isAuthenticated).map((service) => {
                            const Icon = service.icon
                            return (
                              <Link
                                key={service.href}
                                href={service.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors duration-150 text-sm font-semibold text-slate-700 hover:text-[#006994]"
                              >
                                <div className="p-1.5 rounded-md bg-[#006994]/8 shrink-0">
                                  <Icon className="h-4 w-4 text-[#006994]" />
                                </div>
                                <div>
                                  <p className="font-semibold">{service.label}</p>
                                  <p className="text-xs text-slate-400 font-normal">{service.description}</p>
                                </div>
                              </Link>
                            )
                          })}
                        </motion.nav>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Dashboard Quick Links */}
                  {user && (
                    <div className="px-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-4">Dashboard</p>
                      <nav className="grid grid-cols-2 gap-1.5">
                        {filterNavItems(dashboardConfig, 'mobile', isAuthenticated).map((item, index) => {
                          const Icon = item.icon
                          return (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.04, type: "spring", stiffness: 380, damping: 28 }}
                            >
                              <Link
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 text-sm font-semibold text-slate-700 hover:text-[#006994]"
                              >
                                <Icon className="h-4 w-4 text-slate-400" />
                                {item.label}
                              </Link>
                            </motion.div>
                          )
                        })}
                      </nav>
                    </div>
                  )}
                </div>

                {/* Drawer Footer CTAs */}
                <div className="p-5 border-t border-slate-100">
                  {user ? (
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        asChild
                        onClick={() => setIsOpen(false)}
                        className="w-full h-12 rounded-xl bg-[#006994] text-white font-bold hover:bg-[#00567A] transition-colors duration-200 shadow-sm"
                      >
                        <Link href="/dashboard" className="flex items-center justify-center gap-2">
                          <User className="h-5 w-5" />
                          Go to Dashboard
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="grid gap-2.5">
                      <Button
                        asChild
                        onClick={() => setIsOpen(false)}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-slate-200 font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                      >
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          asChild
                          onClick={() => setIsOpen(false)}
                          className="w-full h-12 rounded-xl bg-[#006994] text-white font-bold hover:bg-[#00567A] transition-colors duration-200 shadow-sm"
                        >
                          <Link href="/register">Create account</Link>
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

