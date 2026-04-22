"use client"

import { useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
// @ts-ignore
import TawkMessengerReact from "@tawk.to/tawk-messenger-react"

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim()
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim()
  const { user } = useAuth()
  const pathname = usePathname()
  // @ts-ignore
  const tawkRef = useRef(null)
  const hasValidConfig = Boolean(
    propertyId &&
    widgetId &&
    propertyId !== "your-tawk-property-id" &&
    widgetId !== "your-tawk-widget-id"
  )
  const isAdminRoute = pathname?.startsWith("/admin")

  useEffect(() => {
    if (!hasValidConfig || !user || isAdminRoute) return

    const originalConsoleError = console.error
    const originalWindowError = window.onerror

    // @ts-ignore
    console.error = (...args) => {
      if (args[0] && typeof args[0] === "string" && args[0].includes("[Tawk/Logger]")) {
        return
      }
      if (args[0] && typeof args[0] === "string" && args[0].includes("NotFoundError")) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    // @ts-ignore
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === "string" && message.includes("NotFoundError")) {
        return true
      }
      if (typeof message === "string" && message.includes("removeChild")) {
        return true
      }
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error)
      }
      return false
    }

    const trySetAttributes = () => {
      try {
        // @ts-ignore
        const api = window.Tawk_API
        if (api?.setAttributes) {
          api.setAttributes({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          })
        } else {
          setTimeout(trySetAttributes, 1000)
        }
      } catch (error) {
        console.warn("Tawk API error:", error)
      }
    }
    trySetAttributes()

    return () => {
      // @ts-ignore
      console.error = originalConsoleError
      // @ts-ignore
      window.onerror = originalWindowError
    }
  }, [hasValidConfig, user, isAdminRoute])

  if (!hasValidConfig || isAdminRoute) {
    return null
  }

  return (
    <div key="tawk-chat-container">
      <TawkMessengerReact
        ref={tawkRef}
        propertyId={propertyId}
        widgetId={widgetId}
        onLoad={() => {}}
        onStatusChange={() => {}}
        onBeforeLoad={() => {}}
        onChatMaximized={() => {}}
        onChatMinimized={() => {}}
        onChatHidden={() => {}}
        onChatStarted={() => {}}
        onChatEnded={() => {}}
        onPrechatSubmit={() => {}}
        onOfflineSubmit={() => {}}
        onChatMessageVisitor={() => {}}
        onChatMessageAgent={() => {}}
        onChatMessageSystem={() => {}}
        onAgentJoinChat={() => {}}
        onAgentLeaveChat={() => {}}
        onChatSatisfaction={() => {}}
        onVisitorNameChanged={() => {}}
        onFileUpload={() => {}}
        onTagsUpdated={() => {}}
        onUnreadCountChanged={() => {}}
      />
    </div>
  )
}
