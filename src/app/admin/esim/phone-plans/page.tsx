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
  Phone, 
  MessageSquare, 
  CheckCircle2,
  Star,
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

interface PhonePlan {
  id: string;
  name: string;
  price: number;
  minutes: number;
  sms: number;
  validityDays: number;
  features: string[];
  isActive: boolean;
  popular: boolean;
  sortOrder: number;
}

function PlanItem({ 
  plan, 
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
  plan: PhonePlan;
  index: number;
  total: number;
  onEdit: (plan: PhonePlan) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  isEditing: boolean;
  editData: Partial<PhonePlan>;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUpdateEditData: (data: Partial<PhonePlan>) => void;
  saving: boolean;
}) {
  if (isEditing) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Editing {plan.name}</span>
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
              <Label>Name</Label>
              <Input 
                value={editData.name || ""} 
                onChange={(e) => onUpdateEditData({ name: e.target.value })}
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
            <div className="space-y-2">
              <Label>Minutes</Label>
              <Input 
                type="number" 
                value={editData.minutes || 0} 
                onChange={(e) => onUpdateEditData({ minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMS</Label>
              <Input 
                type="number" 
                value={editData.sms || 0} 
                onChange={(e) => onUpdateEditData({ sms: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Validity (days)</Label>
              <Input 
                type="number" 
                value={editData.validityDays || 30} 
                onChange={(e) => onUpdateEditData({ validityDays: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={editData.popular || false} 
                  onCheckedChange={(checked) => onUpdateEditData({ popular: checked })}
                />
                <Label className="cursor-pointer">Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={editData.isActive ?? true} 
                  onCheckedChange={(checked) => onUpdateEditData({ isActive: checked })}
                />
                <Label className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Features (comma-separated)</Label>
            <Input 
              value={(editData.features || []).join(", ")} 
              onChange={(e) => onUpdateEditData({ features: e.target.value.split(",").map(f => f.trim()).filter(Boolean) })}
              placeholder="US phone number, Call forwarding, SMS receive, 30-day validity"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!plan.isActive ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{plan.name}</h3>
              {plan.popular && (
                <Badge variant="default" className="bg-amber-500">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="text-2xl font-bold text-primary">₵{plan.price}</span>
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {plan.minutes} minutes
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {plan.sms} SMS
              </span>
              <span>{plan.validityDays} days validity</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {plan.features.map((feature, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              disabled={index === 0}
              onClick={() => onReorder(plan.id, "up")}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">{index + 1}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              disabled={index === total - 1}
              onClick={() => onReorder(plan.id, "down")}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(plan.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPhonePlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PhonePlan[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PhonePlan>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<PhonePlan>>({
    name: "",
    price: 0,
    minutes: 0,
    sms: 0,
    validityDays: 30,
    features: [],
    isActive: true,
    popular: false,
  });


  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/esim/plans");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      } else {
        toast.error(data.error || "Failed to load plans");
      }
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= plans.length) return;
    
    const newPlans = [...plans];
    [newPlans[index], newPlans[newIndex]] = [newPlans[newIndex], newPlans[index]];
    
    // Update sort order
    const updatedPlans = newPlans.map((plan, idx) => ({ ...plan, sortOrder: idx }));
    setPlans(updatedPlans);

    // Save new order to backend
    try {
      for (const plan of updatedPlans) {
        await fetch("/api/admin/esim/plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: plan.id, sortOrder: plan.sortOrder }),
        });
      }
    } catch {
      toast.error("Failed to save new order");
    }
  };

  const handleEdit = (plan: PhonePlan) => {
    setEditingId(plan.id);
    setEditData({ ...plan });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/esim/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Plan updated");
        setEditingId(null);
        setEditData({});
        fetchPlans();
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
      const res = await fetch(`/api/admin/esim/plans?id=${id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Plan deleted");
        fetchPlans();
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
    if (!newPlan.name || !newPlan.price) {
      toast.error("Name and price are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/esim/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Plan created");
        setIsCreating(false);
        setNewPlan({
          name: "",
          price: 0,
          minutes: 0,
          sms: 0,
          validityDays: 30,
          features: [],
          isActive: true,
          popular: false,
        });
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to create");
      }
    } catch {
      toast.error("Failed to create");
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/esim">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Phone Number Plans</h1>
            <p className="text-muted-foreground">
              Manage US phone number eSIM plans
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Plans</CardDescription>
            <CardTitle className="text-2xl">{plans.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Plans</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {plans.filter(p => p.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Popular Plans</CardDescription>
            <CardTitle className="text-2xl text-amber-500">
              {plans.filter(p => p.popular).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Phone Plan</DialogTitle>
            <DialogDescription>
              Add a new US phone number plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input 
                  value={newPlan.name} 
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g., US Premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₵)</Label>
                <Input 
                  type="number" 
                  value={newPlan.price || ""} 
                  onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Minutes</Label>
                <Input 
                  type="number" 
                  value={newPlan.minutes || ""} 
                  onChange={(e) => setNewPlan({ ...newPlan, minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>SMS</Label>
                <Input 
                  type="number" 
                  value={newPlan.sms || ""} 
                  onChange={(e) => setNewPlan({ ...newPlan, sms: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Validity (days)</Label>
                <Input 
                  type="number" 
                  value={newPlan.validityDays || ""} 
                  onChange={(e) => setNewPlan({ ...newPlan, validityDays: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features (comma-separated)</Label>
              <Input 
                value={(newPlan.features || []).join(", ")} 
                onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value.split(",").map(f => f.trim()).filter(Boolean) })}
                placeholder="US phone number, Call forwarding, SMS receive, 30-day validity"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={newPlan.popular} 
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, popular: checked })}
                />
                <Label className="cursor-pointer">Mark as Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={newPlan.isActive} 
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, isActive: checked })}
                />
                <Label className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this plan? This action cannot be undone.
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

      {/* Plans List */}
      <div className="space-y-3">
        {plans.map((plan, index) => (
          <PlanItem
            key={plan.id}
            plan={plan}
            index={index}
            total={plans.length}
            onEdit={handleEdit}
            onDelete={setDeleteConfirmId}
            onReorder={handleReorder}
            isEditing={editingId === plan.id}
            editData={editData}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onUpdateEditData={setEditData}
            saving={saving}
          />
        ))}
      </div>

      {plans.length === 0 && (
        <Card className="p-12 text-center">
          <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No phone plans yet. Create your first plan!</p>
          <Button onClick={() => setIsCreating(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </Card>
      )}
    </div>
  );
}
