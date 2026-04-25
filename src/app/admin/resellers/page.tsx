"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  DollarSign,
  Search,
  RefreshCw,
  FileText,
  Wallet,
  CreditCard,
  RotateCcw,
  Eye
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
import { Label } from "@/components/ui/label";

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

interface ApplicationDetail extends Application {
  custom_fields?: Record<string, string>;
  business_email?: string;
  business_type?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

interface Commission {
  id: string;
  reseller_id: string;
  sale_id: string;
  amount: number;
  status: string;
  created_at: string;
  reseller_name?: string;
  reseller_code?: string;
  sale_amount?: number;
  product_name?: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  currency: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  application_id?: string;
  business_name?: string;
  application_status?: string;
  app_payment_status?: string;
}

const ALLOWED_TABS = ["resellers", "applications", "commissions", "transactions"] as const;
type AdminResellerTab = (typeof ALLOWED_TABS)[number];

function AdminResellersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") || "resellers";
  const currentTab: AdminResellerTab = (ALLOWED_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as AdminResellerTab)
    : "resellers";

  const [applications, setApplications] = useState<Application[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionStats, setCommissionStats] = useState({
    totalCommissions: 0,
    pendingPayouts: 0,
    totalPaid: 0
  });
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalResellers: 0,
    activeResellers: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState({
    total_count: 0,
    success_count: 0,
    pending_count: 0,
    failed_count: 0,
    refunded_count: 0,
    refunded_amount: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Commission rate dialog
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState("");
  const [newDiscountRate, setNewDiscountRate] = useState("");
  
  // Application details dialog
  const [appDetailsOpen, setAppDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
  const [commissionDetailsOpen, setCommissionDetailsOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  // Transaction dialogs
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [confirmReason, setConfirmReason] = useState("");
  const [transactionActionId, setTransactionActionId] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    const nextTab: AdminResellerTab = (ALLOWED_TABS as readonly string[]).includes(value)
      ? (value as AdminResellerTab)
      : "resellers";
    const params = new URLSearchParams(searchParams);
    if (nextTab === "resellers") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    if (!(ALLOWED_TABS as readonly string[]).includes(rawTab)) {
      const params = new URLSearchParams(searchParams);
      params.delete("tab");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, [rawTab, pathname, router, searchParams]);

  useEffect(() => {
    loadResellers();
    if (currentTab === "commissions") {
      loadCommissions();
    }
    if (currentTab === "transactions") {
      loadTransactions();
    }
  }, [currentTab]);

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

  const loadCommissions = async () => {
    try {
      const res = await fetch("/api/admin/resellers/commissions", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setCommissions(data.commissions || []);
        setCommissionStats(data.stats || {
          totalCommissions: 0,
          pendingPayouts: 0,
          totalPaid: 0
        });
      } else {
        toast.error(data.error || "Failed to load commissions");
      }
    } catch (error) {
      toast.error("Network error loading commissions");
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await fetch("/api/admin/resellers/transactions", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        setTransactionStats(data.stats || {
          total_count: 0,
          success_count: 0,
          pending_count: 0,
          failed_count: 0,
          refunded_count: 0,
          refunded_amount: 0,
          total_revenue: 0
        });
      } else {
        toast.error(data.error || "Failed to load transactions");
      }
    } catch (error) {
      toast.error("Network error loading transactions");
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

  const openCommissionDialog = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setNewCommissionRate(reseller.commission_rate.toString());
    setNewDiscountRate(reseller.discount_rate.toString());
    setCommissionDialogOpen(true);
  };

  const openRefundDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundReason("");
    setRefundDialogOpen(true);
  };

  const openConfirmDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setConfirmReason("");
    setConfirmDialogOpen(true);
  };

  const handleRefundTransaction = async () => {
    if (!selectedTransaction) return;
    setActionLoading(true);
    setTransactionActionId(selectedTransaction.id);
    try {
      const res = await fetch("/api/admin/resellers/transactions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: selectedTransaction.id,
          action: "refund",
          reason: refundReason
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Transaction refunded successfully");
        setRefundDialogOpen(false);
        setSelectedTransaction(null);
        setRefundReason("");
        loadTransactions();
        loadResellers();
      } else {
        toast.error(data.error || "Failed to refund transaction");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
      setTransactionActionId(null);
    }
  };

  const openCommissionDetails = (commission: Commission) => {
    setSelectedCommission(commission);
    setCommissionDetailsOpen(true);
  };

  const handleMarkCommissionPaid = async (commissionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/resellers/commissions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commission_id: commissionId,
          status: "paid"
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Commission marked as paid");
        loadCommissions();
      } else {
        toast.error(data.error || "Failed to update commission");
      }
    } catch (error) {
      toast.error("Network error updating commission");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!selectedTransaction) return;
    setActionLoading(true);
    setTransactionActionId(selectedTransaction.id);
    try {
      const res = await fetch("/api/admin/resellers/transactions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: selectedTransaction.id,
          action: "confirm_payment",
          reason: confirmReason
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Payment confirmed and reseller approved");
        setConfirmDialogOpen(false);
        setSelectedTransaction(null);
        setConfirmReason("");
        loadTransactions();
        loadResellers();
      } else {
        toast.error(data.error || "Failed to confirm payment");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
      setTransactionActionId(null);
    }
  };

  const handleSaveCommission = async () => {
    if (!selectedReseller) return;
    
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reseller_id: selectedReseller.id,
          commission_rate: parseFloat(newCommissionRate),
          discount_rate: parseFloat(newDiscountRate)
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Commission rates updated");
        setCommissionDialogOpen(false);
        setSelectedReseller(null);
        loadResellers();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockReseller = async (resellerId: string) => {
    if (!confirm("Are you sure you want to suspend this reseller? They will no longer be able to make sales.")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/resellers?id=${resellerId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Reseller suspended");
        loadResellers();
      } else {
        toast.error(data.error || "Failed to suspend");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateReseller = async (resellerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reseller_id: resellerId,
          status: "active"
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Reseller activated");
        loadResellers();
      } else {
        toast.error(data.error || "Failed to activate");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const viewApplicationDetails = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/reseller/apply?id=${applicationId}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.application) {
        setSelectedApplication(data.application);
        setAppDetailsOpen(true);
      } else {
        toast.error("Failed to load application details");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const getPendingTransactionForApplication = async (applicationId: string) => {
    const existing = transactions.find((t) => t.application_id === applicationId && t.status === "pending");
    if (existing) {
      return existing;
    }
    const res = await fetch("/api/admin/resellers/transactions", {
      credentials: "include"
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to load transactions");
    }
    const freshTransactions: Transaction[] = data.transactions || [];
    setTransactions(freshTransactions);
    setTransactionStats(data.stats || {
      total_count: 0,
      success_count: 0,
      pending_count: 0,
      failed_count: 0,
      refunded_count: 0,
      refunded_amount: 0,
      total_revenue: 0
    });
    return freshTransactions.find((t) => t.application_id === applicationId && t.status === "pending");
  };

  const filteredResellers = resellers.filter(r => 
    r.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--marketing-accent)]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold">Reseller Management</h1>
        <Button variant="outline" className="w-full sm:w-auto" onClick={loadResellers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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

      {/* Commission Rate Dialog */}
      <AlertDialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Commission Rates</AlertDialogTitle>
            <AlertDialogDescription>
              Update commission and discount rates for {selectedReseller?.business_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                placeholder="5.0"
              />
            </div>
            <div>
              <Label>Discount Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={newDiscountRate}
                onChange={(e) => setNewDiscountRate(e.target.value)}
                placeholder="2.0"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedReseller(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveCommission}
              disabled={actionLoading}
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Application Details Dialog */}
      <AlertDialog open={appDetailsOpen} onOpenChange={setAppDetailsOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Application Details</AlertDialogTitle>
            <AlertDialogDescription>
              Full details for {selectedApplication?.business_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Applicant:</span>
                <p className="font-medium">{selectedApplication?.first_name} {selectedApplication?.last_name}</p>
                <p className="text-muted-foreground">{selectedApplication?.user_email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <p className="font-medium">{selectedApplication?.created_at ? new Date(selectedApplication.created_at).toLocaleString() : '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Business Phone:</span>
                <p className="font-medium">{selectedApplication?.business_phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Business Email:</span>
                <p className="font-medium">{selectedApplication?.business_email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Business Type:</span>
                <p className="font-medium">{selectedApplication?.business_type || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium">
                  <Badge variant={selectedApplication?.application_status === 'pending' ? 'secondary' : selectedApplication?.application_status === 'approved' ? 'default' : 'destructive'}>
                    {selectedApplication?.application_status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment:</span>
                <p className="font-medium">
                  <Badge variant={selectedApplication?.payment_status === "paid" ? "default" : "secondary"}>
                    {selectedApplication?.payment_status || "pending"}
                  </Badge>
                </p>
              </div>
            </div>
            
            {selectedApplication?.business_address && (
              <div className="text-sm">
                <span className="text-muted-foreground">Business Address:</span>
                <p className="font-medium">{selectedApplication.business_address}</p>
              </div>
            )}
            
            {selectedApplication?.custom_fields && Object.keys(selectedApplication.custom_fields).length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Custom Fields</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedApplication.custom_fields).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <p className="font-medium">{value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedApplication?.rejection_reason && (
              <div className="border rounded-lg p-4 bg-red-50">
                <h4 className="font-medium mb-2 text-red-700">Rejection Reason</h4>
                <p className="text-sm text-red-600">{selectedApplication.rejection_reason}</p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedApplication(null)}>Close</AlertDialogCancel>
            {selectedApplication?.application_status === 'pending' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setAppDetailsOpen(false);
                    openRejectDialog(selectedApplication.id);
                  }}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    setAppDetailsOpen(false);
                    handleApproveApplication(selectedApplication.id);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={selectedApplication?.payment_status !== "paid" || actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {selectedApplication?.payment_status === "paid" ? "Approve" : "Approve (Payment Required)"}
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commission Details Dialog */}
      <AlertDialog open={commissionDetailsOpen} onOpenChange={setCommissionDetailsOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Commission Details</AlertDialogTitle>
            <AlertDialogDescription>
              Commission record for {selectedCommission?.reseller_name || "reseller"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reseller</span>
              <span className="font-medium">{selectedCommission?.reseller_name || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-medium">{selectedCommission?.reseller_code || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{selectedCommission?.product_name || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sale Amount</span>
              <span className="font-medium">GHS {Number(selectedCommission?.sale_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span className="font-medium">GHS {Number(selectedCommission?.amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={selectedCommission?.status === "paid" ? "default" : "secondary"}>
                {selectedCommission?.status || "unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {selectedCommission?.created_at ? new Date(selectedCommission.created_at).toLocaleString() : "N/A"}
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCommission(null)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto">
        <TabsList className="grid w-max min-w-full sm:max-w-md grid-cols-4">
          <TabsTrigger value="resellers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Resellers</span>
            <span className="sm:hidden">List</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Applications</span>
            <span className="sm:hidden">Apps</span>
            {stats.pendingApplications > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.pendingApplications}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Commissions</span>
            <span className="sm:hidden">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
            <span className="sm:hidden">Pay</span>
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Resellers Tab */}
        <TabsContent value="resellers" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Resellers List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Active Resellers</CardTitle>
                  <CardDescription>Manage existing reseller accounts</CardDescription>
                </div>
                <div className="relative w-full lg:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resellers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full lg:w-64"
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
                      <th className="text-left p-3">Actions</th>
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
                            <p className="font-medium">GHS {Number(reseller.total_sales || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{reseller.total_referrals} referrals</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">GHS {Number(reseller.total_commission_earned || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{reseller.commission_rate}% rate</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={reseller.status === 'active' ? 'default' : 'secondary'}>
                            {reseller.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCommissionDialog(reseller)}
                              disabled={actionLoading}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Edit Rates
                            </Button>
                            {reseller.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleBlockReseller(reseller.id)}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => handleActivateReseller(reseller.id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>Review and manage reseller applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>No applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{app.business_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {app.first_name} {app.last_name} ({app.user_email})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {app.business_phone} • {app.business_address}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={app.payment_status === 'paid' ? 'default' : 'secondary'}>
                            Payment: {app.payment_status}
                          </Badge>
                          <Badge variant={app.application_status === 'approved' ? 'default' : app.application_status === 'rejected' ? 'destructive' : 'secondary'}>
                            Status: {app.application_status}
                          </Badge>
                          <Badge variant="outline">Fee: GHS {app.application_fee || 100}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewApplicationDetails(app.id)}
                          disabled={actionLoading}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {app.application_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleApproveApplication(app.id)}
                            disabled={actionLoading || app.payment_status !== 'paid'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {app.application_status === 'pending' && app.payment_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () => {
                              try {
                                const transaction = await getPendingTransactionForApplication(app.id);
                                if (transaction) {
                                  openConfirmDialog(transaction);
                                } else {
                                  toast.error("No pending payment found for this application");
                                }
                              } catch (error: any) {
                                toast.error(error?.message || "Failed to load payment transaction");
                              }
                            }}
                            disabled={actionLoading}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Confirm Payment
                          </Button>
                        )}
                        {app.application_status === 'pending' && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          {/* Commission Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GHS {Number(commissionStats.totalCommissions || 0).toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GHS {Number(commissionStats.pendingPayouts || 0).toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GHS {Number(commissionStats.totalPaid || 0).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Commissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Track reseller commission payments</CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2" />
                  <p>No commissions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Reseller</th>
                        <th className="text-left p-3">Sale Amount</th>
                        <th className="text-left p-3">Commission</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{commission.reseller_name}</p>
                              <p className="text-sm text-muted-foreground">{commission.reseller_code}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            GHS {Number(commission.sale_amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3 font-medium">
                            GHS {Number(commission.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                              {commission.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(commission.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCommissionDetails(commission)}
                                disabled={actionLoading}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {commission.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => handleMarkCommissionPaid(commission.id)}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Transaction Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionStats.total_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionStats.success_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <RefreshCw className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionStats.pending_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionStats.failed_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                <RotateCcw className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionStats.refunded_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GHS {Number(transactionStats.total_revenue).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>Manage reseller application payments and refunds</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Reference</th>
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Business</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{tx.reference}</code>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{tx.user_first_name} {tx.user_last_name}</p>
                              <p className="text-xs text-muted-foreground">{tx.user_email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{tx.business_name || 'N/A'}</span>
                          </td>
                          <td className="p-3 font-medium">
                            GHS {Number(tx.amount).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                tx.status === 'success' ? 'default' :
                                tx.status === 'pending' ? 'secondary' :
                                tx.status === 'refunded' ? 'destructive' :
                                'outline'
                              }
                            >
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-sm">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              {tx.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => openConfirmDialog(tx)}
                                  disabled={actionLoading && transactionActionId === tx.id}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </Button>
                              )}
                              {(tx.status === 'success' || tx.status === "completed") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => openRefundDialog(tx)}
                                  disabled={actionLoading && transactionActionId === tx.id}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Refund
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark transaction {selectedTransaction?.reference} as refunded.
              Amount: GHS {Number(selectedTransaction?.amount).toFixed(2)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="refundReason">Refund Reason (Optional)</Label>
            <Textarea
              id="refundReason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransaction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefundTransaction}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Payment Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark transaction {selectedTransaction?.reference} as successful and auto-approve the reseller application.
              Amount: GHS {Number(selectedTransaction?.amount).toFixed(2)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirmReason">Confirmation Note (Optional)</Label>
            <Textarea
              id="confirmReason"
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              placeholder="Enter confirmation note..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransaction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransaction}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrap with Suspense for search params
export default function AdminResellersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--marketing-accent)]" />
      </div>
    }>
      <AdminResellersContent />
    </Suspense>
  );
}
