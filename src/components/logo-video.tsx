"use client"

import { cn } from "@/lib/utils"

interface LogoVideoProps {
  width?: number
  height?: number
  className?: string
}

export function LogoVideo({ width = 140, height = 40, className }: LogoVideoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Topchart"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      loading="eager"
    />
  )
}
