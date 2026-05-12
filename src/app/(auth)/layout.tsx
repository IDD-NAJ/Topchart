"use client"

import React from "react"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()
  const mountedWithUser = useRef(false)

  useEffect(() => {
    if (!isLoading && user) {
      mountedWithUser.current = true
      router.replace(isAdmin ? "/admin" : "/dashboard")
    }
  }, [user, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--marketing-cream)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--marketing-accent)] border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--marketing-cream)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--marketing-accent)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--marketing-cream)]">
      <Header />
      <main className="flex-1 pt-[72px]">{children}</main>
      <Footer />
    </div>
  )
}
