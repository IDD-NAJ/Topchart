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

type FAQ = {
  id: string
  question: string
  answer: string
  priority: number
  is_active: boolean
}

export default function AdminHomepageFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    priority: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const res = await fetch("/api/admin/homepage/faqs")
      const data = await res.json()
      if (data.success) {
        setFaqs(data.faqs)
      }
    } catch (error) {
      toast.error("Failed to load FAQs")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingFAQ
        ? `/api/admin/homepage/faqs/${editingFAQ.id}`
        : "/api/admin/homepage/faqs"
      const method = editingFAQ ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingFAQ ? "FAQ updated" : "FAQ created")
        setDialogOpen(false)
        setEditingFAQ(null)
        resetForm()
        fetchFAQs()
      } else {
        toast.error(data.error || "Failed to save FAQ")
      }
    } catch (error) {
      toast.error("Failed to save FAQ")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const res = await fetch(`/api/admin/homepage/faqs/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("FAQ deleted")
        fetchFAQs()
      } else {
        toast.error(data.error || "Failed to delete FAQ")
      }
    } catch (error) {
      toast.error("Failed to delete FAQ")
    }
  }

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch(`/api/admin/homepage/faqs/${faq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !faq.is_active }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("FAQ updated")
        fetchFAQs()
      } else {
        toast.error(data.error || "Failed to update FAQ")
      }
    } catch (error) {
      toast.error("Failed to update FAQ")
    }
  }

  const openEditDialog = (faq: FAQ) => {
    setEditingFAQ(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      priority: faq.priority,
      is_active: faq.is_active,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
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
          <h1 className="text-3xl font-bold">Homepage FAQs</h1>
          <p className="text-muted-foreground mt-2">Manage FAQ items displayed on the homepage</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingFAQ(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingFAQ ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFAQ ? "Update the FAQ details." : "Add a new FAQ to the homepage."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="How fast is airtime and data delivery?"
                />
              </div>
              <div>
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Most orders complete within seconds..."
                  rows={4}
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
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs.map((faq) => (
              <TableRow key={faq.id}>
                <TableCell className="font-medium">{faq.question}</TableCell>
                <TableCell className="max-w-md truncate">{faq.answer}</TableCell>
                <TableCell>{faq.priority}</TableCell>
                <TableCell>
                  <Switch
                    checked={faq.is_active}
                    onCheckedChange={() => handleToggleActive(faq)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(faq)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(faq.id)}>
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
