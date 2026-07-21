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
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"

type Testimonial = {
  id: string
  brand: string
  quote: string
  name: string
  role: string
  priority: number
  is_active: boolean
}

export default function AdminHomepageTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [formData, setFormData] = useState({
    brand: "",
    quote: "",
    name: "",
    role: "",
    priority: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/admin/homepage/testimonials")
      const data = await res.json()
      if (data.success) {
        setTestimonials(data.testimonials)
      }
    } catch (error) {
      toast.error("Failed to load testimonials")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingTestimonial
        ? `/api/admin/homepage/testimonials/${editingTestimonial.id}`
        : "/api/admin/homepage/testimonials"
      const method = editingTestimonial ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingTestimonial ? "Testimonial updated" : "Testimonial created")
        setDialogOpen(false)
        setEditingTestimonial(null)
        resetForm()
        fetchTestimonials()
      } else {
        toast.error(data.error || "Failed to save testimonial")
      }
    } catch (error) {
      toast.error("Failed to save testimonial")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return

    try {
      const res = await fetch(`/api/admin/homepage/testimonials/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Testimonial deleted")
        fetchTestimonials()
      } else {
        toast.error(data.error || "Failed to delete testimonial")
      }
    } catch (error) {
      toast.error("Failed to delete testimonial")
    }
  }

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/homepage/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !testimonial.is_active }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Testimonial updated")
        fetchTestimonials()
      } else {
        toast.error(data.error || "Failed to update testimonial")
      }
    } catch (error) {
      toast.error("Failed to update testimonial")
    }
  }

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setFormData({
      brand: testimonial.brand,
      quote: testimonial.quote,
      name: testimonial.name,
      role: testimonial.role,
      priority: testimonial.priority,
      is_active: testimonial.is_active,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      brand: "",
      quote: "",
      name: "",
      role: "",
      priority: 0,
      is_active: true,
    })
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homepage Testimonials</h1>
          <p className="text-muted-foreground mt-2">Manage customer testimonials displayed on the homepage</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTestimonial(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
              <DialogDescription>
                {editingTestimonial ? "Update the testimonial details." : "Add a new testimonial to the homepage."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="brand">Brand/Company</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="North Ridge Fintech"
                />
              </div>
              <div>
                <Label htmlFor="quote">Quote</Label>
                <Textarea
                  id="quote"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="Topchart cut our recharge turnaround to seconds..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kwame A."
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Head of Operations"
                />
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
              <TableHead>Brand</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.map((testimonial) => (
              <TableRow key={testimonial.id}>
                <TableCell className="font-medium">{testimonial.brand}</TableCell>
                <TableCell className="max-w-xs truncate">{testimonial.quote}</TableCell>
                <TableCell>{testimonial.name}</TableCell>
                <TableCell>{testimonial.role}</TableCell>
                <TableCell>{testimonial.priority}</TableCell>
                <TableCell>
                  <Switch
                    checked={testimonial.is_active}
                    onCheckedChange={() => handleToggleActive(testimonial)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(testimonial)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(testimonial.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
