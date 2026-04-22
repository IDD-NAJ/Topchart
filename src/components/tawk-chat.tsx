"use client"

import { useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
// @ts-ignore
import TawkMessengerReact from "@tawk.to/tawk-messenger-react"

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim()
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim()
  const { user } = useAuth()
  // @ts-ignore
  const tawkRef = useRef(null)
  const hasValidConfig = Boolean(
    propertyId &&
    widgetId &&
    propertyId !== "your-tawk-property-id" &&
    widgetId !== "your-tawk-widget-id"
  )

  useEffect(() => {
    if (!hasValidConfig || !user) return
    
    // Suppress Tawk console errors
    // @ts-ignore
    const originalConsoleError = console.error
    // @ts-ignore
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[Tawk/Logger]')) {
        return
      }
      originalConsoleError.apply(console, args)
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
    }
  }, [hasValidConfig, user])

  if (!hasValidConfig) {
    return null
  }

  return (
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
  )
}
