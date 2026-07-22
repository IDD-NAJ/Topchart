'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { adminFetcher, adminMutate, formatDateTime } from '@/lib/admin-fetcher'
import {
  AdminPageShell,
  AdminTableShell,
  AdminTableHeader,
  EmptyState,
  StatCard,
} from '@/components/admin/AdminPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Image, RefreshCw, Plus, Pencil, Eye, Trash2 } from 'lucide-react'

interface PopupBanner {
  id: string
  title: string
  content: string
  image_url?: string | null
  link_url?: string | null
  link_text?: string | null
  target_type: string
  target_user_ids?: string[]
  target_segment?: string | null
  is_active: boolean
  start_date: string
  end_date?: string | null
  priority: number
  show_once_per_session: boolean
  dismissible: boolean
  created_at: string
  updated_at: string
  dismissals?: number
}

interface BannersResponse {
  success: boolean
  data?: PopupBanner[]
}

const defaultForm = {
  title: '',
  content: '',
  image_url: '',
  link_url: '',
  link_text: '',
  target_type: 'all',
  target_user_ids: '',
  target_segment: '',
  is_active: true,
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  priority: 0,
  show_once_per_session: true,
  dismissible: true,
}

export default function AdminBannersPage() {
  const [editBanner, setEditBanner] = useState<PopupBanner | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [preview, setPreview] = useState<PopupBanner | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<PopupBanner | null>(null)

  const { data, error, isLoading, mutate } = useSWR<BannersResponse>(
    '/api/admin/popup-banners',
    adminFetcher
  )
  const banners = data?.data || []

  const openEdit = (b: PopupBanner) => {
    setForm({
      title: b.title,
      content: b.content,
      image_url: b.image_url || '',
      link_url: b.link_url || '',
      link_text: b.link_text || '',
      target_type: b.target_type,
      target_user_ids: (b.target_user_ids || []).join(','),
      target_segment: b.target_segment || '',
      is_active: b.is_active,
      start_date: b.start_date.split('T')[0],
      end_date: b.end_date?.split('T')[0] || '',
      priority: b.priority,
      show_once_per_session: b.show_once_per_session,
      dismissible: b.dismissible,
    })
    setEditBanner(b)
  }

  const openNew = () => {
    setForm(defaultForm)
    setEditBanner({} as PopupBanner)
  }

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast.error('Title and content are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title,
        content: form.content,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        link_text: form.link_text || null,
        target_type: form.target_type,
        target_user_ids: form.target_user_ids
          ? form.target_user_ids.split(',').map((id) => id.trim())
          : [],
        target_segment: form.target_segment || null,
        is_active: form.is_active,
        start_date: form.start_date,
        end_date: form.end_date || null,
        priority: Number(form.priority),
        show_once_per_session: form.show_once_per_session,
        dismissible: form.dismissible,
      }

      if (editBanner?.id) {
        // Update
        const res = await adminMutate(
          `/api/admin/popup-banners`,
          'PUT',
          { id: editBanner.id, updates: payload }
        )
        if (res.success) {
          toast.success('Banner updated')
          setEditBanner(null)
          mutate()
        } else {
          toast.error(res.error || 'Failed to update')
        }
      } else {
        // Create
        const res = await adminMutate(
          '/api/admin/popup-banners',
          'POST',
          payload
        )
        if (res.success) {
          toast.success('Banner created')
          setEditBanner(null)
          mutate()
        } else {
          toast.error(res.error || 'Failed to create')
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b: PopupBanner) => {
    try {
      const res = await adminMutate(
        `/api/admin/popup-banners?id=${b.id}`,
        'DELETE',
        {}
      )
      if (res.success) {
        toast.success('Banner deleted')
        mutate()
      } else {
        toast.error(res.error || 'Failed to delete')
      }
      setDeleteConfirm(null)
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  const activeCount = banners.filter((b) => b.is_active).length

  return (
    <AdminPageShell
      title="Popup Banners"
      description="Create and manage popup banners for users or all visitors"
      icon={Image}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Banner
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Banners" value={banners.length} icon={Image} />
        <StatCard label="Active" value={activeCount} icon={Eye} accent />
        <StatCard
          label="Average Priority"
          value={
            banners.length > 0
              ? Math.round(banners.reduce((s, b) => s + b.priority, 0) / banners.length)
              : 0
          }
        />
        <StatCard
          label="Total Dismissals"
          value={banners.reduce((s, b) => s + (b.dismissals || 0), 0)}
        />
      </div>

      <AdminTableShell>
        <AdminTableHeader>
          <p className="text-sm font-semibold">
            {banners.length} banner{banners.length !== 1 ? 's' : ''}
          </p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={Image}
            title="Failed to load banners"
            description={error.message}
          />
        ) : banners.length === 0 ? (
          <EmptyState
            icon={Image}
            title="No banners yet"
            description="Create your first popup banner to get started"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Dismissals</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium max-w-[200px] truncate">
                          {b.title}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {b.content.substring(0, 50)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {b.target_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{b.priority}</TableCell>
                    <TableCell>
                      <Badge
                        variant={b.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(b.start_date).toLocaleDateString()} to{' '}
                      {b.end_date
                        ? new Date(b.end_date).toLocaleDateString()
                        : '∞'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {b.dismissals || 0}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPreview(b)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(b)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      {/* Edit/Create Dialog */}
      <Dialog
        open={!!editBanner}
        onOpenChange={(o) => !o && setEditBanner(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editBanner?.id ? 'Edit Banner' : 'Create Banner'}
            </DialogTitle>
            <DialogDescription>
              Configure when and where this banner will be displayed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Basic Info */}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Banner title"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="Banner message"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_url: e.target.value }))
                  }
                  placeholder="/dashboard"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Link Text / CTA Button</Label>
              <Input
                value={form.link_text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, link_text: e.target.value }))
                }
                placeholder="Learn More"
              />
            </div>

            {/* Targeting */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Targeting</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label>Target Type</Label>
                  <Select
                    value={form.target_type}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, target_type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                      <SelectItem value="segment">User Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        priority: Number(e.target.value),
                      }))
                    }
                    min="0"
                  />
                </div>
              </div>

              {form.target_type === 'specific' && (
                <div className="space-y-1.5">
                  <Label>User IDs (comma-separated)</Label>
                  <Textarea
                    value={form.target_user_ids}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, target_user_ids: e.target.value }))
                    }
                    placeholder="uuid1, uuid2, uuid3"
                    rows={2}
                  />
                </div>
              )}

              {form.target_type === 'segment' && (
                <div className="space-y-1.5">
                  <Label>Segment</Label>
                  <Input
                    value={form.target_segment}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, target_segment: e.target.value }))
                    }
                    placeholder="e.g. premium, new_users"
                  />
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Schedule</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-semibold">Settings</h3>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Display this banner
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, is_active: c }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Show Once Per Session</p>
                  <p className="text-xs text-muted-foreground">
                    Only display once per user session
                  </p>
                </div>
                <Switch
                  checked={form.show_once_per_session}
                  onCheckedChange={(c) =>
                    setForm((f) => ({
                      ...f,
                      show_once_per_session: c,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Dismissible</p>
                  <p className="text-xs text-muted-foreground">
                    Allow users to close this banner
                  </p>
                </div>
                <Switch
                  checked={form.dismissible}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, dismissible: c }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBanner(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editBanner?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="rounded-lg border bg-muted/30 p-6 space-y-3">
              {preview.image_url && (
                <img
                  src={preview.image_url}
                  alt={preview.title}
                  className="w-full rounded"
                />
              )}
              <h3 className="text-xl font-bold">{preview.title}</h3>
              <p className="text-sm text-muted-foreground">
                {preview.content}
              </p>
              {preview.link_text && (
                <a
                  href={preview.link_url || '#'}
                  className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {preview.link_text}
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  )
}
