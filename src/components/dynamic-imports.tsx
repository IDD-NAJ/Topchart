"use client"

import dynamic from "next/dynamic"

// Force all client components to be loaded without SSR
// This prevents hydration mismatches from browser extension/IDE script injection

export const DynamicAuthProvider = dynamic(
  () => import("@/lib/auth-context").then((mod) => mod.AuthProvider),
  { ssr: false }
)

export const DynamicAnalytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false }
)
