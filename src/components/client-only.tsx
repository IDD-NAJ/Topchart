"use client"

import { useEffect, useState } from "react"

interface ClientOnlyProps {
  children: React.ReactNode
}

export function ClientOnly({ children }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted ? <>{children}</> : null
}
