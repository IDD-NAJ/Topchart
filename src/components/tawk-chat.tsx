"use client"

// @ts-ignore
import TawkMessengerReact from "@tawk.to/tawk-messenger-react"

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID

  if (!propertyId || !widgetId) {
    return null
  }

    return (
      <TawkMessengerReact
        propertyId={propertyId}
        widgetId={widgetId}
        onBeforeLoad={() => {}}
        onStatusChange={() => {}}
        onLoad={() => {}}
        onChatHidden={() => {}}
        onChatMinimized={() => {}}
        onChatMaximized={() => {}}
        onChatStarted={() => {}}
        onChatEnded={() => {}}
        onPrechatSubmit={() => {}}
        onOfflineSubmit={() => {}}
        onChatMessageVisitor={() => {}}
        onChatMessageAgent={() => {}}
        onChatMessageSystem={() => {}}
        onAgentJoinChat={() => {}}
        onAgentLeaveChat={() => {}}
        onChatSatisfied={() => {}}
        onUnreadCountChanged={() => {}}
      />
    )
}
