"use client"



import React from "react"

import { useEffect, useState } from "react"

import { useRouter } from "next/navigation"

import { useAuth } from "@/lib/auth-context"

import { DashboardHeader } from "@/components/dashboard-header"

import { DashboardFooter } from "@/components/dashboard-footer"

import { DashboardSidebar } from "@/components/dashboard-sidebar"

import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"

import { OfflineBanner } from "@/components/dashboard/offline-banner"



export default function DashboardLayout({

  children,

}: {

  children: React.ReactNode

}) {

  const { user, isLoading, refreshUser } = useAuth()

  const router = useRouter()

  const [retryCount, setRetryCount] = useState(0)

  const [stabilized, setStabilized] = useState(false)

  const maxRetries = 4



  useEffect(() => {

    const t = setTimeout(() => setStabilized(true), 400)

    return () => clearTimeout(t)

  }, [])



  useEffect(() => {

    if (!stabilized || isLoading || user || retryCount >= maxRetries) return

    const delays = [500, 1000, 2000, 3000]

    const attemptRefresh = async () => {

      await new Promise(resolve => setTimeout(resolve, delays[retryCount] ?? 1000))

      await refreshUser()

      setRetryCount(prev => prev + 1)

    }

    attemptRefresh()

  }, [stabilized, isLoading, user, retryCount, refreshUser])



  useEffect(() => {

    if (!stabilized || isLoading || user || retryCount < maxRetries) return

    const timer = setTimeout(() => router.replace("/login"), 200)

    return () => clearTimeout(timer)

  }, [stabilized, user, isLoading, retryCount, router])



  if (isLoading || !stabilized || (!user && retryCount < maxRetries)) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-background">

        <div className="w-8 h-8 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />

      </div>

    )

  }



  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-background">

        <div className="w-8 h-8 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />

      </div>

    )

  }



  return (

    <div className="min-h-screen flex bg-background">

      <OfflineBanner />

      <DashboardSidebar />

        <div className="flex-1 flex flex-col lg:pl-64">

          <DashboardHeader />

          <main className="flex-1 pt-16 lg:pt-20 pb-24 lg:pb-0 overflow-x-hidden">

            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl w-full">{children}</div>

          </main>

          <div className="hidden lg:block">

            <DashboardFooter />

          </div>

          <MobileBottomNav />

        </div>

    </div>

  )

}

