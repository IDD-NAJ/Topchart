"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import {
  Phone,
  MessageCircle,
  CreditCard,
  Briefcase,
  Play,
  Clock,
  Loader2,
  ArrowRight,
  Shield,
  AlertCircle,
} from "lucide-react"

const categories = [
  { id: "social_media", name: "Social Media", icon: MessageCircle, color: "text-blue-600 bg-blue-50" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial", icon: CreditCard, color: "text-green-600 bg-green-50" },
  { id: "professional_tools", name: "Professional Tools", icon: Briefcase, color: "text-purple-600 bg-purple-50" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment", icon: Play, color: "text-red-600 bg-red-50" },
]

interface Service {
  id: string
  name: string
  category: string
  description: string
  icon_url?: string
  onetime_price: number
  rental_price_per_day: number
}

interface ActiveNumber {
  id: string
  number: string
  service_name: string
  service_category: string
  type: "onetime" | "rental"
  status: string
  time_remaining_formatted: string
  is_expired: boolean
  sms_count: number
}

export default function VerificationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [activeNumbers, setActiveNumbers] = useState<ActiveNumber[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("social_media")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
    fetchActiveNumbers()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/verification/services")
      const data = await response.json()
      
      if (data.success) {
        setServices(data.data.services)
      } else {
        setError(data.error || "Failed to load services")
      }
    } catch (err) {
      setError("Failed to load services")
    }
  }

  const fetchActiveNumbers = async () => {
    try {
      const response = await fetch("/api/verification/numbers?status=active")
      const data = await response.json()
      
      if (data.success) {
        setActiveNumbers(data.data.numbers)
      }
    } catch (err) {
      console.error("Failed to load active numbers:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(s => s.category === selectedCategory)

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.icon || Phone
  }

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.color || "text-gray-600 bg-gray-50"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Number Verification</h1>
        <p className="text-muted-foreground mt-2">
          Get temporary US phone numbers for SMS verification on any app or website.
        </p>
      </div>

      {/* Active Numbers Section */}
      {activeNumbers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Active Numbers ({activeNumbers.length})
            </CardTitle>
            <CardDescription>Your currently active verification numbers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeNumbers.map((num) => (
                <Link key={num.id} href={`/dashboard/verification/${num.service_category}?view=${num.id}`}>
                  <Card className="cursor-pointer hover:border-yellow-400 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={num.type === "rental" ? "default" : "secondary"}>
                          {num.type === "rental" ? "Rental" : "One-time"}
                        </Badge>
                        {!num.is_expired && (
                          <span className="text-xs font-mono text-orange-600">
                            {num.time_remaining_formatted}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-lg font-medium">{num.number}</p>
                      <p className="text-sm text-muted-foreground">{num.service_name}</p>
                      {num.sms_count > 0 && (
                        <Badge variant="outline" className="mt-2">
                          {num.sms_count} SMS received
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Selection */}
      <Tabs defaultValue="social_media" onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => {
                const CategoryIcon = getCategoryIcon(service.category)
                const colorClass = getCategoryColor(service.category)
                
                return (
                  <Link key={service.id} href={`/dashboard/verification/${service.id}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="group cursor-pointer"
                    >
                      <Card className="h-full hover:border-[#006994]/50 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${colorClass}`}>
                              <CategoryIcon className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {service.description || `Get a temporary number for ${service.name} verification`}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">One-time</span>
                              <span className="font-medium">{formatCurrency(service.onetime_price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Rental (24h)</span>
                              <span className="font-medium">{formatCurrency(service.rental_price_per_day)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {filteredServices.length === 0 && !error && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No services available in this category</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#006994]/10">
              <Shield className="h-5 w-5 text-[#006994]" />
            </div>
            <div>
              <h4 className="font-medium mb-1">How it works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Select a service and choose one-time purchase or rental</li>
                <li>• One-time: Valid for 20 minutes, perfect for quick verifications</li>
                <li>• Rental: Valid for 24+ hours, receive multiple SMS</li>
                <li>• Payment deducted from your wallet balance</li>
                <li>• Copy the number and use it for verification on the target platform</li>
                <li>• Receive SMS instantly in your dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
