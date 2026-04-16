"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  Loader2, 
  Save, 
  RefreshCw, 
  Search, 
  Filter,
  DollarSign,
  Percent,
  Star,
  Eye,
  EyeOff,
  Edit3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataBundle {
  id: string;
  networkId: string;
  network: string;
  name: string;
  validity: string | null;
  validityHours: number | null;
  validityDays: number | null;
  providerPrice: number;
  originalPrice: number | null;
  priceOverride: number | null;
  markupPercent: number | null;
  isPopular: boolean;
  isActive: boolean;
  isFeatured: boolean;
  datamartPlanId: string | null;
  datamartPlanType: string | null;
  notes: string | null;
  syncedAt: string | null;
}

const NETWORKS = ["All", "MTN", "Telecel", "AirtelTigo"];
const PLAN_TYPES = ["All", "SME", "GIFTING", "CG", "DIRECT"];

export default function DataBundlesPricingPage() {
  const [bundles, setBundles] = useState<DataBundle[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<DataBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [networkFilter, setNetworkFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<Record<string, Partial<DataBundle>>>({});

  const fetchBundles = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/data-bundles-pricing");
      const result = await response.json();
      
      if (result.success) {
        setBundles(result.data);
        toast.success("Bundles loaded successfully");
      } else {
        toast.error(result.error || "Failed to load bundles");
      }
    } catch (error) {
      toast.error("Failed to fetch data bundles");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  useEffect(() => {
    let filtered = bundles;

    if (networkFilter !== "All") {
      filtered = filtered.filter(b => b.network === networkFilter);
    }

    if (typeFilter !== "All") {
      filtered = filtered.filter(b => b.datamartPlanType === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.network.toLowerCase().includes(query) ||
        (b.datamartPlanId && b.datamartPlanId.toLowerCase().includes(query))
      );
    }

    setFilteredBundles(filtered);
  }, [bundles, networkFilter, typeFilter, searchQuery]);

  const calculateEffectivePrice = (bundle: DataBundle): number => {
    if (bundle.priceOverride !== null && bundle.priceOverride > 0) {
      return bundle.priceOverride;
    }
    if (bundle.markupPercent !== null && bundle.markupPercent > 0) {
      const markup = bundle.providerPrice * (bundle.markupPercent / 100);
      return Number((bundle.providerPrice + markup).toFixed(2));
    }
    return bundle.providerPrice;
  };

  const handleEdit = (bundle: DataBundle) => {
    setEditing(prev => new Set(prev).add(bundle.id));
    setEditValues(prev => ({
      ...prev,
      [bundle.id]: {
        priceOverride: bundle.priceOverride,
        markupPercent: bundle.markupPercent,
        isActive: bundle.isActive,
        isFeatured: bundle.isFeatured,
        isPopular: bundle.isPopular,
      }
    }));
  };

  const handleSave = async (bundle: DataBundle) => {
    const updates = editValues[bundle.id];
    if (!updates) return;

    try {
      setSaving(prev => new Set(prev).add(bundle.id));
      
      const response = await fetch("/api/admin/data-bundles-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bundle.id,
          updates: {
            priceOverride: updates.priceOverride,
            markupPercent: updates.markupPercent,
            isActive: updates.isActive,
            isFeatured: updates.isFeatured,
            isPopular: updates.isPopular,
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Bundle updated successfully");
        setBundles(prev => prev.map(b => 
          b.id === bundle.id ? { ...b, ...updates } : b
        ));
        setEditing(prev => {
          const next = new Set(prev);
          next.delete(bundle.id);
          return next;
        });
        setEditValues(prev => {
          const next = { ...prev };
          delete next[bundle.id];
          return next;
        });
      } else {
        toast.error(result.error || "Failed to update bundle");
      }
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setSaving(prev => {
        const next = new Set(prev);
        next.delete(bundle.id);
        return next;
      });
    }
  };

  const handleCancel = (bundleId: string) => {
    setEditing(prev => {
      const next = new Set(prev);
      next.delete(bundleId);
      return next;
    });
    setEditValues(prev => {
      const next = { ...prev };
      delete next[bundleId];
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    if (networkFilter === "All") {
      toast.error("Please select a specific network for bulk updates");
      return;
    }

    toast.info("Bulk update functionality coming soon");
  };

  const updateEditValue = (bundleId: string, field: keyof DataBundle, value: unknown) => {
    setEditValues(prev => ({
      ...prev,
      [bundleId]: {
        ...prev[bundleId],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#F38F20]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Bundle Pricing</h1>
          <p className="text-muted-foreground">
            Manage plan pricing, markups, and visibility settings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchBundles}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#F38F20]" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold">Network</Label>
              <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold">Plan Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {networkFilter !== "All" && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkUpdate}
                className="gap-2"
              >
                <Percent className="w-4 h-4" />
                Bulk Update {networkFilter}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Plans ({filteredBundles.length})
            </CardTitle>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <DollarSign className="w-3 h-3" />
                Provider Price
              </Badge>
              <Badge variant="outline" className="gap-1 bg-[#F38F20]/10">
                <DollarSign className="w-3 h-3 text-[#F38F20]" />
                Effective Price
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Plan</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Provider</TableHead>
                  <TableHead className="text-right">Override</TableHead>
                  <TableHead className="text-right">Markup %</TableHead>
                  <TableHead className="text-right">Effective</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBundles.map((bundle) => {
                  const isEditing = editing.has(bundle.id);
                  const isSavingBundle = saving.has(bundle.id);
                  const effectivePrice = calculateEffectivePrice(bundle);
                  const editValue = editValues[bundle.id] || {};

                  return (
                    <TableRow key={bundle.id} className={cn(
                      !bundle.isActive && "opacity-60",
                      bundle.isFeatured && "bg-[#F38F20]/5"
                    )}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{bundle.name}</p>
                          {bundle.validity && (
                            <p className="text-xs text-muted-foreground">{bundle.validity}</p>
                          )}
                          {bundle.datamartPlanId && (
                            <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]">
                              {bundle.datamartPlanId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {bundle.network}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {bundle.datamartPlanType || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        GH₵{bundle.providerPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue.priceOverride ?? ""}
                            onChange={(e) => updateEditValue(bundle.id, "priceOverride", e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-24 h-8 text-right"
                            placeholder="Auto"
                          />
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">
                            {bundle.priceOverride ? `GH₵${bundle.priceOverride.toFixed(2)}` : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={editValue.markupPercent ?? ""}
                            onChange={(e) => updateEditValue(bundle.id, "markupPercent", e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-20 h-8 text-right"
                            placeholder="Auto"
                          />
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">
                            {bundle.markupPercent ? `${bundle.markupPercent.toFixed(2)}%` : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-mono text-sm font-bold",
                          effectivePrice !== bundle.providerPrice && "text-[#F38F20]"
                        )}>
                          GH₵{effectivePrice.toFixed(2)}
                        </span>
                        {effectivePrice !== bundle.providerPrice && (
                          <span className="text-[10px] text-muted-foreground block">
                            {effectivePrice > bundle.providerPrice ? "↑" : "↓"}
                            {Math.abs(((effectivePrice - bundle.providerPrice) / bundle.providerPrice) * 100).toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Switch
                            checked={editValue.isActive}
                            onCheckedChange={(checked) => updateEditValue(bundle.id, "isActive", checked)}
                          />
                        ) : (
                          <div className="flex justify-center">
                            {bundle.isActive ? (
                              <Eye className="w-4 h-4 text-green-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Switch
                            checked={editValue.isFeatured}
                            onCheckedChange={(checked) => updateEditValue(bundle.id, "isFeatured", checked)}
                          />
                        ) : (
                          <div className="flex justify-center">
                            {bundle.isFeatured ? (
                              <Star className="w-4 h-4 text-[#F38F20] fill-current" />
                            ) : (
                              <Star className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSave(bundle)}
                                disabled={isSavingBundle}
                                className="h-8 w-8 p-0"
                              >
                                {isSavingBundle ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(bundle.id)}
                                disabled={isSavingBundle}
                                className="h-8 w-8 p-0"
                              >
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(bundle)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBundles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No bundles found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
