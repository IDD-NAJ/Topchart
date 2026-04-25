"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Save, Plus, Trash2, Star } from "lucide-react";

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

export default function AdminTierConfigPage() {
  const [tiers, setTiers] = useState<ResellerTier[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTierId, setSavingTierId] = useState<string | null>(null);
  const [newPerk, setNewPerk] = useState("");

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const res = await fetch("/api/admin/tiers", {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setTiers(data.tiers);
      }
    } catch (error) {
      toast.error("Failed to load tiers");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;
    
    setSavingTierId(tierId);
    try {
      const res = await fetch("/api/admin/tiers", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tier)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Tier updated");
        setEditing(null);
        loadTiers();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSavingTierId(null);
    }
  };

  const updateTierField = (tierId: string, field: keyof ResellerTier, value: number) => {
    setTiers(prev => prev.map(t => 
      t.id === tierId ? { ...t, [field]: value } : t
    ));
  };

  const addPerk = (tierId: string) => {
    if (!newPerk.trim()) return;
    setTiers(prev => prev.map(t => 
      t.id === tierId ? { ...t, perks: [...(t.perks || []), newPerk.trim()] } : t
    ));
    setNewPerk("");
  };

  const removePerk = (tierId: string, index: number) => {
    setTiers(prev => prev.map(t => 
      t.id === tierId ? { ...t, perks: t.perks.filter((_, i) => i !== index) } : t
    ));
  };

  const getTierIcon = (name: string) => {
    switch (name) {
      case 'BRONZE': return <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">B</div>;
      case 'SILVER': return <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">S</div>;
      case 'GOLD': return <div className="h-10 w-10 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold">G</div>;
      case 'PLATINUM': return <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">P</div>;
      default: return <Trophy className="h-10 w-10" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--marketing-accent)]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tier Configuration</h1>
        <p className="text-muted-foreground">Manage reseller tier levels and benefits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tiers.map((tier) => (
          <Card key={tier.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getTierIcon(tier.name)}
                <div>
                  <CardTitle>{tier.display_name}</CardTitle>
                  <CardDescription>Code: {tier.name}</CardDescription>
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
                        onChange={(e) => updateTierField(tier.id, 'min_sales_amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Min Referrals</Label>
                      <Input
                        type="number"
                        value={tier.min_referrals}
                        onChange={(e) => updateTierField(tier.id, 'min_referrals', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.commission_rate}
                        onChange={(e) => updateTierField(tier.id, 'commission_rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Discount Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.discount_rate}
                        onChange={(e) => updateTierField(tier.id, 'discount_rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Bonus Amount (GHS)</Label>
                      <Input
                        type="number"
                        value={tier.bonus_amount}
                        onChange={(e) => updateTierField(tier.id, 'bonus_amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Perks</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add perk..."
                        value={newPerk}
                        onChange={(e) => setNewPerk(e.target.value)}
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
                    <Button variant="outline" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Min Sales:</span>
                      <span className="ml-2 font-medium">GHS {tier.min_sales_amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Referrals:</span>
                      <span className="ml-2 font-medium">{tier.min_referrals}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Commission:</span>
                      <span className="ml-2 font-medium">{tier.commission_rate}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="ml-2 font-medium">{tier.discount_rate}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bonus:</span>
                      <span className="ml-2 font-medium">GHS {tier.bonus_amount}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Perks:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(tier.perks || []).map((perk, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {perk}
                        </Badge>
                      ))}
                    </div>
                  </div>

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
