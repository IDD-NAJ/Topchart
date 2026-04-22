"use client"

import { cn } from "@/lib/utils"

interface LogoVideoProps {
  width?: number
  height?: number
  className?: string
}

export function LogoVideo({ width = 140, height = 40, className }: LogoVideoProps) {
  return (
    <video
      src="/IMG_7731.MP4"
      autoPlay
      muted
      loop
      playsInline
      width={width}
      height={height}
      className={cn("object-contain", className)}
      aria-label="Topchart"
    />
  )
}
