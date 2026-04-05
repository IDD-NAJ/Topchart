"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Activity } from "lucide-react";

interface FraudAlert {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

export default function ResellerSecurityPage() {
  const [securityScore, setSecurityScore] = useState(100);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    openAlerts: 0,
    totalViolations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const res = await fetch("/api/reseller/security", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setSecurityScore(data.securityScore);
        setFraudAlerts(data.fraudAlerts);
        setAuditLogs(data.auditLogs);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Security & Fraud Prevention</h1>
        <p className="text-muted-foreground">Monitor your account security and fraud alerts</p>
      </div>

      {/* Security Score Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${securityScore >= 80 ? 'bg-green-100' : securityScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <Shield className={`h-8 w-8 ${securityScore >= 80 ? 'text-green-600' : securityScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Security Score</h2>
                <p className="text-sm text-muted-foreground">Based on your account activity</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{securityScore}%</div>
              <Badge variant={securityScore >= 80 ? 'default' : securityScore >= 50 ? 'secondary' : 'destructive'}>
                {securityScore >= 80 ? 'Secure' : securityScore >= 50 ? 'Moderate' : 'At Risk'}
              </Badge>
            </div>
          </div>
          <Progress value={securityScore} className="mt-4" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openAlerts}</div>
            <p className="text-xs text-muted-foreground">{stats.totalAlerts} total alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rate Violations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViolations}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Recent activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Alerts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fraud Alerts</CardTitle>
          <CardDescription>Recent security alerts for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {fraudAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No fraud alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{alert.alert_type}</span>
                        <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <Badge variant={alert.status === 'open' ? 'destructive' : 'default'}>{alert.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Recent actions on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{log.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
