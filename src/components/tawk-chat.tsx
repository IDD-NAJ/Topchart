"use client"

import { useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
// @ts-ignore
import TawkMessengerReact from "@tawk.to/tawk-messenger-react"

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID
  const { user } = useAuth()
  // @ts-ignore
  const tawkRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const trySetAttributes = () => {
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
    }
    trySetAttributes()
  }, [user])

  if (!propertyId || !widgetId) {
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
    />
  )
}
