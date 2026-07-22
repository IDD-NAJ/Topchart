// Template for admin table pages
// Copy this to create new admin pages

'use client'

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Loader2, Download } from 'lucide-react'

interface TableRow {
  id: string
  [key: string]: any
}

interface GenericTablePageProps {
  title: string
  description?: string
  apiEndpoint: string
  tableColumns: { key: string; label: string }[]
  canAdd?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function GenericTablePage({
  title,
  description,
  apiEndpoint,
  tableColumns,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}: GenericTablePageProps) {
  const [rows, setRows] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiEndpoint}?limit=100${search ? `&search=${search}` : ''}`)
      const data = await res.json()
      if (data.success) setRows(data.data || [])
      else setError(data.error)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageShell title={title} description={description || `Manage ${title.toLowerCase()}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {canAdd && (
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="text-red-600 p-4 border border-red-200 rounded">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No data found</div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b sticky top-0">
                <tr>
                  {tableColumns.map(col => (
                    <th key={col.key} className="px-4 py-2 text-left font-semibold">
                      {col.label}
                    </th>
                  ))}
                  {(canEdit || canDelete) && <th className="px-4 py-2 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    {tableColumns.map(col => (
                      <td key={col.key} className="px-4 py-2 truncate max-w-xs">
                        {typeof row[col.key] === 'boolean'
                          ? row[col.key]
                            ? '✓'
                            : '✗'
                          : String(row[col.key] || '-')}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-2 flex gap-2">
                        {canEdit && <Edit2 className="h-4 w-4 cursor-pointer text-blue-600" />}
                        {canDelete && <Trash2 className="h-4 w-4 cursor-pointer text-red-600" />}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
