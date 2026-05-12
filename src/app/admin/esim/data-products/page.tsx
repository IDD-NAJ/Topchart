"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Globe,
  Wifi,
  Edit
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DataProduct {
  id: string;
  name: string;
  country: string;
  region: string | null;
  data_volume: string;
  validity_days: number;
  price: string; // numeric from Postgres comes as string typically, or number if casted
  description: string | null;
  is_active: boolean;
}

export default function AdminDataProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<DataProduct>>({
    name: "",
    country: "",
    region: "",
    data_volume: "1GB",
    validity_days: 7,
    price: "0.00",
    description: "",
    is_active: true,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/esim/data-products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error(data.error || "Failed to load products");
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      country: "",
      region: "",
      data_volume: "1GB",
      validity_days: 7,
      price: "0.00",
      description: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (product: DataProduct) => {
    setEditingId(product.id);
    setFormData({
      ...product,
      region: product.region || "",
      description: product.description || "",
      price: product.price.toString()
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.country || !formData.data_volume || !formData.price || !formData.validity_days) {
      toast.error("Required fields missing");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/esim/data-products/${editingId}` : "/api/admin/esim/data-products";
      const method = editingId ? "PATCH" : "POST";
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price as string),
        validity_days: parseInt(formData.validity_days as unknown as string),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Product updated" : "Product created");
        setIsDialogOpen(false);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    
    try {
      const res = await fetch(`/api/admin/esim/data-products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deactivated");
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/esim">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Travel Data eSIM Products</h1>
            <p className="text-muted-foreground">Manage data packages and pricing</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Product
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className={!product.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {product.name}
                </CardTitle>
                {!product.is_active && <Badge variant="secondary">Inactive</Badge>}
              </div>
              <CardDescription>{product.country} {product.region ? `(${product.region})` : ''}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  {product.data_volume}
                </Badge>
                <Badge variant="outline">{product.validity_days} Days</Badge>
                <div className="text-lg font-bold text-primary ml-auto">₵{product.price}</div>
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {product.is_active && (
                   <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(product.id)}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Data Product" : "Create Data Product"}</DialogTitle>
            <DialogDescription>
              Configure the eSIM rules, country, and data cap.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., USA 5GB 30Days"
              />
            </div>
            <div className="space-y-2">
              <Label>Country Context</Label>
              <Input 
                value={formData.country || ""} 
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., United States"
              />
            </div>
            <div className="space-y-2">
              <Label>Region (Optional)</Label>
              <Input 
                value={formData.region || ""} 
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., North America"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Volume</Label>
              <Input 
                value={formData.data_volume || ""} 
                onChange={(e) => setFormData({ ...formData, data_volume: e.target.value })}
                placeholder="e.g., 5GB or Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label>Validity (Days)</Label>
              <Input 
                type="number"
                value={formData.validity_days || 0} 
                onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₵)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.price || "0.00"} 
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Input 
                value={formData.description || ""} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Any special notes or provider details"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 mt-2">
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Product is Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
