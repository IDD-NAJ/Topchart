"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Activity, Loader2 } from "lucide-react";

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

  const resolveAlert = async (alertId: string) => {
    try {
      const res = await fetch("/api/reseller/security", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Alert resolved");
        // Update local state
        setFraudAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, status: 'resolved' } : alert
        ));
        // Recalculate security score
        const openAlerts = fraudAlerts.filter(a => a.id !== alertId && a.status === 'open').length;
        setSecurityScore(Math.max(0, 100 - (openAlerts * 10)));
      } else {
        toast.error(data.error || "Failed to resolve alert");
      }
    } catch (error) {
      toast.error("Failed to resolve alert");
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
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Security & Fraud Prevention</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">Monitor your account security and fraud alerts</p>
      </div>

      {/* Security Score Card */}
      <Card className="border-slate-200 mb-6 sm:mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${securityScore >= 80 ? 'bg-green-100' : securityScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <Shield className={`h-8 w-8 ${securityScore >= 80 ? 'text-green-600' : securityScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Security Score</h2>
                <p className="text-sm text-slate-600">Based on your account activity</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-900">{securityScore}%</div>
              <Badge variant={securityScore >= 80 ? 'default' : securityScore >= 50 ? 'secondary' : 'destructive'} className={securityScore >= 80 ? 'bg-slate-900 text-white' : securityScore >= 50 ? 'bg-slate-100 text-slate-700' : ''}>
                {securityScore >= 80 ? 'Secure' : securityScore >= 50 ? 'Moderate' : 'At Risk'}
              </Badge>
            </div>
          </div>
          <Progress value={securityScore} className="mt-4" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Fraud Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.openAlerts}</div>
            <p className="text-xs text-slate-500">{stats.totalAlerts} total alerts</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Rate Violations</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalViolations}</div>
            <p className="text-xs text-slate-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Activity Log</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{auditLogs.length}</div>
            <p className="text-xs text-slate-500">Recent activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Alerts */}
      <Card className="border-slate-200 mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-slate-900">Fraud Alerts</CardTitle>
          <CardDescription className="text-slate-500">Recent security alerts for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {fraudAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p>No fraud alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{alert.alert_type}</span>
                        <Badge variant={getSeverityColor(alert.severity)} className={alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>{alert.severity}</Badge>
                        <Badge variant={alert.status === 'open' ? 'destructive' : 'default'} className={alert.status === 'open' ? '' : 'bg-slate-100 text-slate-700'}>{alert.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {alert.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 hover:bg-slate-100"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Activity</CardTitle>
          <CardDescription className="text-slate-500">Recent actions on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-900">{log.action}</span>
                </div>
                <span className="text-xs text-slate-500">
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
