"use client"

import { useAuth } from "@/lib/auth-context"
import { PreloadOverlay } from "@/components/preload-overlay"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const EXCLUDED_PATHS = ["/login", "/register", "/admin/login"]

export function PreloadWrapper({ children }: { children: React.ReactNode }) {
  const { showPreload } = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  const shouldShowPreload = showPreload && !EXCLUDED_PATHS.some(path => pathname?.startsWith(path))

  return (
    <>
      {children}
      <PreloadOverlay isVisible={shouldShowPreload} />
    </>
  )
}
