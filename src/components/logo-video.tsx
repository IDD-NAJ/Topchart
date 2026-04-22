"use client"

import { cn } from "@/lib/utils"
import { useHomepageMedia } from "@/hooks/use-homepage-media"

interface LogoVideoProps {
  width?: number
  height?: number
  className?: string
}

export function LogoVideo({ width = 140, height = 40, className }: LogoVideoProps) {
  const { media } = useHomepageMedia()
  const headerMedia = media.find(m => m.section_key === "header_logo" && m.is_active)

  if (headerMedia) {
    if (headerMedia.asset_type === "video") {
      return (
        <video
          src={headerMedia.public_url}
          autoPlay
          muted
          loop
          playsInline
          width={width}
          height={height}
          className={cn("object-contain", className)}
          aria-label="Topchart Logo"
        />
      )
    } else {
      return (
        <img
          src={headerMedia.public_url}
          alt={headerMedia.alt_text || "Topchart Logo"}
          width={width}
          height={height}
          className={cn("object-contain", className)}
        />
      )
    }
  }

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
