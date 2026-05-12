"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"

const TawkMessengerReact = dynamic(() => import("@tawk.to/tawk-messenger-react"), { ssr: false })

const noop = () => {}

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim()
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim()
  const enabled = process.env.NEXT_PUBLIC_TAWK_ENABLED !== "false"
  const { user } = useAuth()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

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
    if (!isMounted || !hasValidConfig || !user || isAdminRoute) return

    let attempts = 0
    const maxAttempts = 5

    const trySetAttributes = () => {
      if (attempts >= maxAttempts) return
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
        if (attempts < maxAttempts) {
          setTimeout(trySetAttributes, 1500)
        }
      }
    }
    trySetAttributes()
  }, [hasValidConfig, user, isAdminRoute, isMounted])

  if (!isMounted || !hasValidConfig || isAdminRoute || !enabled) {
    return null
  }

  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
      onBeforeLoad={noop}
      onLoad={noop}
      onStatusChange={noop}
      onChatMaximized={noop}
      onChatMinimized={noop}
      onChatHidden={noop}
      onChatStarted={noop}
      onChatEnded={noop}
      onPrechatSubmit={noop}
      onOfflineSubmit={noop}
      onChatMessageVisitor={noop}
      onChatMessageAgent={noop}
      onChatMessageSystem={noop}
      onAgentJoinChat={noop}
      onAgentLeaveChat={noop}
      onChatSatisfaction={noop}
      onVisitorNameChanged={noop}
      onFileUpload={noop}
      onTagsUpdated={noop}
      onUnreadCountChanged={noop}
    />
  )
}
