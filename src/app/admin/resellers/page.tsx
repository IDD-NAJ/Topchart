"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  DollarSign,
  Search,
  RefreshCw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface Application {
  id: string;
  user_id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  application_status: string;
  payment_status: string;
  application_fee?: number;
  created_at: string;
  user_email: string;
  first_name: string;
  last_name: string;
}

interface Reseller {
  id: string;
  user_id: string;
  business_name: string;
  business_phone: string;
  reseller_code: string;
  commission_rate: number;
  discount_rate: number;
  wallet_balance: number;
  total_sales: number;
  total_commission_earned: number;
  total_referrals: number;
  status: string;
  user_email: string;
  first_name: string;
  last_name: string;
  tier_name: string;
}

export default function AdminResellersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalResellers: 0,
    activeResellers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadResellers();
  }, []);

  const loadResellers = async () => {
    try {
      const res = await fetch("/api/admin/resellers", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setApplications(data.applications);
        setResellers(data.resellers);
        setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load resellers");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          action: "approve"
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Application approved");
        loadResellers();
      } else {
        toast.error(data.error || "Failed to approve");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectApplication = async () => {
    if (!selectedApplicationId || !rejectReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: selectedApplicationId,
          action: "reject",
          rejection_reason: rejectReason.trim()
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Application rejected");
        setRejectDialogOpen(false);
        setSelectedApplicationId(null);
        setRejectReason("");
        loadResellers();
      } else {
        toast.error(data.error || "Failed to reject");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async (applicationId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          action: "confirm_payment"
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Payment confirmed");
        loadResellers();
      } else {
        toast.error(data.error || "Failed to confirm payment");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredResellers = resellers.filter(r => 
    r.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold">Reseller Management</h1>
        <Button variant="outline" onClick={loadResellers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resellers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Resellers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeResellers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications */}
      {applications.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>Review and approve reseller applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{app.business_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {app.first_name} {app.last_name} ({app.user_email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {app.business_phone} • {app.business_address}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={app.payment_status === 'paid' ? 'default' : 'secondary'}>
                        Payment: {app.payment_status}
                      </Badge>
                      <Badge variant="outline">Fee: GHS {app.application_fee || 100}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.payment_status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirmPayment(app.id)}
                        disabled={actionLoading}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Confirm Payment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => handleApproveApplication(app.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => openRejectDialog(app.id)}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this application. This will be recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedApplicationId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectApplication}
              disabled={!rejectReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resellers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Resellers</CardTitle>
              <CardDescription>Manage existing reseller accounts</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Reseller</th>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Tier</th>
                  <th className="text-left p-3">Sales</th>
                  <th className="text-left p-3">Commission</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredResellers.map((reseller) => (
                  <tr key={reseller.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{reseller.business_name}</p>
                        <p className="text-sm text-muted-foreground">{reseller.user_email}</p>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-sm">{reseller.reseller_code}</td>
                    <td className="p-3">
                      <Badge variant="outline">{reseller.tier_name || "BRONZE"}</Badge>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">GHS {reseller.total_sales.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{reseller.total_referrals} referrals</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">GHS {reseller.total_commission_earned.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{reseller.commission_rate}% rate</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={reseller.status === 'active' ? 'default' : 'secondary'}>
                        {reseller.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
