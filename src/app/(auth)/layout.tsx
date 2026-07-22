"use client"

import React, { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()
  const redirected = useRef(false)

  useEffect(() => {
    if (!isLoading && user && !redirected.current) {
      redirected.current = true
      router.replace(isAdmin ? "/admin" : "/dashboard")
    }
  }, [user, isLoading, isAdmin, router])

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--marketing-accent,#F38F20)] border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
