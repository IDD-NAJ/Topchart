"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/networks"
import { Loader2, ArrowLeft, Save, DollarSign, Percent } from "lucide-react"

interface Service {
  id: string
  textverified_service_id: string
  name: string
  category: string
  description: string
  is_active: boolean
  base_cost: number
  markup_percentage: number
  rental_multiplier: number
}

const categories = [
  { id: "social_media", name: "Social Media & Messaging" },
  { id: "ecommerce_financial", name: "E-Commerce & Financial" },
  { id: "professional_tools", name: "Professional Tools" },
  { id: "streaming_entertainment", name: "Streaming & Entertainment" },
]

export default function AdminVerificationPricingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [editedServices, setEditedServices] = useState<Record<string, Partial<Service>>>({})

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/admin/verification/services")
      const data = await response.json()
      
      if (data.success) {
        setServices(data.data.services)
      } else {
        toast.error(data.error || "Failed to load services")
      }
    } catch (err) {
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (serviceId: string, field: keyof Service, value: any) => {
    setEditedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      },
    }))
  }

  const handleSave = async (serviceId: string) => {
    const edits = editedServices[serviceId]
    if (!edits) return

    setSaving(serviceId)
    try {
      const response = await fetch("/api/admin/verification/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          baseCost: edits.base_cost,
          markupPercentage: edits.markup_percentage,
          rentalMultiplier: edits.rental_multiplier,
          isActive: edits.is_active,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Service updated successfully")
        setEditedServices(prev => {
          const updated = { ...prev }
          delete updated[serviceId]
          return updated
        })
        fetchServices()
      } else {
        toast.error(data.error || "Failed to update service")
      }
    } catch (err) {
      toast.error("Failed to save changes")
    } finally {
      setSaving(null)
    }
  }

  const calculateFinalPrice = (service: Service) => {
    const baseCost = editedServices[service.id]?.base_cost ?? service.base_cost
    const markup = editedServices[service.id]?.markup_percentage ?? service.markup_percentage
    return baseCost * (1 + markup / 100)
  }

  const calculateRentalPrice = (service: Service) => {
    const baseCost = editedServices[service.id]?.base_cost ?? service.base_cost
    const markup = editedServices[service.id]?.markup_percentage ?? service.markup_percentage
    const multiplier = editedServices[service.id]?.rental_multiplier ?? service.rental_multiplier
    return baseCost * multiplier * (1 + markup / 100)
  }

  const hasChanges = (serviceId: string) => {
    return !!editedServices[serviceId]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/verification">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Pricing Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure base costs and markup for verification services
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="social_media">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="grid gap-4">
              {services
                .filter((s) => s.category === category.id)
                .map((service) => {
                  const isEdited = hasChanges(service.id)
                  const isSaving = saving === service.id

                  return (
                    <Card key={service.id} className={isEdited ? "border-[#006994]" : ""}>
                      <CardContent className="p-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
                          {/* Service Info */}
                          <div className="lg:col-span-1">
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {service.textverified_service_id}
                            </p>
                            <div className="mt-2">
                              <Label htmlFor={`active-${service.id}`} className="flex items-center gap-2">
                                <Switch
                                  id={`active-${service.id}`}
                                  checked={editedServices[service.id]?.is_active ?? service.is_active}
                                  onCheckedChange={(checked) =>
                                    handleEdit(service.id, "is_active", checked)
                                  }
                                />
                                <span className="text-sm">Active</span>
                              </Label>
                            </div>
                          </div>

                          {/* Base Cost */}
                          <div>
                            <Label htmlFor={`base-${service.id}`} className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Base Cost
                            </Label>
                            <Input
                              id={`base-${service.id}`}
                              type="number"
                              step="0.01"
                              value={editedServices[service.id]?.base_cost ?? service.base_cost}
                              onChange={(e) =>
                                handleEdit(service.id, "base_cost", parseFloat(e.target.value))
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Your cost from Textverified
                            </p>
                          </div>

                          {/* Markup */}
                          <div>
                            <Label htmlFor={`markup-${service.id}`} className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Markup %
                            </Label>
                            <Input
                              id={`markup-${service.id}`}
                              type="number"
                              step="0.1"
                              value={editedServices[service.id]?.markup_percentage ?? service.markup_percentage}
                              onChange={(e) =>
                                handleEdit(service.id, "markup_percentage", parseFloat(e.target.value))
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Your profit margin
                            </p>
                          </div>

                          {/* Rental Multiplier */}
                          <div>
                            <Label htmlFor={`rental-${service.id}`}>
                              Rental Multiplier
                            </Label>
                            <Input
                              id={`rental-${service.id}`}
                              type="number"
                              step="0.1"
                              value={editedServices[service.id]?.rental_multiplier ?? service.rental_multiplier}
                              onChange={(e) =>
                                handleEdit(service.id, "rental_multiplier", parseFloat(e.target.value))
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Daily rate multiplier
                            </p>
                          </div>
                        </div>

                        {/* Preview Prices */}
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">One-time Price</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(calculateFinalPrice(service))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rental Price (24h)</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(calculateRentalPrice(service))}
                            </p>
                          </div>
                        </div>

                        {/* Save Button */}
                        {isEdited && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              onClick={() => handleSave(service.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
