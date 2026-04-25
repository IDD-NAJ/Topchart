"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Save, 
  Plus, 
  Trash2, 
  Globe,
  Wifi,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataPackage {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  dataAllowance: string;
  validity: string;
  price: number;
  network: string;
  speed: string;
  region: string;
  isActive: boolean;
  sortOrder: number;
}

const REGIONS = [
  { id: "africa", name: "Africa" },
  { id: "europe", name: "Europe" },
  { id: "americas", name: "Americas" },
  { id: "middle_east", name: "Middle East" },
  { id: "asia", name: "Asia" },
];

const SPEEDS = ["3G", "4G", "5G", "LTE"];

function PackageItem({ 
  pkg, 
  index,
  total,
  onEdit, 
  onDelete,
  onReorder,
  isEditing,
  editData,
  onSaveEdit,
  onCancelEdit,
  onUpdateEditData,
  saving
}: { 
  pkg: DataPackage;
  index: number;
  total: number;
  onEdit: (pkg: DataPackage) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  isEditing: boolean;
  editData: Partial<DataPackage>;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUpdateEditData: (data: Partial<DataPackage>) => void;
  saving: boolean;
}) {
  if (isEditing) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Editing {pkg.country}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onCancelEdit} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={onSaveEdit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input 
                value={editData.country || ""} 
                onChange={(e) => onUpdateEditData({ country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input 
                value={editData.countryCode || ""} 
                onChange={(e) => onUpdateEditData({ countryCode: e.target.value })}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Flag Emoji</Label>
              <Input 
                value={editData.flag || ""} 
                onChange={(e) => onUpdateEditData({ flag: e.target.value })}
                placeholder="🇺🇸"
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₵)</Label>
              <Input 
                type="number" 
                value={editData.price || 0} 
                onChange={(e) => onUpdateEditData({ price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Allowance</Label>
              <Input 
                value={editData.dataAllowance || ""} 
                onChange={(e) => onUpdateEditData({ dataAllowance: e.target.value })}
                placeholder="e.g., 5GB"
              />
            </div>
            <div className="space-y-2">
              <Label>Validity</Label>
              <Input 
                value={editData.validity || ""} 
                onChange={(e) => onUpdateEditData({ validity: e.target.value })}
                placeholder="e.g., 7 days"
              />
            </div>
            <div className="space-y-2">
              <Label>Network</Label>
              <Input 
                value={editData.network || ""} 
                onChange={(e) => onUpdateEditData({ network: e.target.value })}
                placeholder="e.g., Vodafone"
              />
            </div>
            <div className="space-y-2">
              <Label>Speed</Label>
              <Select 
                value={editData.speed || "4G"} 
                onValueChange={(value) => onUpdateEditData({ speed: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEEDS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select 
                value={editData.region || "africa"} 
                onValueChange={(value) => onUpdateEditData({ region: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6 pt-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={editData.isActive ?? true} 
                  onCheckedChange={(checked) => onUpdateEditData({ isActive: checked })}
                />
                <Label className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!pkg.isActive ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{pkg.flag}</span>
              <h3 className="font-semibold">{pkg.country}</h3>
              <Badge variant="secondary">{pkg.countryCode}</Badge>
              {!pkg.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="text-2xl font-bold text-primary">₵{pkg.price}</span>
              <span className="flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                {pkg.dataAllowance}
              </span>
              <span>Valid for {pkg.validity}</span>
              <Badge variant="outline">{pkg.speed}</Badge>
              <span className="text-muted-foreground">{pkg.network}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              disabled={index === 0}
              onClick={() => onReorder(pkg.id, "up")}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">{index + 1}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              disabled={index === total - 1}
              onClick={() => onReorder(pkg.id, "down")}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(pkg)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(pkg.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPackagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<DataPackage[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DataPackage>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<DataPackage>>({
    country: "",
    countryCode: "",
    flag: "",
    dataAllowance: "",
    validity: "",
    price: 0,
    network: "",
    speed: "4G",
    region: "africa",
    isActive: true,
  });
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/esim/packages");
      const data = await res.json();
      if (data.success) {
        setPackages(data.data);
      } else {
        toast.error(data.error || "Failed to load packages");
      }
    } catch {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = packages.findIndex((p) => p.id === id);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= packages.length) return;
    
    const newPackages = [...packages];
    [newPackages[index], newPackages[newIndex]] = [newPackages[newIndex], newPackages[index]];
    
    const updatedPackages = newPackages.map((pkg, idx) => ({ ...pkg, sortOrder: idx }));
    setPackages(updatedPackages);

    try {
      for (const pkg of updatedPackages) {
        await fetch("/api/admin/esim/packages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pkg.id, sortOrder: pkg.sortOrder }),
        });
      }
    } catch {
      toast.error("Failed to save new order");
    }
  };

  const handleEdit = (pkg: DataPackage) => {
    setEditingId(pkg.id);
    setEditData({ ...pkg });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/esim/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Package updated");
        setEditingId(null);
        setEditData({});
        fetchPackages();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/esim/packages?id=${id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Package deleted");
        fetchPackages();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSaving(false);
      setDeleteConfirmId(null);
    }
  };

  const handleCreate = async () => {
    if (!newPackage.country || !newPackage.dataAllowance || !newPackage.price) {
      toast.error("Country, data allowance, and price are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/esim/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPackage),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Package created");
        setIsCreating(false);
        setNewPackage({
          country: "",
          countryCode: "",
          flag: "",
          dataAllowance: "",
          validity: "",
          price: 0,
          network: "",
          speed: "4G",
          region: "africa",
          isActive: true,
        });
        fetchPackages();
      } else {
        toast.error(data.error || "Failed to create");
      }
    } catch {
      toast.error("Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const filteredPackages = selectedRegion === "all" 
    ? packages 
    : packages.filter(p => p.region === selectedRegion);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/esim">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Travel Data eSIMs</h1>
            <p className="text-muted-foreground">
              Manage country and region data packages
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Packages</CardDescription>
            <CardTitle className="text-2xl">{packages.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Packages</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {packages.filter(p => p.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Regions Covered</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {new Set(packages.map(p => p.region)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Region Filter */}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="h-9 px-3 rounded-md border bg-background text-sm"
        >
          <option value="all">All Regions</option>
          {REGIONS.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <Badge variant="secondary">{filteredPackages.length} packages</Badge>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Data Package</DialogTitle>
            <DialogDescription>
              Add a new travel data eSIM package
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input 
                  value={newPackage.country} 
                  onChange={(e) => setNewPackage({ ...newPackage, country: e.target.value })}
                  placeholder="e.g., Ghana"
                />
              </div>
              <div className="space-y-2">
                <Label>Country Code (ISO)</Label>
                <Input 
                  value={newPackage.countryCode} 
                  onChange={(e) => setNewPackage({ ...newPackage, countryCode: e.target.value })}
                  placeholder="e.g., GH"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flag Emoji</Label>
                <Input 
                  value={newPackage.flag} 
                  onChange={(e) => setNewPackage({ ...newPackage, flag: e.target.value })}
                  placeholder="e.g., 🇬🇭"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₵)</Label>
                <Input 
                  type="number" 
                  value={newPackage.price || ""} 
                  onChange={(e) => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Allowance</Label>
                <Input 
                  value={newPackage.dataAllowance} 
                  onChange={(e) => setNewPackage({ ...newPackage, dataAllowance: e.target.value })}
                  placeholder="e.g., 5GB"
                />
              </div>
              <div className="space-y-2">
                <Label>Validity</Label>
                <Input 
                  value={newPackage.validity} 
                  onChange={(e) => setNewPackage({ ...newPackage, validity: e.target.value })}
                  placeholder="e.g., 7 days"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Network Provider</Label>
                <Input 
                  value={newPackage.network} 
                  onChange={(e) => setNewPackage({ ...newPackage, network: e.target.value })}
                  placeholder="e.g., Vodafone"
                />
              </div>
              <div className="space-y-2">
                <Label>Speed</Label>
                <Select 
                  value={newPackage.speed} 
                  onValueChange={(value) => setNewPackage({ ...newPackage, speed: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEEDS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select 
                value={newPackage.region} 
                onValueChange={(value) => setNewPackage({ ...newPackage, region: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={newPackage.isActive} 
                onCheckedChange={(checked) => setNewPackage({ ...newPackage, isActive: checked })}
              />
              <Label className="cursor-pointer">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Packages List */}
      <div className="space-y-3">
        {filteredPackages.map((pkg, index) => (
          <PackageItem
            key={pkg.id}
            pkg={pkg}
            index={index}
            total={filteredPackages.length}
            onEdit={handleEdit}
            onDelete={setDeleteConfirmId}
            onReorder={handleReorder}
            isEditing={editingId === pkg.id}
            editData={editData}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onUpdateEditData={setEditData}
            saving={saving}
          />
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <Card className="p-12 text-center">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data packages for this region yet.</p>
          <Button onClick={() => setIsCreating(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </Card>
      )}
    </div>
  );
}
