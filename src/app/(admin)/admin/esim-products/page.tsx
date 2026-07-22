'use client'

import { useState, useEffect } from 'react'
import { AdminPageShell, AdminTableShell } from '@/components/admin/AdminPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'

export default function ESIMProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/esim-products')
      const data = await res.json()
      if (data.success) setProducts(data.data || [])
      else setError(data.error)
    } catch (err) {
      setError('Failed to fetch eSIM products')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageShell title="eSIM Products" description="Manage eSIM products and plans">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input placeholder="Search products..." className="max-w-sm" />
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="text-red-600 p-4 border border-red-200 rounded">{error}</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Country</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Validity</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Active</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.country}</td>
                    <td className="px-4 py-2">{p.data_volume}</td>
                    <td className="px-4 py-2">{p.validity_days || '-'}</td>
                    <td className="px-4 py-2 font-semibold">${p.price}</td>
                    <td className="px-4 py-2">{p.is_active ? '✓' : '✗'}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Edit2 className="h-4 w-4 cursor-pointer text-blue-600" />
                      <Trash2 className="h-4 w-4 cursor-pointer text-red-600" />
                    </td>
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
