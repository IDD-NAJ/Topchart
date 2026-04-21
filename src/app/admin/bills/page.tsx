"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Zap,
  Tv,
  Wifi,
  Droplets
} from "lucide-react";

interface ProviderConfig {
  id: string;
  enabled: boolean;
  priority: number;
  markup_percent: number;
  daily_limit: number | null;
  daily_volume: number;
  success_count: number;
  failure_count: number;
  health_status: string;
  realtimeAvailable: boolean;
  realtimeError?: string;
}

interface StatsOverview {
  total_transactions: string;
  successful_count: string;
  failed_count: string;
  total_amount: string;
}

export default function AdminBillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      const [providersRes, statsRes] = await Promise.all([
        fetch("/api/admin/bills/providers"),
        fetch("/api/admin/bills/stats?days=30"),
      ]);

      if (providersRes.ok) {
        const providersData = await providersRes.json();
        if (providersData.success) {
          setProviders(providersData.data);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data.overall);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProvider(id: string, updates: Partial<ProviderConfig>) {
    try {
      setSaving(id);
      const res = await fetch("/api/admin/bills/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to update provider:", error);
    } finally {
      setSaving(null);
    }
  }

  function getStatusIcon(status: string, available: boolean) {
    if (available && status === "healthy") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (available) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case "electricity":
        return <Zap className="h-4 w-4" />;
      case "tv":
        return <Tv className="h-4 w-4" />;
      case "internet":
        return <Wifi className="h-4 w-4" />;
      case "water":
        return <Droplets className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bill Payment Providers</h1>
          <p className="text-muted-foreground">
            Manage VTpass and Datamart bill payment integrations
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions (30d)</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseInt(stats.total_transactions).toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {parseInt(stats.successful_count).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {parseInt(stats.failed_count).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount (GHS)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {parseFloat(stats.total_amount || "0").toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(provider.health_status, provider.realtimeAvailable)}
                  <div>
                    <CardTitle className="capitalize">{provider.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Priority {provider.priority} • {provider.realtimeAvailable ? "Available" : "Unavailable"}
                    </p>
                  </div>
                </div>
                <Badge variant={provider.enabled ? "default" : "secondary"}>
                  {provider.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider.realtimeError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {provider.realtimeError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`enabled-${provider.id}`}>Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow payments through this provider
                  </p>
                </div>
                <Switch
                  id={`enabled-${provider.id}`}
                  checked={provider.enabled}
                  onCheckedChange={(checked) =>
                    updateProvider(provider.id, { enabled: checked })
                  }
                  disabled={saving === provider.id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`markup-${provider.id}`}>Markup (%)</Label>
                <Input
                  id={`markup-${provider.id}`}
                  type="number"
                  value={provider.markup_percent}
                  onChange={(e) =>
                    updateProvider(provider.id, {
                      markup_percent: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                  step={0.1}
                  disabled={saving === provider.id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`limit-${provider.id}`}>Daily Limit (GHS)</Label>
                <Input
                  id={`limit-${provider.id}`}
                  type="number"
                  value={provider.daily_limit || ""}
                  onChange={(e) =>
                    updateProvider(provider.id, {
                      daily_limit: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="No limit"
                  min={0}
                  disabled={saving === provider.id}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-medium">
                      {provider.success_count + provider.failure_count > 0
                        ? `${(
                            (provider.success_count /
                              (provider.success_count + provider.failure_count)) *
                            100
                          ).toFixed(1)}%`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Volume</p>
                    <p className="font-medium">{provider.daily_volume.toLocaleString()} GHS</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: "electricity", name: "Electricity", icon: Zap, services: ["ECG Prepaid", "ECG Postpaid"] },
              { id: "tv", name: "TV Subscription", icon: Tv, services: ["DSTV", "GOtv", "StarTimes"] },
              { id: "internet", name: "Internet", icon: Wifi, services: ["MTN Fibre", "Telecel Broadband"] },
              { id: "water", name: "Water", icon: Droplets, services: ["Ghana Water (GWCL)"] },
            ].map((category) => (
              <div key={category.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <category.icon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">{category.name}</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {category.services.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
