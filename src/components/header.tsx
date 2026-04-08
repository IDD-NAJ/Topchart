"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Menu,
  Layers,
  CreditCard,
  User,
  Home,
  Sparkles,
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
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Navigation Item Type
interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  color?: string
  description?: string
  showOn: ('mobile' | 'desktop')[]
  auth?: 'authenticated' | 'unauthenticated' | 'all'
}

// Navigation Configuration - Single source of truth
const navConfig: NavItem[] = [
  { href: "/", label: "Home", icon: Home, color: "bg-blue-500/10 text-blue-600", showOn: ['mobile', 'desktop'], auth: 'all' },
  { href: "/dashboard", label: "Services", icon: Grid3X3, color: "bg-[#006994]/10 text-[#006994]", showOn: ['mobile', 'desktop'], auth: 'all' },
  { href: "/about", label: "Company", icon: Building2, color: "bg-purple-500/10 text-purple-600", showOn: ['mobile', 'desktop'], auth: 'all' },
  { href: "/faq", label: "Support", icon: LifeBuoy, color: "bg-emerald-500/10 text-emerald-600", showOn: ['mobile', 'desktop'], auth: 'all' },
]

// Services submenu configuration
const servicesConfig: NavItem[] = [
  { href: "/dashboard/airtime", label: "Airtime", icon: Phone, color: "bg-yellow-500/10 text-yellow-600", description: "Instant top-up for all networks", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/data", label: "Data Bundles", icon: Wifi, color: "bg-blue-500/10 text-blue-600", description: "Affordable data packages", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/verification", label: "Verification Numbers", icon: PhoneCall, color: "bg-green-500/10 text-green-600", description: "Temporary phone numbers for OTPs", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/result-checkers", label: "Result Checkers", icon: CreditCard, color: "bg-purple-500/10 text-purple-600", description: "WAEC, BECE, NOVDEC results", showOn: ['mobile'], auth: 'all' },
  { href: "/dashboard/reseller", label: "Reseller Program", icon: Store, color: "bg-amber-500/10 text-amber-600", description: "Earn commissions as a reseller", showOn: ['mobile'], auth: 'all' },
  { href: "/#networks", label: "Networks", icon: Signal, color: "bg-orange-500/10 text-orange-600", description: "MTN, Telecel, AirtelTigo", showOn: ['mobile'], auth: 'all' },
]

// Company submenu configuration
const companyConfig: NavItem[] = [
  { href: "/about", label: "About Us", icon: Info, description: "Our story and mission", showOn: ['mobile'], auth: 'all' },
  { href: "/blog", label: "Blog", icon: Newspaper, description: "News and updates", showOn: ['mobile'], auth: 'all' },
  { href: "/careers", label: "Careers", icon: Briefcase, description: "Join our team", showOn: ['mobile'], auth: 'all' },
]

// Support submenu configuration
const supportConfig: NavItem[] = [
  { href: "/faq", label: "FAQ", icon: HelpCircle, description: "Common questions", showOn: ['mobile'], auth: 'all' },
  { href: "/contact", label: "Contact", icon: MessageSquare, description: "Get in touch", showOn: ['mobile'], auth: 'all' },
  { href: "/terms", label: "Terms", icon: FileText, description: "Terms of service", showOn: ['mobile'], auth: 'all' },
]

// Dashboard links - only for authenticated users
const dashboardConfig: NavItem[] = [
  { href: "/dashboard/history", label: "History", icon: History, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller", label: "Reseller", icon: Store, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/security", label: "Security", icon: Shield, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/tiers", label: "Tiers", icon: Trophy, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/marketing", label: "Marketing", icon: Megaphone, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
  { href: "/dashboard/reseller/analytics", label: "Analytics", icon: BarChart3, showOn: ['mobile', 'desktop'], auth: 'authenticated' },
]

// Filter function based on device and auth
function filterNavItems(items: NavItem[], device: 'mobile' | 'desktop', isAuthenticated: boolean): NavItem[] {
  return items.filter(item => {
    const deviceMatch = item.showOn.includes(device)
    const authMatch = item.auth === 'all' || 
      (item.auth === 'authenticated' && isAuthenticated) ||
      (item.auth === 'unauthenticated' && !isAuthenticated)
    return deviceMatch && authMatch
  })
}

export function Header() {
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [servicesExpanded, setServicesExpanded] = useState(false)
  const [companyExpanded, setCompanyExpanded] = useState(false)
  const [supportExpanded, setSupportExpanded] = useState(false)
  const moreDropdownRef = useRef<HTMLDivElement>(null)
  const servicesDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(e.target as Node)) setServicesOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-[#006994]/20 shadow-sm shadow-[#006994]/10 py-2"
          : "bg-gradient-to-b from-white/90 to-white/60 backdrop-blur-md border-b border-white/20 py-3"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo & System Status */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center">
                <div className="relative">
                  <span className="font-heading text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-[#006994] to-[#1A85B8] bg-clip-text text-transparent group-hover:from-[#00567A] group-hover:to-[#006994] transition-all duration-300">
                    Topchart
                  </span>
                </div>
                <span className="ml-1.5 text-[9px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#722F37] to-[#9B4450] px-2 py-0.5 rounded-full shadow-sm">
                  GH
                </span>
              </div>
              {scrolled && (
                <div className="hidden xl:flex items-center gap-1.5 animate-fade-in ml-3 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Online</span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#006994] transition-all duration-200 rounded-lg hover:bg-[#EFF6FA]">
                Home
              </Link>

              {/* Services Dropdown */}
              <div ref={servicesDropdownRef} className="relative z-50">
                <button
                  onClick={() => { setServicesOpen(!servicesOpen); setMoreOpen(false) }}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#006994] transition-all duration-200 rounded-lg hover:bg-[#EFF6FA] flex items-center gap-1.5"
                >
                  Services
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", servicesOpen && "rotate-180")} />
                </button>
                {servicesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100/80 p-3 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 z-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">Our Services</p>
                    <div className="grid gap-0.5">
                      {servicesConfig.slice(0, 5).map((item, idx) => {
                        const Icon = item.icon
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setServicesOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#EFF6FA] transition-all duration-200 group"
                            style={{ animationDelay: `${idx * 25}ms` }}
                          >
                            <div className={cn("p-2 rounded-lg shrink-0", item.color)}><Icon className="h-4 w-4" /></div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700 group-hover:text-[#006994]">{item.label}</p>
                              <p className="text-xs text-slate-400">{item.description}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/about" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#006994] transition-all duration-200 rounded-lg hover:bg-[#EFF6FA]">Company</Link>
              <Link href="/faq" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#006994] transition-all duration-200 rounded-lg hover:bg-[#EFF6FA]">Support</Link>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Desktop Auth Buttons - Compact */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <Button
                  variant="ghost"
                  asChild
                  className="h-9 rounded-lg px-4 font-medium text-sm bg-gradient-to-r from-[#006994] to-[#1A85B8] text-white hover:from-[#00567A] hover:to-[#006994] shadow-sm hover:shadow-md hover:shadow-[#006994]/25 transition-all duration-200"
                >
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="hidden xl:inline">Dashboard</span>
                  </Link>
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden md:flex text-sm font-medium text-slate-600 hover:text-[#006994] transition-all duration-200 px-3 py-2 rounded-lg hover:bg-[#EFF6FA]"
                  >
                    Sign in
                  </Link>
                  <Button
                    asChild
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#722F37] to-[#9B4450] text-white hover:from-[#5C2530] hover:to-[#722F37] font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#722F37]/25"
                  >
                    <Link href="/register" className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 hidden sm:block" />
                      <span className="hidden sm:inline">Get started</span>
                      <span className="sm:hidden">Start</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-[#EFF6FA] hover:text-[#006994] lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col bg-white data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full duration-300">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="p-6 flex items-center gap-3 border-b border-[#006994]/15 bg-gradient-to-r from-[#EFF6FA] to-white animate-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center">
                    <span className="font-heading text-xl font-bold tracking-tight bg-gradient-to-r from-[#006994] to-[#1A85B8] bg-clip-text text-transparent">
                      Topchart
                    </span>
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#722F37] to-[#9B4450] px-2 py-0.5 rounded-full">
                      GH
                    </span>
                  </div>
                </div>

                <div className="flex-1 py-6 overflow-y-auto">
                  {/* Main Navigation */}
                  <nav className="grid gap-1 px-4 mb-6">
                    {filterNavItems(navConfig, 'mobile', isAuthenticated).map((link, index) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#EFF6FA] transition-all duration-300 text-base font-semibold text-slate-700 hover:text-[#006994] animate-in slide-in-from-right-4 fill-mode-backwards"
                        style={{ animationDelay: `${index * 75}ms`, animationDuration: '400ms' }}
                      >
                        <div className={cn("p-2 rounded-lg transition-transform duration-200", link.color)}>
                          <link.icon className="h-5 w-5" />
                        </div>
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Services Section - Collapsible */}
                  <div className="px-4 mb-6">
                    <button
                      onClick={() => setServicesExpanded(!servicesExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[#EFF6FA] transition-all duration-200"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Services
                      </p>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", servicesExpanded && "rotate-180")} />
                    </button>
                    {servicesExpanded && (
                      <nav className="grid gap-1 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {filterNavItems(servicesConfig, 'mobile', isAuthenticated).map((service, index) => {
                          const Icon = service.icon
                          return (
                            <Link
                              key={service.href}
                              href={service.href}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#EFF6FA] transition-all duration-200 text-sm font-medium text-slate-600 hover:text-[#006994]"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className={cn("p-2 rounded-lg", service.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{service.label}</p>
                                <p className="text-xs text-slate-400">{service.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </nav>
                    )}
                  </div>

                  {/* Dashboard Section - Only for logged in users */}
                  {user && (
                    <div className="px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards" style={{ animationDelay: '600ms' }}>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-4">
                        Dashboard Links
                      </p>
                      <nav className="grid grid-cols-2 gap-2">
                        {filterNavItems(dashboardConfig, 'mobile', isAuthenticated).map((item, index) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#EFF6FA] transition-all duration-200 text-sm font-medium text-slate-600 hover:text-[#006994] animate-in zoom-in-95 fill-mode-backwards"
                              style={{ animationDelay: `${700 + index * 40}ms`, animationDuration: '250ms' }}
                            >
                              <Icon className="h-4 w-4 text-slate-400" />
                              {item.label}
                            </Link>
                          )
                        })}
                      </nav>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: '800ms' }}>
                  {user ? (
                    <Button
                      asChild
                      onClick={() => setIsOpen(false)}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#006994] to-[#1A85B8] text-white font-semibold hover:from-[#00567A] hover:to-[#006994] shadow-md hover:shadow-lg hover:shadow-[#006994]/25 transition-all duration-300"
                    >
                      <Link href="/dashboard" className="flex items-center justify-center gap-2">
                        <User className="h-5 w-5" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <div className="grid gap-3">
                      <Button
                        asChild
                        onClick={() => setIsOpen(false)}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-slate-200 font-semibold hover:bg-slate-100 hover:border-slate-300 transition-all duration-300"
                      >
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button
                        asChild
                        onClick={() => setIsOpen(false)}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-[#722F37] to-[#9B4450] text-white font-semibold hover:from-[#5C2530] hover:to-[#722F37] shadow-md hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
                      >
                        <Link href="/register">Create account</Link>
                      </Button>
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

