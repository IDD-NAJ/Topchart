"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/networks"
import { Loader2, Phone, DollarSign, TrendingUp, Users, Clock } from "lucide-react"

interface Stats {
  summary: {
    total_purchases: string
    onetime_count: string
    rental_count: string
    total_revenue: string
    avg_price: string
  }
  activeNow: number
  serviceStats: Array<{
    name: string
    category: string
    purchase_count: string
    total_revenue: string
  }>
  dailyRevenue: Array<{
    date: string
    count: string
    revenue: string
    type: string
  }>
}

export default function AdminVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/verification/stats")
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || "Failed to load stats")
      }
    } catch (err) {
      setError("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verification Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage phone number verification services and view analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/verification/numbers">
            <Button variant="outline">View All Numbers</Button>
          </Link>
          <Link href="/admin/verification/pricing">
            <Button>Pricing Settings</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats.summary.total_revenue) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.summary.total_purchases} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Numbers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeNow}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One-time vs Rental</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.summary.onetime_count} / {stats.summary.rental_count}
            </div>
            <p className="text-xs text-muted-foreground">
              Purchases breakdown
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats.summary.avg_price) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per number
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Top Services by Usage</CardTitle>
          <CardDescription>Most popular verification services (30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.serviceStats.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-6">{index + 1}.</span>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {service.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{service.purchase_count} purchases</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(service.total_revenue) || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/verification/numbers">
          <Card className="hover:border-[#006994] transition-colors cursor-pointer">
            <CardContent className="p-6">
              <Phone className="h-8 w-8 mb-4 text-[#006994]" />
              <h3 className="font-semibold">Manage Numbers</h3>
              <p className="text-sm text-muted-foreground">
                View all active and completed verifications
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/verification/pricing">
          <Card className="hover:border-[#006994] transition-colors cursor-pointer">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 mb-4 text-[#006994]" />
              <h3 className="font-semibold">Pricing Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure base costs and markup percentages
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/verification/sms">
          <Card className="hover:border-[#006994] transition-colors cursor-pointer">
            <CardContent className="p-6">
              <Users className="h-8 w-8 mb-4 text-[#006994]" />
              <h3 className="font-semibold">SMS Log</h3>
              <p className="text-sm text-muted-foreground">
                View received SMS messages
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
