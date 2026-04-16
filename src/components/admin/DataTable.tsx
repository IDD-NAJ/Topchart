"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  Plus,
  MoreVertical,
  Inbox,
  AlertCircle,
} from "lucide-react"

interface Column {
  key: string
  label: string
  type?: "text" | "number" | "date" | "boolean" | "json" | "badge" | "select"
  badgeVariants?: Record<string, "default" | "secondary" | "destructive" | "outline">
  editable?: boolean
  bulkEditable?: boolean
  options?: { value: string; label: string }[]
  optionsFetcher?: () => Promise<{ value: string; label: string }[]>
}

interface DataTableProps {
  title: string
  tableName: string
  columns: Column[]
  icon?: React.ReactNode
  searchableColumns?: string[]
  defaultOrderBy?: string
  defaultOrderDir?: "asc" | "desc"
  allowCreate?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  allowBulkDelete?: boolean
  allowBulkEdit?: boolean
}

export function DataTable({
  title,
  tableName,
  columns,
  icon,
  searchableColumns = [],
  defaultOrderBy = "createdAt",
  defaultOrderDir = "desc",
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  allowBulkDelete = true,
  allowBulkEdit = true,
}: DataTableProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [editRow, setEditRow] = useState<any>(null)
  const [deleteRow, setDeleteRow] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const pageSize = 20
  
  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkFormData, setBulkFormData] = useState<Record<string, any>>({})
  
  // Select options state for dropdown columns
  const [selectOptions, setSelectOptions] = useState<Record<string, { value: string; label: string }[]>>({})

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        table: tableName,
        page: String(page),
        pageSize: String(pageSize),
        orderBy: defaultOrderBy,
        orderDir: defaultOrderDir,
      })
      if (search.trim()) {
        params.set("search", search.trim())
        params.set("searchColumns", searchableColumns.join(","))
      }
      const res = await fetch(`/api/admin/tables?${params}`, {
        credentials: "include",
      })
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }))
      if (json.success) {
        setData(json.data || [])
        setTotalPages(json.totalPages || 1)
        setTotalRows(json.totalRows || 0)
      } else {
        setError(json.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, tableName])

  // Reset selection when data changes
  useEffect(() => {
    setSelectedRows(new Set())
  }, [page, tableName, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch select options for dropdown columns
  useEffect(() => {
    const fetchSelectOptions = async () => {
      const optionsMap: Record<string, { value: string; label: string }[]> = {}
      
      for (const col of columns) {
        if (col.type === "select") {
          if (col.options) {
            optionsMap[col.key] = col.options
          } else if (col.optionsFetcher) {
            try {
              const options = await col.optionsFetcher()
              optionsMap[col.key] = options
            } catch (err) {
              console.error(`Failed to fetch options for ${col.key}:`, err)
            }
          }
        }
      }
      
      setSelectOptions(optionsMap)
    }
    
    fetchSelectOptions()
  }, [columns])

  const formatValue = (value: any, column: Column) => {
    if (value === null || value === undefined) return "-"
    
    switch (column.type) {
      case "date":
        return new Date(value).toLocaleString()
      case "boolean":
        return value ? "Yes" : "No"
      case "json":
        return typeof value === "object" ? JSON.stringify(value).slice(0, 50) + "..." : String(value)
      case "number":
        return typeof value === "number" ? value.toLocaleString() : value
      case "badge":
        const strVal = String(value)
        const variant = column.badgeVariants?.[strVal] || column.badgeVariants?.[strVal.toLowerCase()] || column.badgeVariants?.[strVal.toUpperCase()] || "secondary"
        return <Badge variant={variant}>{strVal}</Badge>
      default:
        const str = String(value)
        return str.length > 50 ? str.slice(0, 50) + "..." : str
    }
  }

  const exportCSV = () => {
    const headers = columns.map(c => c.label).join(",")
    const rows = data.map(row => 
      columns.map(c => {
        const val = row[c.key]
        if (val === null || val === undefined) return ""
        if (typeof val === "object") return JSON.stringify(val).replace(/,/g, ";")
        return String(val).replace(/,/g, ";")
      }).join(",")
    ).join("\n")
    const csv = headers + "\n" + rows
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tableName}_export.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCreate = () => {
    const initialData: Record<string, any> = {}
    columns.forEach(col => {
      if (col.key !== "id" && col.key !== "createdAt" && col.key !== "updatedAt") {
        initialData[col.key] = col.type === "boolean" ? false : col.type === "number" ? 0 : ""
      }
    })
    setFormData(initialData)
    setEditRow({ isNew: true })
  }

  const handleEdit = (row: any) => {
    setFormData({ ...row })
    setEditRow(row)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const isNew = editRow?.isNew
      const method = isNew ? "POST" : "PUT"
      const body = isNew 
        ? { table: tableName, data: formData }
        : { table: tableName, id: editRow.id, data: formData }
      
      const res = await fetch("/api/admin/tables", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(isNew ? "Record created successfully" : "Record updated successfully")
        setEditRow(null)
        setFormData({})
        fetchData()
      } else {
        toast.error(json.error || "Failed to save")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteRow) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tables?table=${tableName}&id=${deleteRow.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Record deleted successfully")
        setDeleteRow(null)
        fetchData()
      } else {
        // Handle specific database errors
        if (json.code === "FOREIGN_KEY_VIOLATION" || json.error?.includes("foreign key")) {
          toast.error("Cannot delete: This record is linked to other data. Delete related records first.")
        } else if (json.code === "UNIQUE_VIOLATION") {
          toast.error("A record with this information already exists.")
        } else {
          toast.error(json.error || "Failed to delete")
        }
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  // Selection handlers
  const toggleRowSelection = (id: string) => {
    const newSet = new Set(selectedRows)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedRows(newSet)
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      const allIds = data.map(row => row.id).filter(Boolean)
      setSelectedRows(new Set(allIds))
    }
  }

  const clearSelection = () => {
    setSelectedRows(new Set())
  }

  const isAllSelected = data.length > 0 && selectedRows.size === data.length
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length

  // Bulk operations handlers
  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tables?table=${tableName}&ids=${Array.from(selectedRows).join(',')}`, {
        method: "DELETE",
        credentials: "include",
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`${selectedRows.size} records deleted successfully`)
        setBulkDeleteOpen(false)
        setSelectedRows(new Set())
        fetchData()
      } else {
        if (json.code === "FOREIGN_KEY_VIOLATION") {
          toast.error("Some records could not be deleted because they are linked to other data.")
        } else {
          toast.error(json.error || "Failed to delete records")
        }
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  const handleBulkEdit = async () => {
    if (selectedRows.size === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/tables", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: tableName,
          ids: Array.from(selectedRows),
          data: bulkFormData,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`${selectedRows.size} records updated successfully`)
        setBulkEditOpen(false)
        setSelectedRows(new Set())
        setBulkFormData({})
        fetchData()
      } else {
        toast.error(json.error || "Failed to update records")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  const openBulkEdit = () => {
    // Initialize bulk form with empty values for bulkEditable columns
    const initialBulkData: Record<string, any> = {}
    setBulkFormData(initialBulkData)
    setBulkEditOpen(true)
  }

  const bulkEditableColumns = columns.filter(col => col.bulkEditable)

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              {icon}
              <span className="truncate">{title}</span>
              <Badge variant="outline" className="ml-2 hidden sm:inline-flex">{totalRows} records</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {searchableColumns.length > 0 && (
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full sm:w-48"
                  />
                </div>
              )}
              {allowCreate && (
                <Button variant="default" size="sm" onClick={handleCreate} className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
              {allowCreate && (
                <Button variant="default" size="icon" onClick={handleCreate} className="sm:hidden">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="hidden sm:flex">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="sm:hidden">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} className="hidden sm:flex">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportCSV} className="sm:hidden">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {error && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive text-center mb-4">{error}</p>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
          {!error && (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[480px] sm:min-w-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 w-10">
                        <Checkbox
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLInputElement).indeterminate = isIndeterminate
                            }
                          }}
                          onCheckedChange={toggleAllSelection}
                          aria-label="Select all"
                        />
                      </th>
                      {columns.map((col) => (
                        <th key={col.key} className="text-left p-3 font-medium whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                      <th className="text-left p-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={columns.length + 2} className="text-center py-8">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 2} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Inbox className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-lg font-medium">No records found</p>
                            <p className="text-sm mt-1">Try adjusting your search or add a new record</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      data.map((row, idx) => (
                        <tr key={row.id || idx} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedRows.has(row.id)}
                              onCheckedChange={() => row.id && toggleRowSelection(row.id)}
                              aria-label={`Select row ${row.id || idx + 1}`}
                            />
                          </td>
                          {columns.map((col) => (
                            <td key={col.key} className="p-3 max-w-[200px] truncate">
                              {formatValue(row[col.key], col)}
                            </td>
                          ))}
                          <td className="p-3">
                            {/* Desktop Actions */}
                            <div className="hidden sm:flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedRow(row)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {allowEdit && (
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {allowDelete && (
                                <Button variant="ghost" size="icon" onClick={() => setDeleteRow(row)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                            {/* Mobile Actions */}
                            <div className="sm:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedRow(row)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  {allowEdit && (
                                    <DropdownMenuItem onClick={() => handleEdit(row)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {allowDelete && (
                                    <DropdownMenuItem onClick={() => setDeleteRow(row)} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!error && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-4 sm:px-0 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-sm text-muted-foreground px-2 sm:hidden">
                  {page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>
              View the complete details of this record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRow && Object.entries(selectedRow).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 border-b pb-2">
                <div className="font-medium text-muted-foreground">{key}</div>
                <div className="col-span-2 break-all">
                  {value === null ? (
                    <span className="text-muted-foreground">null</span>
                  ) : typeof value === "object" ? (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : typeof value === "boolean" ? (
                    value ? "Yes" : "No"
                  ) : (
                    String(value)
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow?.isNew ? "Create New Record" : "Edit Record"}</DialogTitle>
            <DialogDescription>
              {editRow?.isNew ? "Fill in the details to create a new record." : "Make changes to the record below."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {columns.filter(col => col.key !== "id" && col.key !== "createdAt" && col.key !== "updatedAt").map((col) => (
              <div key={col.key} className="space-y-2">
                <Label htmlFor={col.key}>{col.label}</Label>
                {col.type === "boolean" ? (
                  <select
                    id={col.key}
                    value={formData[col.key] ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value === "true" })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                ) : col.type === "select" ? (
                  <select
                    id={col.key}
                    value={formData[col.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">-- Select {col.label} --</option>
                    {(selectOptions[col.key] || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : col.type === "json" ? (
                  <textarea
                    id={col.key}
                    value={typeof formData[col.key] === "object" ? JSON.stringify(formData[col.key], null, 2) : formData[col.key] || ""}
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, [col.key]: JSON.parse(e.target.value) })
                      } catch {
                        setFormData({ ...formData, [col.key]: e.target.value })
                      }
                    }}
                    className="w-full border rounded-md p-2 font-mono text-xs"
                    rows={4}
                  />
                ) : (
                  <Input
                    id={col.key}
                    type={col.type === "number" ? "number" : col.type === "date" ? "datetime-local" : "text"}
                    value={formData[col.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [col.key]: col.type === "number" ? Number(e.target.value) : e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedRows.size} Records?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedRows.size} selected records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting..." : `Delete ${selectedRows.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedRows.size} Records</DialogTitle>
            <DialogDescription>
              Update multiple records at once. Only changed fields will be applied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Only fields you specify will be updated on all selected records. Leave fields empty to keep existing values.
            </p>
            {bulkEditableColumns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bulk-editable fields available for this table.</p>
            ) : (
              bulkEditableColumns.filter(col => col.key !== "id" && col.key !== "createdAt" && col.key !== "updatedAt").map((col) => (
                <div key={col.key} className="space-y-2">
                  <Label htmlFor={`bulk-${col.key}`}>{col.label}</Label>
                  {col.type === "boolean" ? (
                    <select
                      id={`bulk-${col.key}`}
                      value={bulkFormData[col.key] === undefined ? "" : bulkFormData[col.key] ? "true" : "false"}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "") {
                          const { [col.key]: _, ...rest } = bulkFormData
                          setBulkFormData(rest)
                        } else {
                          setBulkFormData({ ...bulkFormData, [col.key]: val === "true" })
                        }
                      }}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">-- No Change --</option>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : (
                    <Input
                      id={`bulk-${col.key}`}
                      type={col.type === "number" ? "number" : "text"}
                      placeholder="-- No Change --"
                      value={bulkFormData[col.key] || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "") {
                          const { [col.key]: _, ...rest } = bulkFormData
                          setBulkFormData(rest)
                        } else {
                          setBulkFormData({ ...bulkFormData, [col.key]: col.type === "number" ? Number(val) : val })
                        }
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkEdit} disabled={saving || Object.keys(bulkFormData).length === 0 || bulkEditableColumns.length === 0}>
              {saving ? "Saving..." : `Update ${selectedRows.size} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Bulk Actions Toolbar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-0 max-w-[calc(100%-2rem)]">
          <div className="bg-background border rounded-lg shadow-lg px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={true}
                onCheckedChange={clearSelection}
                aria-label="Clear selection"
              />
              <span className="text-sm font-medium">{selectedRows.size} selected</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-1 sm:gap-2">
              {allowBulkEdit && bulkEditableColumns.length > 0 && (
                <Button variant="outline" size="sm" onClick={openBulkEdit} className="h-8 px-2 sm:px-3">
                  <Pencil className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {allowBulkDelete && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} className="h-8 px-2 sm:px-3">
                  <Trash2 className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
