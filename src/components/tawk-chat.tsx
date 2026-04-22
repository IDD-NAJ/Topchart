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
  // #region agent log
  const logClientDebug = (payload: Record<string, unknown>) => {
    fetch("/api/debug-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7505/ingest/8f2aa6f2-5ac2-46a8-bc1c-0440fc874c90',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'920650'},body:JSON.stringify({sessionId:'920650',runId:'baseline3',hypothesisId:'H8',location:'src/components/tawk-chat.tsx:21',message:'tawk_effect_enter',data:{hasValidConfig:Boolean(hasValidConfig),hasUser:Boolean(user),propertyIdPresent:Boolean(propertyId),widgetIdPresent:Boolean(widgetId)},timestamp:Date.now()})}).catch(()=>{});
    logClientDebug({
      kind: "tawk_effect_enter",
      hasValidConfig: Boolean(hasValidConfig),
      hasUser: Boolean(user),
      propertyIdPresent: Boolean(propertyId),
      widgetIdPresent: Boolean(widgetId),
    });
    // #endregion
    if (!hasValidConfig || !user) return
    
    // Suppress Tawk console errors and DOM errors
    // @ts-ignore
    const originalConsoleError = console.error
    // @ts-ignore
    const originalWindowError = window.onerror
    
    // @ts-ignore
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[Tawk/Logger]')) {
        return
      }
      if (args[0] && typeof args[0] === 'string' && args[0].includes('NotFoundError')) {
        return
      }
      originalConsoleError.apply(console, args)
    }
    
    // @ts-ignore
    window.onerror = (message, source, lineno, colno, error) => {
      // #region agent log
      fetch('http://127.0.0.1:7505/ingest/8f2aa6f2-5ac2-46a8-bc1c-0440fc874c90',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'920650'},body:JSON.stringify({sessionId:'920650',runId:'baseline3',hypothesisId:'H8',location:'src/components/tawk-chat.tsx:42',message:'tawk_window_onerror_intercept',data:{message:String(message||''),source:String(source||''),lineno:Number(lineno||0),colno:Number(colno||0)},timestamp:Date.now()})}).catch(()=>{});
      logClientDebug({
        kind: "tawk_window_onerror_intercept",
        message: String(message || ""),
        source: String(source || ""),
        lineno: Number(lineno || 0),
        colno: Number(colno || 0),
      });
      // #endregion
      if (typeof message === 'string' && message.includes('NotFoundError')) {
        return true
      }
      if (typeof message === 'string' && message.includes('removeChild')) {
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
  }, [hasValidConfig, user])

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7505/ingest/8f2aa6f2-5ac2-46a8-bc1c-0440fc874c90',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'920650'},body:JSON.stringify({sessionId:'920650',runId:'baseline4',hypothesisId:'H9',location:'src/components/tawk-chat.tsx:82',message:'tawk_render_state',data:{hasValidConfig:Boolean(hasValidConfig),hasUser:Boolean(user),willRenderWidget:Boolean(hasValidConfig)},timestamp:Date.now()})}).catch(()=>{});
    logClientDebug({
      kind: "tawk_render_state",
      hasValidConfig: Boolean(hasValidConfig),
      hasUser: Boolean(user),
      willRenderWidget: Boolean(hasValidConfig),
    });
    // #endregion
  }, [hasValidConfig, user])

  if (!hasValidConfig) {
    return null
  }

  return (
    <div key="tawk-chat-container">
      <TawkMessengerReact
        ref={tawkRef}
        propertyId={propertyId}
        widgetId={widgetId}
        onLoad={() => {
          // #region agent log
          fetch('http://127.0.0.1:7505/ingest/8f2aa6f2-5ac2-46a8-bc1c-0440fc874c90',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'920650'},body:JSON.stringify({sessionId:'920650',runId:'baseline4',hypothesisId:'H9',location:'src/components/tawk-chat.tsx:97',message:'tawk_on_load',data:{hasUser:Boolean(user)},timestamp:Date.now()})}).catch(()=>{});
          logClientDebug({
            kind: "tawk_on_load",
            hasUser: Boolean(user),
          });
          // #endregion
        }}
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
