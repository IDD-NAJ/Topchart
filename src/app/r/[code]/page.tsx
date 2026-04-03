"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Gift } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ReferralPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const code = params.code as string
        const res = await fetch("/api/referral/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: code }),
        })
        const data = await res.json()
        if (data.success && data.referralCode) {
          localStorage.setItem("referral_code", data.referralCode)
        }
        setStatus("success")
        setTimeout(() => {
          router.push("/register")
        }, 2000)
      } catch {
        setStatus("error")
        setTimeout(() => {
          router.push("/register")
        }, 2000)
      }
    }
    trackVisit()
  }, [params.code, router])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          {status === "loading" ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <p className="text-lg text-muted-foreground">Processing referral...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                <Gift className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Topchart!</h1>
              <p className="text-muted-foreground">Redirecting you to sign up...</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
