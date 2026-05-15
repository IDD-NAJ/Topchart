"use client"

import { useAuth } from "@/lib/auth-context"

export function AuthLoadingScreen() {
  const { showPreload } = useAuth()

  if (!showPreload) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--marketing-cream)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--marketing-accent)]/30 border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
