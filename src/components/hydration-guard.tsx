"use client"

import { useEffect, useState } from "react"

interface HydrationGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function HydrationGuard({ children, fallback = null }: HydrationGuardProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
