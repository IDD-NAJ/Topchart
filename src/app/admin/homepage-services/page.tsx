export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Save, X, Wifi, PhoneCall, GraduationCap, Smartphone, Shield, Gift, CreditCard, Store, LayoutDashboard } from "lucide-react"
import { toast } from "sonner"

const ICON_OPTIONS = [
  { name: "Wifi", icon: Wifi },
  { name: "PhoneCall", icon: PhoneCall },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Smartphone", icon: Smartphone },
  { name: "Shield", icon: Shield },
  { name: "Gift", icon: Gift },
  { name: "CreditCard", icon: CreditCard },
  { name: "Store", icon: Store },
  { name: "LayoutDashboard", icon: LayoutDashboard },
]

type Service = {
  id: string
  title: string
  description: string
  href: string
  label: string
  icon: string
  priority: number
  is_active: boolean
}

export default function AdminHomepageServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    href: "",
    label: "",
    icon: "Wifi",
    priority: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/homepage/services")
      const data = await res.json()
      if (data.success) {
        setServices(data.services)
      }
    } catch (error) {
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingService
        ? `/api/admin/homepage/services/${editingService.id}`
        : "/api/admin/homepage/services"
      const method = editingService ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingService ? "Service updated" : "Service created")
        setDialogOpen(false)
        setEditingService(null)
        resetForm()
        fetchServices()
      } else {
        toast.error(data.error || "Failed to save service")
      }
    } catch (error) {
      toast.error("Failed to save service")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const res = await fetch(`/api/admin/homepage/services/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Service deleted")
        fetchServices()
      } else {
        toast.error(data.error || "Failed to delete service")
      }
    } catch (error) {
      toast.error("Failed to delete service")
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/admin/homepage/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Service updated")
        fetchServices()
      } else {
        toast.error(data.error || "Failed to update service")
      }
    } catch (error) {
      toast.error("Failed to update service")
    }
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description,
      href: service.href,
      label: service.label,
      icon: service.icon,
      priority: service.priority,
      is_active: service.is_active,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      href: "",
      label: "",
      icon: "Wifi",
      priority: 0,
      is_active: true,
    })
  }

  const IconComponent = ICON_OPTIONS.find((i) => i.name === formData.icon)?.icon || Wifi

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homepage Services</h1>
          <p className="text-muted-foreground mt-2">Manage service cards displayed on the homepage</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingService(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
              <DialogDescription>
                {editingService ? "Update the service card details." : "Add a new service card to the homepage."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Data Bundles"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Affordable daily, weekly and monthly data packages..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="href">Link</Label>
                <Input
                  id="href"
                  value={formData.href}
                  onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  placeholder="/dashboard/data"
                />
              </div>
              <div>
                <Label htmlFor="label">Button Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Browse bundles"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {ICON_OPTIONS.map((option) => {
                    const IconComp = option.icon
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: option.name })}
                        className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${
                          formData.icon === option.name
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <IconComp className="h-5 w-5" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="priority">Priority (lower = higher)</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => {
              const ServiceIcon = ICON_OPTIONS.find((i) => i.name === service.icon)?.icon || Wifi
              return (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ServiceIcon className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{service.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{service.href}</TableCell>
                  <TableCell>{service.priority}</TableCell>
                  <TableCell>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => handleToggleActive(service)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(service)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
