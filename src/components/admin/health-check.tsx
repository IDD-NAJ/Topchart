"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HealthStatus {
  database: string;
  apis: {
    paystack: string;
    datamart: string;
    reloadly: string;
    supabase_storage: string;
  };
  timestamp: string;
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/admin/health");
        const data = await res.json();
        if (data.success) {
          setHealth(data.health);
        }
      } catch (error) {
        console.error("Health check failed:", error);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === "connected" || status === "configured") {
      return <CheckCircle className="h-3 w-3 text-emerald-500" />;
    }
    if (status === "missing") {
      return <AlertCircle className="h-3 w-3 text-amber-500" />;
    }
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Database</span>
          <div className="flex items-center gap-1.5 font-medium uppercase">
            {getStatusIcon(health?.database || "")}
            {health?.database}
          </div>
        </div>
        <div className="space-y-1.5 border-t pt-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Paystack</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(health?.apis.paystack || "")}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Data Provider</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(health?.apis.datamart || "")}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Reloadly</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(health?.apis.reloadly || "")}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Supabase Storage</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(health?.apis.supabase_storage || "")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
