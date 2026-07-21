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

type NavigationLink = {
  id: string
  label: string
  href: string
  description: string
  icon: string
  parent_id: string | null
  priority: number
  is_active: boolean
}

export default function AdminNavigationLinksPage() {
  const [links, setLinks] = useState<NavigationLink[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null)
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    description: "",
    icon: "LayoutDashboard",
    parent_id: "",
    priority: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/navigation")
      const data = await res.json()
      if (data.success) {
        setLinks(data.links)
      }
    } catch (error) {
      toast.error("Failed to load navigation links")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingLink
        ? `/api/admin/navigation/${editingLink.id}`
        : "/api/admin/navigation"
      const method = editingLink ? "PATCH" : "POST"

      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingLink ? "Navigation link updated" : "Navigation link created")
        setDialogOpen(false)
        setEditingLink(null)
        resetForm()
        fetchLinks()
      } else {
        toast.error(data.error || "Failed to save navigation link")
      }
    } catch (error) {
      toast.error("Failed to save navigation link")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this navigation link?")) return

    try {
      const res = await fetch(`/api/admin/navigation/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Navigation link deleted")
        fetchLinks()
      } else {
        toast.error(data.error || "Failed to delete navigation link")
      }
    } catch (error) {
      toast.error("Failed to delete navigation link")
    }
  }

  const handleToggleActive = async (link: NavigationLink) => {
    try {
      const res = await fetch(`/api/admin/navigation/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !link.is_active }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Navigation link updated")
        fetchLinks()
      } else {
        toast.error(data.error || "Failed to update navigation link")
      }
    } catch (error) {
      toast.error("Failed to update navigation link")
    }
  }

  const openEditDialog = (link: NavigationLink) => {
    setEditingLink(link)
    setFormData({
      label: link.label,
      href: link.href,
      description: link.description,
      icon: link.icon,
      parent_id: link.parent_id || "",
      priority: link.priority,
      is_active: link.is_active,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      label: "",
      href: "",
      description: "",
      icon: "LayoutDashboard",
      parent_id: "",
      priority: 0,
      is_active: true,
    })
  }

  const IconComponent = ICON_OPTIONS.find((i) => i.name === formData.icon)?.icon || LayoutDashboard

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Navigation Links</h1>
          <p className="text-muted-foreground mt-2">Manage navigation menu items displayed in the header</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLink(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLink ? "Edit Navigation Link" : "Add Navigation Link"}</DialogTitle>
              <DialogDescription>
                {editingLink ? "Update the navigation link details." : "Add a new navigation link to the header menu."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Data bundles"
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plans for every need"
                  rows={2}
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
                <Label htmlFor="parent_id">Parent ID (optional)</Label>
                <Input
                  id="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  placeholder="Leave empty for top-level item"
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
              <TableHead>Icon</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => {
              const LinkIcon = ICON_OPTIONS.find((i) => i.name === link.icon)?.icon || LayoutDashboard
              return (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{link.label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{link.href}</TableCell>
                  <TableCell className="max-w-xs truncate">{link.description}</TableCell>
                  <TableCell>{link.parent_id || "-"}</TableCell>
                  <TableCell>{link.priority}</TableCell>
                  <TableCell>
                    <Switch
                      checked={link.is_active}
                      onCheckedChange={() => handleToggleActive(link)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(link)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)}>
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
