"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface HealthStatus {
  name: string;
  status: "healthy" | "unhealthy" | "unknown";
  latency?: number;
  message: string;
  lastChecked: string;
}

export default function HealthDashboard() {
  const [services, setServices] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    const results: HealthStatus[] = [];
    const timestamp = new Date().toISOString();

    // Check Database
    try {
      const start = Date.now();
      const res = await fetch("/api/health/db");
      const latency = Date.now() - start;
      const data = await res.json();
      
      results.push({
        name: "Database (Neon PostgreSQL)",
        status: res.ok ? "healthy" : "unhealthy",
        latency,
        message: data.message || data.error || "Unknown status",
        lastChecked: timestamp,
      });
    } catch (error) {
      results.push({
        name: "Database (Neon PostgreSQL)",
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Connection failed",
        lastChecked: timestamp,
      });
    }

    // Check Reloadly (via admin API)
    try {
      const start = Date.now();
      const res = await fetch("/api/admin/reloadly-balance");
      const latency = Date.now() - start;
      
      if (res.ok) {
        const data = await res.json();
        results.push({
          name: "Reloadly (Airtime API)",
          status: data.balance !== undefined ? "healthy" : "unhealthy",
          latency,
          message: data.balance !== undefined 
            ? `Balance: ${data.currency} ${data.balance}` 
            : "Unable to fetch balance",
          lastChecked: timestamp,
        });
      } else {
        results.push({
          name: "Reloadly (Airtime API)",
          status: "unhealthy",
          latency,
          message: "API returned error status",
          lastChecked: timestamp,
        });
      }
    } catch (error) {
      results.push({
        name: "Reloadly (Airtime API)",
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Connection failed",
        lastChecked: timestamp,
      });
    }

    // Check DataMart
    try {
      const start = Date.now();
      // We can check via the plans API as a proxy
      const res = await fetch("/api/purchases/plans?network=mtn");
      const latency = Date.now() - start;
      
      results.push({
        name: "DataMart API",
        status: res.ok ? "healthy" : "unhealthy",
        latency,
        message: res.ok ? "API responding" : "API error",
        lastChecked: timestamp,
      });
    } catch (error) {
      results.push({
        name: "DataMart API",
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Connection failed",
        lastChecked: timestamp,
      });
    }

    setServices(results);
    setLoading(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case "unhealthy":
        return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor the status of all external services
          </p>
        </div>
        <Button 
          onClick={checkHealth} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 && loading ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Checking service health...</p>
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">
                  {service.name}
                </CardTitle>
                {getStatusIcon(service.status)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(service.status)}
                  {service.latency && (
                    <span className="text-sm text-muted-foreground">
                      {service.latency}ms
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {service.message}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
          <CardDescription>
            Run the diagnostic script for detailed connection testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="bg-muted p-4 rounded-lg block text-sm font-mono">
            npx tsx src/scripts/diagnose-connections.ts
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
