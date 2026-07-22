"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/roles"
import AdminShell from "@/components/admin/AdminShell"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, initialized } = useAuth()
  const router = useRouter()

  // Handle redirects after authentication is fully initialized
  useEffect(() => {
    if (isLoading || !initialized) return

    if (!user) {
      router.replace("/login?next=/admin")
      return
    }

    // Check if user is admin
    if (!isAdmin(user.role)) {
      router.replace("/dashboard")
      return
    }
  }, [user, isLoading, initialized, router])

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

  return <AdminShell>{children}</AdminShell>
}
