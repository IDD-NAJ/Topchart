'use client'
import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Loader2, Download } from 'lucide-react'
import { adminFetcher } from '@/lib/admin-fetcher'

export default function Page() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminFetcher<{ success: boolean; data: any[] }>('/api/admin/smspva-management')
      .then(d => {
        setData(d.data || [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <AdminPageShell title="SMSPVA Management" description="Manage SMSPVA Management">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input placeholder="Search..." className="max-w-sm" />
          <div className="flex gap-2">
            <Button className="gap-2"><Plus className="h-4 w-4" />Add</Button>
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /><p>Loading...</p>
          </div>
        ) : error ? (
          <div className="text-red-600 p-4 border border-red-200 rounded">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No data found</div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b"><tr><th className="px-4 py-2">Data</th><th className="px-4 py-2">Actions</th></tr></thead>
              <tbody className="divide-y">
                {data.map(row => <tr key={row.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2">{JSON.stringify(row).substring(0,60)}</td>
                  <td className="px-4 py-2 flex gap-2"><Edit2 className="h-4 w-4" /><Trash2 className="h-4 w-4" /></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
