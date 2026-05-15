"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim()
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim()
  const enabled = process.env.NEXT_PUBLIC_TAWK_ENABLED !== "false"
  const { user } = useAuth()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const hasValidConfig = Boolean(
    propertyId &&
    widgetId &&
    propertyId !== "your-tawk-property-id" &&
    widgetId !== "your-tawk-widget-id"
  )
  const isAdminRoute = pathname?.startsWith("/admin")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !hasValidConfig || !user || isAdminRoute || loadError) return

    let attempts = 0
    const maxAttempts = 5

    const trySetAttributes = () => {
      if (attempts >= maxAttempts || loadError) return
      attempts++
      try {
        const api = (window as unknown as { Tawk_API?: { setAttributes?: (a: Record<string, string>) => void } }).Tawk_API
        if (api?.setAttributes) {
          api.setAttributes({
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            email: user.email,
          })
        } else {
          setTimeout(trySetAttributes, 1500)
        }
      } catch {
        if (attempts < maxAttempts && !loadError) {
          setTimeout(trySetAttributes, 1500)
        }
      }
    }
    trySetAttributes()
  }, [hasValidConfig, user, isAdminRoute, isMounted, loadError])

  if (!isMounted || !hasValidConfig || isAdminRoute || !enabled || process.env.NODE_ENV === "development" || loadError) {
    return null
  }

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      onError={(e) => {
        console.warn("Tawk.to widget failed to load:", e)
        setLoadError(true)
      }}
      onLoad={() => {
        console.log("Tawk.to widget loaded successfully")
      }}
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
          (function(){
            var s1 = document.createElement("script"),
                s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = "https://embed.tawk.to/${propertyId}/${widgetId}";
            s1.charset = "UTF-8";
            s1.setAttribute("crossorigin", "*");
            s1.onerror = function() {
              console.warn("Tawk.to widget failed to load");
              setLoadError(true);
            };
            s0.parentNode.insertBefore(s1, s0);
          })();
        `,
      }}
    />
  )
}
