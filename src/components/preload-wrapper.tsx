"use client"

import { useAuth } from "@/lib/auth-context"
import { PreloadOverlay } from "@/components/preload-overlay"
import { usePathname } from "next/navigation"

const EXCLUDED_PATHS = ["/login", "/register", "/admin/login"]

export function PreloadWrapper({ children }: { children: React.ReactNode }) {
  const { showPreload } = useAuth()
  const pathname = usePathname()

  const shouldShowPreload = showPreload && !EXCLUDED_PATHS.some(path => pathname?.startsWith(path))

  return (
    <>
      {children}
      <PreloadOverlay isVisible={shouldShowPreload} />
    </>
  )
}
