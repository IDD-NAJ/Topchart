"use client"

import { useEffect, useRef, ReactNode } from "react"

interface HydrationBypassProps {
  children: ReactNode
  htmlContent?: string
}

export function HydrationBypass({ children, htmlContent }: HydrationBypassProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // After hydration, we can safely render the actual content
    if (containerRef.current && htmlContent) {
      containerRef.current.innerHTML = htmlContent
    }
  }, [htmlContent])

  return (
    <div 
      ref={containerRef}
      suppressHydrationWarning
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  )
}
