"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Shield, Users, LogOut, Menu, ArrowRight, LayoutDashboard, Database, Activity, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: Activity },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: Database },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/admin/promo-codes", label: "Promotions", icon: Zap },
]

export default function AdminHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 transition-all duration-300">
      <div className="w-full max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between rounded-2xl border border-white/10 bg-background/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] supports-[backdrop-filter]:bg-background/40">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-4 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-[0_0_20px_rgba(0,212,170,0.3)] group-hover:scale-105 transition-all">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">Admin Console</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              className="rounded-xl px-4 text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <Link href="/dashboard">
                <Users className="w-4 h-4 mr-2" />
                User View
              </Link>
            </Button>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/login'}
              className="rounded-xl px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] border-l border-white/10 bg-background/95 backdrop-blur-3xl p-0 overflow-hidden">
              <div className="flex flex-col h-full relative">
                {/* Decorative background element */}
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] -z-10" />

                <div className="p-8 pt-12 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                      <Shield className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <SheetTitle className="text-2xl font-bold tracking-tight">Admin</SheetTitle>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-4">Management</h3>
                      <nav className="grid gap-2">
                        {adminNavItems.map((item) => {
                          const active = pathname === item.href
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "group flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98]",
                                active 
                                  ? "bg-accent/10 border-accent/20" 
                                  : "hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                                  active
                                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                                    : "bg-white/5 border border-white/10 group-hover:bg-accent/10 group-hover:border-accent/20"
                                )}>
                                  <Icon className={cn("h-5 w-5 transition-all", active ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent")} />
                                </div>
                                <span className={cn(
                                  "text-lg font-medium transition-all",
                                  active ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                                )}>{item.label}</span>
                              </div>
                              <ArrowRight className={cn(
                                "h-5 w-5 transition-all",
                                active ? "text-accent opacity-100" : "text-muted-foreground/30 group-hover:text-accent group-hover:translate-x-1"
                              )} />
                            </Link>
                          )
                        })}
                      </nav>
                    </div>
                  </div>
                </div>

                <div className="p-8 mt-auto border-t border-white/5 bg-white/[0.02]">
                  <div className="grid gap-3">
                    <Button
                      variant="outline"
                      asChild
                      size="lg"
                      className="w-full h-14 rounded-2xl font-semibold border-white/10 hover:bg-white/5 transition-all active:scale-95"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/dashboard" className="flex items-center justify-center gap-2">
                        <LayoutDashboard className="h-5 w-5" />
                        Back to Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-14 rounded-2xl font-semibold border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95"
                      onClick={() => {
                        setOpen(false)
                        window.location.href = '/login'
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
