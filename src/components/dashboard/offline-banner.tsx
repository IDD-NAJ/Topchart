"use client"

import { useState, useEffect } from "react"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsReconnecting(true)
      // Give a moment for connection to stabilize
      setTimeout(() => {
        setIsOffline(false)
        setIsReconnecting(false)
        // Reload the page to refresh data
        window.location.reload()
      }, 1500)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setIsReconnecting(false)
    }

    // Check initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline && !isReconnecting) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isReconnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Reconnecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">You&apos;re offline</span>
            </>
          )}
        </div>
        {isOffline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-7 text-white hover:bg-white/20 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
