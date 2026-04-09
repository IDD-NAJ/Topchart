"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; // Fix Progress import
import { toast } from "sonner";
import {
  Store,
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Shield,
  Trophy,
  Megaphone,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Copy,
  Building2,
  Phone,
  Mail,
  MapPin,
  Percent,
  Wallet,
  ArrowRight,
  Package,
  Link as LinkIcon,
  Activity,
  ChevronRight
} from "lucide-react";

interface ResellerProfile {
  id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email?: string;
  reseller_code: string;
  commission_rate: number;
  discount_rate: number;
  wallet_balance: number;
  total_sales: number;
  total_commission_earned: number;
  total_referrals: number;
  status: string;
  tier_name?: string;
  tier_benefits?: string[];
  next_tier_name?: string;
  next_tier_threshold?: number;
  created_at?: string;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'commission' | 'purchase' | 'referral';
  description: string;
  amount: number;
  date: string;
}

interface ResellerStats {
  sales: {
    total_sales: number;
    total_amount: number;
    total_profit: number;
  };
  commissions: {
    total_commissions: number;
    total_earned: number;
  };
  inventory: {
    count: number;
  };
}

interface ResellerState {
  role: string | null;
  profile_exists: boolean;
  application_status: string | null;
  payment_status: string | null;
}

function asMoney(value: unknown): string {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

export default function ResellerDashboardPage() {
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [resellerState, setResellerState] = useState<ResellerState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await fetch("/api/reseller/dashboard", {
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setStats(data.stats);
        setActivities(data.activities || []);
        setResellerState(data.state || null);
        setLoadError(null);
      } else {
        if (res.status === 403 && data.state) {
          setResellerState(data.state);
          setProfile(null);
          setLoadError(null);
        } else {
          const errorMessage = data.error || "Failed to load dashboard";
          setLoadError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      setLoadError("Network error");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006994]" />
      </div>
    );
  }

  if (!profile) {
    if (loadError) {
      return (
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to load reseller dashboard</h2>
              <p className="text-muted-foreground mb-4 text-center max-w-md">{loadError}</p>
              <Button onClick={loadDashboardData}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const hasPendingApplication = resellerState?.application_status === "pending";
    const isApprovedState =
      resellerState?.application_status === "approved" ||
      resellerState?.role === "RESELLER";
    const isAwaitingApproval =
      resellerState?.payment_status === "paid" &&
      resellerState?.application_status !== "approved" &&
      !isApprovedState;
    const needsProfileSync = isApprovedState && !resellerState?.profile_exists;

    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {needsProfileSync
                ? "Reseller Approved"
                : isAwaitingApproval
                  ? "Application under review"
                  : hasPendingApplication
                    ? "Application submitted"
                    : "Not a Reseller Yet"}
            </h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              {needsProfileSync
                ? "Your payment and approval are confirmed. We are finalizing your reseller dashboard access now."
                : isAwaitingApproval
                  ? "Your payment is confirmed and your application is awaiting final admin approval."
                  : hasPendingApplication
                    ? "Your application is in progress. Complete any pending payment or wait for review."
                    : "Apply to become a reseller to access wholesale pricing and earn commissions on referrals."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {hasPendingApplication || isAwaitingApproval ? (
                <Button onClick={() => window.location.href = "/dashboard/reseller/status"}>
                  View Application Status
                </Button>
              ) : needsProfileSync ? (
                <Button onClick={loadDashboardData}>
                  Activate Dashboard
                </Button>
              ) : (
                <Button onClick={() => window.location.href = "/dashboard/reseller/apply"}>
                  Apply Now
                </Button>
              )}
              <Button variant="outline" onClick={loadDashboardData}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Reseller Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.business_name}</p>
        </div>
        <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
          {profile.status.toUpperCase()}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {asMoney(profile.wallet_balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {asMoney(profile.total_sales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.sales.total_sales || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {asMoney(profile.total_commission_earned)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.commission_rate}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile.total_referrals}
            </div>
            <p className="text-xs text-muted-foreground">
              Total referred users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile & Tier Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Business Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                <div className="p-3 bg-[#006994]/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-[#006994]" />
                </div>
                <div>
                  <CardTitle>Business Profile</CardTitle>
                  <p className="text-sm text-muted-foreground">Your reseller business details</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => window.location.href = "/dashboard/reseller/profile"}>
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{profile.business_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{profile.business_address || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.business_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reseller Code</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono break-all">{profile.reseller_code}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(profile.reseller_code);
                          toast.success("Code copied!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Percent className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                    <p className="font-medium">{profile.commission_rate}% per sale</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Discount Rate</p>
                    <p className="font-medium">{profile.discount_rate}% off wholesale</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Tier Status</CardTitle>
                <p className="text-sm text-muted-foreground">{profile.tier_name || 'Bronze'} Reseller</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to {profile.next_tier_name || 'Silver'}</span>
                  <span className="font-medium">
                    {profile.next_tier_threshold
                      ? Math.min(100, Math.round((profile.total_sales / profile.next_tier_threshold) * 100))
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{
                      width: `${profile.next_tier_threshold
                        ? Math.min(100, Math.round((profile.total_sales / profile.next_tier_threshold) * 100))
                        : 0}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {profile.next_tier_threshold
                    ? `Need GHS ${(profile.next_tier_threshold - profile.total_sales).toFixed(0)} more in sales`
                    : 'Maximum tier reached!'}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/dashboard/reseller/tiers"}
              >
                View All Tiers
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <p className="text-sm text-muted-foreground">Your latest transactions</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => window.location.href = "/dashboard/history"}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'sale' ? 'bg-green-100' :
                      activity.type === 'commission' ? 'bg-blue-100' :
                      activity.type === 'purchase' ? 'bg-purple-100' :
                      'bg-yellow-100'
                    }`}>
                      {activity.type === 'sale' ? <DollarSign className="h-4 w-4 text-green-600" /> :
                       activity.type === 'commission' ? <TrendingUp className="h-4 w-4 text-blue-600" /> :
                       activity.type === 'purchase' ? <ShoppingCart className="h-4 w-4 text-purple-600" /> :
                       <Users className="h-4 w-4 text-yellow-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium text-sm sm:text-base ${
                    activity.type === 'purchase' ? 'text-red-600' :
                    activity.type === 'sale' || activity.type === 'commission' ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {activity.type === 'purchase' ? '-' : '+'}GHS {activity.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/purchase"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#006994]/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-[#006994]" />
              </div>
              <div>
                <h3 className="font-semibold">Buy Wholesale</h3>
                <p className="text-sm text-muted-foreground">Purchase at {profile.discount_rate}% discount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/inventory"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#006994]/10 rounded-lg">
                <Store className="h-6 w-6 text-[#006994]" />
              </div>
              <div>
                <h3 className="font-semibold">My Inventory</h3>
                <p className="text-sm text-muted-foreground">
                  {stats?.inventory.count || 0} cards in stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/marketing"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#006994]/10 rounded-lg">
                <Users className="h-6 w-6 text-[#006994]" />
              </div>
              <div>
                <h3 className="font-semibold">Marketing Tools</h3>
                <p className="text-sm text-muted-foreground">Referral links & assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Feature Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Security Overview */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/security"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Security Overview</h3>
                  <p className="text-sm text-muted-foreground">No fraud alerts</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">Secure</Badge>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Account security score: 100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/tiers"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Tier Progress</h3>
                <p className="text-sm text-muted-foreground">Current: Bronze Reseller</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Silver</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-0 bg-yellow-500 rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground">Need GHS 5,000 more in sales</p>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Quick Actions */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/marketing"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Megaphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Marketing Tools</h3>
                <p className="text-sm text-muted-foreground">Quick actions</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(profile.reseller_code);
                  toast.success("Code copied!");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              <Button size="sm" variant="outline">View Assets</Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Snapshot */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard/reseller/analytics"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics Snapshot</h3>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
            </div>
            <div className="flex items-end gap-2 h-16">
              {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-200 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reseller Code */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <code className="flex-1 p-3 bg-muted rounded-lg text-base sm:text-lg font-mono break-all">
              {profile.reseller_code}
            </code>
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(profile.reseller_code);
                toast.success("Code copied to clipboard");
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Share this code with customers to earn {profile.commission_rate}% commission on their purchases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
