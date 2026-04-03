"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { OfflineBanner } from "@/components/dashboard/offline-banner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 2

  useEffect(() => {
    // On mount, if not loading and no user, try refreshing
    // This handles the case where cookie might not be immediately available after redirect
    if (!isLoading && !user && retryCount < maxRetries) {
      const attemptRefresh = async () => {
        setRetryCount(prev => prev + 1)
        // Wait a bit for cookie to be available after redirect
        await new Promise(resolve => setTimeout(resolve, 300 * (retryCount + 1)))
        await refreshUser()
      }
      attemptRefresh()
    }
  }, [isLoading, user, retryCount, refreshUser])

  useEffect(() => {
    // Only redirect if we've exhausted retries and still no user
    if (!isLoading && !user && retryCount >= maxRetries) {
      const timer = setTimeout(() => {
        router.replace("/login")
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, isLoading, retryCount, router])

  // Show loading while checking auth or retrying
  if (isLoading || (!user && retryCount < maxRetries)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show loading briefly while redirecting if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <OfflineBanner />
      <DashboardSidebar />
        <div className="flex-1 flex flex-col lg:pl-64">
          <DashboardHeader />
          <main className="flex-1 pt-20 pb-20 lg:pb-0">
            <div className="container mx-auto px-4 py-8 max-w-6xl">{children}</div>
          </main>
          <div className="hidden lg:block">
            <DashboardFooter />
          </div>
          <MobileBottomNav />
        </div>
    </div>
  )
}
