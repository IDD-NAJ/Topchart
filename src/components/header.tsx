"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Menu, Layers, CreditCard, Globe, HelpCircle, User, Home, Sparkles, Building2, Newspaper, Briefcase, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "#features", label: "Features", icon: Sparkles },
    { href: "#networks", label: "Networks", icon: Phone },
    { href: "/about", label: "About", icon: Building2 },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/careers", label: "Careers", icon: Briefcase },
    { href: "/faq", label: "FAQ", icon: HelpCircle },
  ]

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b",
        scrolled 
          ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm" 
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
            {/* Logo & System Status */}
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex items-center">
                  <span className="font-heading text-2xl font-normal tracking-tight text-foreground group-hover:text-primary-accent transition-colors duration-300">
                    Topchart
                  </span>
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-primary-accent bg-primary-accent/10 px-2 py-0.5 rounded-full">
                    GH
                  </span>
                </div>
              {scrolled && (
                <div className="flex items-center gap-1.5 animate-fade-in ml-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">System Online</span>
                </div>
              )}
              </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
                  style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
                >
                  {link.label}
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }} />
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <Button variant="ghost" asChild className="h-9 rounded-md px-4 font-semibold text-sm">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 px-3 py-2 rounded-lg hover:bg-muted"
                    style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
                  >
                    Sign in
                  </Link>
                  <Button asChild size="sm" className="h-10 px-6 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>
                    <Link href="/register">Get started</Link>
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
                  className="h-9 w-9 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[350px] p-0 flex flex-col">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <div className="p-6 flex items-center gap-3 border-b">
                    <div className="flex items-center">
                      <span className="font-heading text-xl font-normal tracking-tight text-foreground">
                        Topchart
                      </span>
                      <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-primary-accent bg-primary-accent/10 px-1.5 py-0.5 rounded-full">
                        GH
                      </span>
                    </div>
                  </div>
                
                <div className="flex-1 py-6">
                  <nav className="grid gap-1 px-4">
                    {navLinks.map((link, index) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-base font-medium"
                        style={{ 
                          transitionTimingFunction: 'var(--ease-out-expo)',
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <link.icon className="h-5 w-5 text-muted-foreground" />
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="p-6 border-t bg-muted/30">
                  {user ? (
                    <Button asChild onClick={() => setIsOpen(false)} className="w-full h-11">
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  ) : (
                    <div className="grid gap-3">
                      <Button asChild onClick={() => setIsOpen(false)} variant="outline" className="w-full h-11">
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button asChild onClick={() => setIsOpen(false)} className="w-full h-11">
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
    </header>
  )
}

