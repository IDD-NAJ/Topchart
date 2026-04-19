"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Wallet,
  Globe,
  CheckCircle2,
  AlertCircle,
  Activity,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReloadlyBalance {
  balance: number;
  currencyCode: string;
  currencyName: string;
  updatedAt: string;
}

interface ReloadlyOperator {
  id: number;
  name: string;
  countryCode: string;
  countryName: string;
  bundle: boolean;
  data: boolean;
  pin: boolean;
  status: string;
  commission: number;
  fxRate: number;
  mappedNetwork?: string;
  isMapped?: boolean;
}

interface ReloadlyBalanceResponse {
  success: boolean;
  data?: ReloadlyBalance;
  error?: string;
  state?: "connected" | "disconnected" | "unknown" | "not_configured";
}

export default function ReloadlySettingsPage() {
  const [balance, setBalance] = useState<ReloadlyBalance | null>(null);
  const [operators, setOperators] = useState<ReloadlyOperator[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "unknown" | "not_configured">("unknown");

  const fetchBalance = useCallback(async (refresh = false) => {
    try {
      setLoadingBalance(true);
      const response = await fetch(`/api/admin/reloadly-balance${refresh ? "?refresh=true" : ""}`);
      const result = await response.json() as ReloadlyBalanceResponse;

      if (result.success) {
        setBalance(result.data ?? null);
        setConnectionStatus("connected");
        if (refresh) {
          toast.success("Balance refreshed successfully");
        }
      } else {
        const errorMessage = result.error || "Failed to fetch balance";
        if (result.state === "not_configured") {
          setBalance(null);
          setConnectionStatus("not_configured");
        } else {
          setBalance(null);
          setConnectionStatus("disconnected");
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      setBalance(null);
      setConnectionStatus("disconnected");
      toast.error("Failed to fetch Reloadly balance");
      console.error(error);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const fetchOperators = useCallback(async () => {
    try {
      setLoadingOperators(true);
      const response = await fetch("/api/admin/reloadly-operators?country=GH");
      const result = await response.json();

      if (result.success) {
        setOperators(result.data);
        toast.success(`Loaded ${result.data.length} operators`);
      } else {
        toast.error(result.error || "Failed to fetch operators");
      }
    } catch (error) {
      toast.error("Failed to fetch Reloadly operators");
      console.error(error);
    } finally {
      setLoadingOperators(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchOperators();
  }, [fetchBalance, fetchOperators]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
      case "active":
      case "connected":
        return "bg-green-500";
      case "pending":
      case "warning":
      case "not_configured":
        return "bg-yellow-500";
      case "failed":
      case "disconnected":
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reloadly Settings</h1>
          <p className="text-muted-foreground">
            Manage Reloadly airtime provider integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchBalance(true)}
            disabled={loadingBalance || connectionStatus === "not_configured"}
            className="gap-2"
          >
            {loadingBalance ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#F38F20]" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(connectionStatus))} />
              <span className="font-medium">
                {connectionStatus === "connected" && "Connected to Reloadly API"}
                {connectionStatus === "disconnected" && "Disconnected from Reloadly API"}
                {connectionStatus === "not_configured" && "Reloadly credentials not added yet"}
                {connectionStatus === "unknown" && "Checking connection..."}
              </span>
            </div>
            {connectionStatus === "not_configured" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
                <div className="font-medium">Add Reloadly credentials to `.env.local` to enable live balance checks.</div>
                <div className="mt-2 space-y-1 font-mono text-xs text-amber-900/90">
                  <div>RELOADLY_CLIENT_ID=your-reloadly-client-id</div>
                  <div>RELOADLY_CLIENT_SECRET=your-reloadly-client-secret</div>
                  <div>RELOADLY_BASE_URL=https://topups.reloadly.com</div>
                  <div>RELOADLY_AUTH_URL=https://auth.reloadly.com/oauth/token</div>
                  <div>RELOADLY_SANDBOX=false</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#F38F20]" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balance ? (
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{balance.currencyCode}</span>
                <span className="text-4xl font-bold text-[#F38F20]">
                  {balance.balance.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(balance.updatedAt).toLocaleString()}
              </div>
            </div>
          ) : connectionStatus === "not_configured" ? (
            <div className="text-muted-foreground">
              Add your Reloadly credentials in `.env.local` to fetch the live account balance.
            </div>
          ) : (
            <div className="text-muted-foreground">
              {loadingBalance ? "Loading balance..." : "No balance data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operators Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#F38F20]" />
              Ghana Operators ({operators.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOperators}
              disabled={loadingOperators}
              className="gap-2"
            >
              {loadingOperators ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
          <CardDescription>
            Available operators for Ghana airtime purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operators.length > 0 ? (
            <div className="grid gap-4">
              {operators.map((op) => (
                <div
                  key={op.id}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg",
                    op.isMapped ? "border-green-200 bg-green-50/50" : "border-gray-200"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{op.name}</span>
                      {op.isMapped && (
                        <Badge variant="outline" className="text-green-600 bg-green-50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Mapped
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {op.id} • {op.countryCode} • {op.status}
                    </div>
                    {op.mappedNetwork && (
                      <div className="text-sm text-green-600">
                        Mapped to: {op.mappedNetwork}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-[#F38F20]" />
                        <span>Commission: {(op.commission * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4 text-[#F38F20]" />
                        <span>FX Rate: {op.fxRate}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 justify-end">
                      {op.bundle && <Badge variant="secondary">Bundle</Badge>}
                      {op.data && <Badge variant="secondary">Data</Badge>}
                      {op.pin && <Badge variant="secondary">Pin</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loadingOperators ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span>Loading operators...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <span>No operators found</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base URL:</span>
              <span className="font-mono">https://topups.reloadly.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auth URL:</span>
              <span className="font-mono">https://auth.reloadly.com/oauth/token</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary for:</span>
              <span>Airtime purchases</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fallback:</span>
              <span>DataMart</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
