export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface ProviderConfig {
  id: string;
  providerName: string;
  providerType: string;
  isEnabled: boolean;
  isPrimary: boolean;
  isFallback: boolean;
  priority: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function DataProvidersPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data-providers");
      const data = await res.json();
      if (data.success) {
        setProviders(data.data || []);
      } else {
        setError(data.error || "Failed to fetch providers");
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleEnabled = async (providerName: string, isEnabled: boolean) => {
    setUpdating(providerName);
    setError(null);
    try {
      const res = await fetch("/api/admin/data-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerName, updates: { isEnabled } }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProviders();
      } else {
        setError(data.error || "Failed to update provider");
      }
    } catch (error) {
      console.error("Failed to update provider:", error);
      setError(error instanceof Error ? error.message : "Failed to update provider");
    } finally {
      setUpdating(null);
    }
  };

  const handleSetPrimary = async (providerName: string) => {
    setUpdating(providerName);
    setError(null);
    try {
      const res = await fetch("/api/admin/data-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerName, updates: { isPrimary: true, isFallback: false } }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProviders();
      } else {
        setError(data.error || "Failed to set primary provider");
      }
    } catch (error) {
      console.error("Failed to set primary provider:", error);
      setError(error instanceof Error ? error.message : "Failed to set primary provider");
    } finally {
      setUpdating(null);
    }
  };

  const handleSetFallback = async (providerName: string) => {
    setUpdating(providerName);
    setError(null);
    try {
      const res = await fetch("/api/admin/data-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerName, updates: { isFallback: true, isPrimary: false } }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProviders();
      } else {
        setError(data.error || "Failed to set fallback provider");
      }
    } catch (error) {
      console.error("Failed to set fallback provider:", error);
      setError(error instanceof Error ? error.message : "Failed to set fallback provider");
    } finally {
      setUpdating(null);
    }
  };

  const getProviderDisplayName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getProviderIcon = (name: string) => {
    if (name === "datamart") return "📦";
    if (name === "hubnet") return "🔗";
    return "⚙️";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Providers</h1>
          <p className="text-muted-foreground mt-1">
            Manage DataMart and Hubnet API providers for data bundle purchases
          </p>
        </div>
        <Button onClick={fetchProviders} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg text-destructive">Error Loading Providers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchProviders} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              If this error persists, the database migration may not have been run. Please ensure the data_providers table exists.
            </p>
          </CardContent>
        </Card>
      ) : providers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No Providers Found</CardTitle>
            <CardDescription>
              No data providers are configured. The database migration may not have been run yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please run the database migration to create the data_providers table and seed initial providers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.id} className={provider.isEnabled ? "" : "opacity-50"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getProviderIcon(provider.providerName)}</span>
                    <div>
                      <CardTitle className="text-xl">{getProviderDisplayName(provider.providerName)}</CardTitle>
                      <CardDescription className="mt-1">
                        {provider.providerType.replace("_", " ").toUpperCase()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.isPrimary && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                    {provider.isFallback && (
                      <Badge variant="secondary" className="bg-blue-600">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Fallback
                      </Badge>
                    )}
                    {!provider.isEnabled && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enabled</span>
                  <Switch
                    checked={provider.isEnabled}
                    onCheckedChange={(checked) => handleToggleEnabled(provider.providerName, checked)}
                    disabled={updating === provider.providerName}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Provider Role</p>
                  <div className="flex gap-2">
                    <Button
                      variant={provider.isPrimary ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetPrimary(provider.providerName)}
                      disabled={updating === provider.providerName || provider.isPrimary}
                      className="flex-1"
                    >
                      Set as Primary
                    </Button>
                    <Button
                      variant={provider.isFallback ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetFallback(provider.providerName)}
                      disabled={updating === provider.providerName || provider.isFallback}
                      className="flex-1"
                    >
                      Set as Fallback
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Priority: {provider.priority}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(provider.updatedAt).toLocaleString()}
                  </p>
                </div>

                {updating === provider.providerName && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Provider Switching Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Primary provider</strong>: Used first for all data bundle purchases</p>
          <p>• <strong>Fallback provider</strong>: Automatically used if primary provider fails</p>
          <p>• <strong>Disabled providers</strong>: Not used for any purchases</p>
          <p>• Only one provider can be primary at a time</p>
          <p>• Only one provider can be fallback at a time</p>
        </CardContent>
      </Card>
    </div>
  );
}
