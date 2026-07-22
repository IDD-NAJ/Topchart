"use client"

import React, { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { OfflineBanner } from "@/components/dashboard/offline-banner"
import { PopupBannerContainer } from "@/components/popup-banner"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, initialized, refreshUser } = useAuth()
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [stabilized, setStabilized] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const maxRetries = 4

  useEffect(() => {
    const t = setTimeout(() => setStabilized(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!stabilized || isLoading || !initialized || user || retryCount >= maxRetries) return
    const delays = [500, 1000, 2000, 3000]
    const attemptRefresh = async () => {
      await new Promise(resolve => setTimeout(resolve, delays[retryCount] ?? 1000))
      await refreshUser()
      setRetryCount(prev => prev + 1)
    }
    attemptRefresh()
  }, [stabilized, isLoading, initialized, user, retryCount, refreshUser])

  useEffect(() => {
    if (!stabilized || isLoading || !initialized || user || retryCount < maxRetries) return
    console.log('[Dashboard Layout] Auth initialized but no user, scheduling redirect to login')
    // Use microtask to avoid rendering conflicts
    const timer = setTimeout(() => {
      console.log('[Dashboard Layout] Executing redirect to login')
      router.replace("/login")
    }, 0)
    return () => clearTimeout(timer)
  }, [stabilized, user, isLoading, initialized, retryCount, router])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshUser()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [user, refreshUser])

  if (isLoading || !initialized || !stabilized || (!user && retryCount < maxRetries)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (!user) {
    console.log('[Dashboard Layout] No user after auth initialization, redirecting to login')
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <OfflineBanner />
      <PopupBannerContainer />
      <DashboardSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <div className={cn("flex-1 flex flex-col transition-all duration-300 ease-out", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
          <DashboardHeader sidebarCollapsed={sidebarCollapsed} />
          <main className="flex-1 pt-16 lg:pt-20 pb-40 lg:pb-0 overflow-x-hidden">
            <div className="container mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
              <Suspense
                fallback={
                  <div className="flex min-h-64 items-center justify-center" role="status">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--marketing-accent)]/30 border-t-transparent" />
                    <span className="sr-only">Loading page</span>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
          <div className="hidden lg:block">
            <DashboardFooter />
          </div>
          <MobileBottomNav />
        </div>
    </div>
  )
}
