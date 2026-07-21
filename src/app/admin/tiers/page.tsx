export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Save, Plus, Trash2, Star, RefreshCw, X } from "lucide-react";

interface ResellerTier {
  id: string;
  name: string;
  display_name: string;
  min_sales_amount: number;
  min_referrals: number;
  commission_rate: number;
  discount_rate: number;
  bonus_amount: number;
  perks: string[];
}

const TIER_DEFAULTS = [
  { name: "BRONZE", display_name: "Bronze", color: "bg-orange-100 text-orange-700" },
  { name: "SILVER", display_name: "Silver", color: "bg-gray-100 text-gray-700" },
  { name: "GOLD", display_name: "Gold", color: "bg-yellow-100 text-yellow-700" },
  { name: "PLATINUM", display_name: "Platinum", color: "bg-blue-100 text-blue-700" },
];

export default function AdminTierConfigPage() {
  const [tiers, setTiers] = useState<ResellerTier[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTierId, setSavingTierId] = useState<string | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null);
  const [newPerk, setNewPerk] = useState<Record<string, string>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTier, setNewTier] = useState({
    name: "",
    display_name: "",
    min_sales_amount: 0,
    min_referrals: 0,
    commission_rate: 0,
    discount_rate: 0,
    bonus_amount: 0,
    perks: [] as string[],
  });
  const [newTierPerk, setNewTierPerk] = useState("");

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tiers", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) setTiers(data.tiers);
    } catch {
      toast.error("Failed to load tiers");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tierId: string) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return;
    setSavingTierId(tierId);
    try {
      const res = await fetch("/api/admin/tiers", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tier),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        toast.success("Tier updated");
        setEditing(null);
        loadTiers();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingTierId(null);
    }
  };

  const handleDelete = async (tierId: string, tierName: string) => {
    if (!confirm(`Delete the ${tierName} tier? This cannot be undone.`)) return;
    setDeletingTierId(tierId);
    try {
      const res = await fetch(`/api/admin/tiers?id=${tierId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        toast.success("Tier deleted");
        loadTiers();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingTierId(null);
    }
  };

  const handleCreate = async () => {
    if (!newTier.name.trim() || !newTier.display_name.trim()) {
      toast.error("Name and display name are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tiers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTier, name: newTier.name.toUpperCase() }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        toast.success("Tier created");
        setShowCreateForm(false);
        setNewTier({
          name: "", display_name: "", min_sales_amount: 0, min_referrals: 0,
          commission_rate: 0, discount_rate: 0, bonus_amount: 0, perks: [],
        });
        setNewTierPerk("");
        loadTiers();
      } else {
        toast.error(data.error || "Failed to create");
      }
    } catch {
      toast.error("Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const updateTierField = (tierId: string, field: keyof ResellerTier, value: number) => {
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, [field]: value } : t)));
  };

  const addPerk = (tierId: string) => {
    const perk = newPerk[tierId]?.trim();
    if (!perk) return;
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, perks: [...(t.perks || []), perk] } : t))
    );
    setNewPerk((prev) => ({ ...prev, [tierId]: "" }));
  };

  const removePerk = (tierId: string, index: number) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, perks: t.perks.filter((_, i) => i !== index) } : t))
    );
  };

  const getTierStyle = (name: string) => {
    return (
      TIER_DEFAULTS.find((t) => t.name === name)?.color ??
      "bg-purple-100 text-purple-700"
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse" />
          <div className="h-9 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tier Configuration</h1>
          <p className="text-muted-foreground text-sm">Manage reseller tier levels and benefits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTiers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showCreateForm ? "Cancel" : "Create Tier"}
          </Button>
        </div>
      </div>

      {/* Create New Tier Form */}
      {showCreateForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Tier
            </CardTitle>
            <CardDescription>Add a new reseller tier with custom benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tier Code (e.g. GOLD)</Label>
                <Input
                  placeholder="e.g. DIAMOND"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g. Diamond"
                  value={newTier.display_name}
                  onChange={(e) => setNewTier({ ...newTier, display_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Min Sales (GHS)</Label>
                <Input
                  type="number"
                  value={newTier.min_sales_amount}
                  onChange={(e) => setNewTier({ ...newTier, min_sales_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Min Referrals</Label>
                <Input
                  type="number"
                  value={newTier.min_referrals}
                  onChange={(e) => setNewTier({ ...newTier, min_referrals: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTier.commission_rate}
                  onChange={(e) => setNewTier({ ...newTier, commission_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Discount Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTier.discount_rate}
                  onChange={(e) => setNewTier({ ...newTier, discount_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Bonus Amount (GHS)</Label>
                <Input
                  type="number"
                  value={newTier.bonus_amount}
                  onChange={(e) => setNewTier({ ...newTier, bonus_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Perks</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a perk..."
                  value={newTierPerk}
                  onChange={(e) => setNewTierPerk(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newTierPerk.trim()) {
                        setNewTier((prev) => ({ ...prev, perks: [...prev.perks, newTierPerk.trim()] }));
                        setNewTierPerk("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (newTierPerk.trim()) {
                      setNewTier((prev) => ({ ...prev, perks: [...prev.perks, newTierPerk.trim()] }));
                      setNewTierPerk("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newTier.perks.map((perk, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {perk}
                    <button
                      onClick={() => setNewTier((prev) => ({ ...prev, perks: prev.perks.filter((_, pi) => pi !== i) }))}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={creating}>
              <Save className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : "Create Tier"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tiers.length === 0 && !showCreateForm && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">No tiers configured yet.</p>
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Tier
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tiers.map((tier) => (
          <Card key={tier.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${getTierStyle(tier.name)}`}>
                    {tier.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle>{tier.display_name}</CardTitle>
                    <CardDescription>Code: {tier.name}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editing !== tier.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(tier.id, tier.display_name)}
                      disabled={deletingTierId === tier.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editing === tier.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Sales (GHS)</Label>
                      <Input
                        type="number"
                        value={tier.min_sales_amount}
                        onChange={(e) => updateTierField(tier.id, "min_sales_amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Min Referrals</Label>
                      <Input
                        type="number"
                        value={tier.min_referrals}
                        onChange={(e) => updateTierField(tier.id, "min_referrals", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.commission_rate}
                        onChange={(e) => updateTierField(tier.id, "commission_rate", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Discount Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.discount_rate}
                        onChange={(e) => updateTierField(tier.id, "discount_rate", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Bonus Amount (GHS)</Label>
                      <Input
                        type="number"
                        value={tier.bonus_amount}
                        onChange={(e) => updateTierField(tier.id, "bonus_amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Perks</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add perk..."
                        value={newPerk[tier.id] ?? ""}
                        onChange={(e) => setNewPerk((prev) => ({ ...prev, [tier.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addPerk(tier.id); }
                        }}
                      />
                      <Button type="button" size="sm" onClick={() => addPerk(tier.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(tier.perks || []).map((perk, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {perk}
                          <button
                            onClick={() => removePerk(tier.id, i)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(tier.id)} disabled={savingTierId === tier.id}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingTierId === tier.id ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => { setEditing(null); loadTiers(); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Min Sales</p>
                      <p className="font-semibold mt-0.5">GHS {tier.min_sales_amount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Min Referrals</p>
                      <p className="font-semibold mt-0.5">{tier.min_referrals}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Commission</p>
                      <p className="font-semibold mt-0.5 text-green-600">{tier.commission_rate}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Discount</p>
                      <p className="font-semibold mt-0.5 text-blue-600">{tier.discount_rate}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                      <p className="text-muted-foreground text-xs">Bonus Amount</p>
                      <p className="font-semibold mt-0.5">GHS {tier.bonus_amount}</p>
                    </div>
                  </div>

                  {(tier.perks || []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Perks</p>
                      <div className="flex flex-wrap gap-2">
                        {(tier.perks || []).map((perk, i) => (
                          <Badge key={i} variant="outline" className="text-xs flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {perk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="outline" className="w-full" onClick={() => setEditing(tier.id)}>
                    Edit Tier
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
