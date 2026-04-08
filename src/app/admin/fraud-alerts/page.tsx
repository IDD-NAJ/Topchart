"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, RefreshCw } from "lucide-react";

interface FraudAlert {
  id: string;
  reseller_id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  description: string;
  status: string;
  evidence: any;
  created_at: string;
  reseller_name?: string;
  user_email?: string;
}

export default function AdminFraudAlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await fetch("/api/admin/fraud-alerts", {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setAlerts(data.alerts);
      } else {
        toast.error(data.error || "Failed to load alerts");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/fraud-alerts/${alertId}/resolve`, {
        method: "POST",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Alert resolved");
        loadAlerts();
      } else {
        toast.error(data.error || "Failed to resolve");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleBlock = async (resellerId: string) => {
    if (!confirm("Are you sure you want to block this reseller?")) return;

    try {
      const res = await fetch(`/api/admin/resellers/${resellerId}/block`, {
        method: "POST",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Reseller blocked");
        loadAlerts();
      } else {
        toast.error(data.error || "Failed to block");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== "all" && alert.status !== filter) return false;
    if (searchTerm && !alert.reseller_name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === "open").length,
    resolved: alerts.filter(a => a.status === "resolved").length,
    highSeverity: alerts.filter(a => a.severity === "high" && a.status === "open").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006994]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fraud Alert Management</h1>
          <p className="text-muted-foreground">Review and resolve fraud alerts</p>
        </div>
        <Button variant="outline" onClick={loadAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">High Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highSeverity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Alerts</CardTitle>
          <CardDescription>Review suspicious activity and take action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2" />
                <p>No fraud alerts found</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      alert.severity === "high" ? "bg-red-100" : 
                      alert.severity === "medium" ? "bg-yellow-100" : "bg-blue-100"
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === "high" ? "text-red-600" : 
                        alert.severity === "medium" ? "text-yellow-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{alert.alert_type}</span>
                        <Badge variant={
                          alert.severity === "high" ? "destructive" : 
                          alert.severity === "medium" ? "secondary" : "outline"
                        }>
                          {alert.severity}
                        </Badge>
                        <Badge variant={alert.status === "open" ? "default" : "outline"}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Reseller: {alert.reseller_name || alert.reseller_id}</span>
                        <span>User: {alert.user_email || alert.user_id}</span>
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                      {alert.evidence && (
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(alert.evidence, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === "open" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleResolve(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleBlock(alert.reseller_id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Block
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
