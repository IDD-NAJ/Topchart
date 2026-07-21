"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart3,
  Settings,
  Users,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  Database,
  Shield,
} from "lucide-react"

export default function AdminPage() {
  const { user } = useAuth()

  const adminSections = [
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "View system analytics, user statistics, and transaction reports",
      href: "/admin/analytics",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage users, permissions, and account settings",
      href: "/admin/users",
      color: "bg-green-500/10 text-green-600"
    },
    {
      icon: ShoppingCart,
      title: "Products & Pricing",
      description: "Manage data bundles, pricing tiers, and product offerings",
      href: "/admin/products",
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      icon: Database,
      title: "Data Management",
      description: "Manage providers, networks, and data configurations",
      href: "/admin/data",
      color: "bg-orange-500/10 text-orange-600"
    },
    {
      icon: AlertCircle,
      title: "Transactions & Disputes",
      description: "Review transactions, disputes, and payment issues",
      href: "/admin/transactions",
      color: "bg-red-500/10 text-red-600"
    },
    {
      icon: Settings,
      title: "System Settings",
      description: "Configure system-wide settings and preferences",
      href: "/admin/settings",
      color: "bg-slate-500/10 text-slate-600"
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome, {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Administrator"}</p>
            </div>
            <Shield className="h-10 w-10 text-primary" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">--</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">--</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">GHS --</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-green-600">Operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">Admin Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => {
              const Icon = section.icon
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${section.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
