"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Timer, LogOut, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface InactivityWarningModalProps {
  isOpen: boolean
  secondsRemaining: number
  onStayActive: () => void
  onLogout: () => void
}

export function InactivityWarningModal({
  isOpen,
  secondsRemaining,
  onStayActive,
  onLogout,
}: InactivityWarningModalProps) {
  // Handle keyboard events - Escape extends session
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onStayActive()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onStayActive])

  const percentage = (secondsRemaining / 30) * 100

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-white border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-2">
            <Timer className="h-8 w-8 text-amber-600 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-slate-800">
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            You&apos;ve been inactive for a while. Your session will expire automatically for security.
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Timer */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            <span className="text-3xl font-bold tabular-nums text-slate-800">
              {secondsRemaining}s
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-linear rounded-full",
                secondsRemaining > 15 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <p className="text-xs text-center text-slate-400">
            Move your mouse or press any key to stay logged in
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onStayActive}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Activity className="h-4 w-4 mr-2" />
            Stay Logged In
          </Button>
          <Button
            onClick={onLogout}
            variant="outline"
            className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-semibold transition-all duration-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
