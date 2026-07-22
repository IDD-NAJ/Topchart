"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/roles"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, initialized } = useAuth()
  const router = useRouter()
  const [redirectScheduled, setRedirectScheduled] = useState(false)

  // Handle redirects after authentication is fully initialized
  useEffect(() => {
    if (isLoading || !initialized || redirectScheduled) return

    if (!user) {
      setRedirectScheduled(true)
      const timer = setTimeout(() => {
        router.replace("/login?next=/admin")
      }, 0)
      return () => clearTimeout(timer)
    }

    // Check if user is admin
    if (!isAdmin(user.role)) {
      setRedirectScheduled(true)
      const timer = setTimeout(() => {
        router.replace("/dashboard")
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [user, isLoading, initialized, redirectScheduled, router])

  // Show loading state while checking authentication
  if (isLoading || !initialized || !user || !isAdmin(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
