"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { MetricCard } from "@/components/dashboard/reseller/MetricCard";
import { QuickActionCard } from "@/components/dashboard/reseller/QuickActionCard";
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
  ChevronRight,
  QrCode,
  Share2,
  MessageCircle,
  Trash2
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

interface TrendData {
  date: string;
  amount: number;
}

interface DashboardData {
  profile: ResellerProfile;
  stats: ResellerStats;
  trends?: {
    sales: TrendData[];
    commissions: TrendData[];
  };
}

interface ResellerState {
  role: string | null;
  profile_exists: boolean;
  application_status: string | null;
  payment_status: string | null;
}

interface ReferralLink {
  id: string;
  code: string;
  landing_page: string;
  clicks: number;
  conversions: number;
  is_active: boolean;
  created_at: string;
}

function asMoney(value: unknown): string {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

export default function ResellerDashboardPage() {
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [trends, setTrends] = useState<{ sales: TrendData[]; commissions: TrendData[] } | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [resellerState, setResellerState] = useState<ResellerState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralView, setReferralView] = useState<'code' | 'link'>('code');
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [newLinkLandingPage, setNewLinkLandingPage] = useState('/register');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (profile) {
      loadReferralLinks();
    }
  }, [profile]);

  const loadReferralLinks = async () => {
    try {
      const res = await fetch("/api/reseller/referral-links", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setReferralLinks(data.links);
      }
    } catch (error) {
      console.error("Error loading referral links:", error);
    }
  };

  const createReferralLink = async () => {
    try {
      const res = await fetch("/api/reseller/referral-links", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landing_page: newLinkLandingPage })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Referral link created!");
        setReferralLinks(prev => [data.link, ...prev]);
        setNewLinkLandingPage('/register');
      } else {
        toast.error(data.error || "Failed to create link");
      }
    } catch (error) {
      toast.error("Failed to create link");
    }
  };

  const deleteReferralLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/reseller/referral-links/${linkId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Link deleted");
        setReferralLinks(prev => prev.filter(link => link.id !== linkId));
      } else {
        toast.error(data.error || "Failed to delete link");
      }
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const shareViaWhatsApp = (url: string) => {
    const text = `Join Topchart Ghana and get amazing deals on airtime and data! Use my referral link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const loadDashboardData = async () => {
    try {
      const res = await fetch("/api/reseller/dashboard", {
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setStats(data.stats);
        setTrends(data.trends || null);
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
          console.error("Dashboard load error:", errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load dashboard";
      setLoadError(errorMessage);
      console.error("Dashboard load error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await fetch("/api/reseller/activity?limit=5", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  useEffect(() => {
    if (profile) {
      loadActivities();
    }
  }, [profile]);

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
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Reseller Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Welcome back, {profile.business_name}</p>
        </div>
        <Badge 
          variant={profile.status === 'active' ? 'default' : 'secondary'}
          className="w-fit bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
        >
          {profile.status === 'active' ? 'Active' : profile.status.toUpperCase()}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <MetricCard
          title="Wallet Balance"
          value={`GHS ${asMoney(profile.wallet_balance)}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Sales"
          value={`GHS ${asMoney(profile.total_sales)}`}
          subtitle={`${stats?.sales.total_sales || 0} transactions`}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Commissions"
          value={`GHS ${asMoney(profile.total_commission_earned)}`}
          subtitle={`${profile.commission_rate}% rate`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Referrals"
          value={profile.total_referrals.toString()}
          subtitle="Total referred users"
          icon={Users}
        />
      </div>

      {/* Profile & Tier Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Business Profile Card */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Business Profile</CardTitle>
                  <p className="text-sm text-slate-500">Your reseller business details</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => window.location.href = "/dashboard/reseller/profile"}>
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Business Name</p>
                    <p className="font-medium text-slate-900">{profile.business_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Address</p>
                    <p className="font-medium text-slate-900">{profile.business_address || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{profile.business_phone || 'N/A'}</p>
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Reseller Code</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono text-slate-900 break-all">{profile.reseller_code}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:bg-slate-100"
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
                  <Percent className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Commission Rate</p>
                    <p className="font-medium text-slate-900">{profile.commission_rate}% per sale</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wallet className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Discount Rate</p>
                    <p className="font-medium text-slate-900">{profile.discount_rate}% off wholesale</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Status Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Tier Status</CardTitle>
                  <p className="text-sm text-slate-500">{profile.tier_name || 'Bronze'} Reseller</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Progress to {profile.next_tier_name || 'Silver'}</span>
                  <span className="font-medium text-slate-900">
                    {profile.next_tier_threshold
                      ? Math.min(100, Math.round((profile.total_sales / profile.next_tier_threshold) * 100))
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full transition-all"
                    style={{
                      width: `${profile.next_tier_threshold
                        ? Math.min(100, Math.round((profile.total_sales / profile.next_tier_threshold) * 100))
                        : 0}%`
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {profile.next_tier_threshold
                    ? `Need GHS ${(profile.next_tier_threshold - profile.total_sales).toFixed(0)} more in sales`
                    : 'Maximum tier reached!'}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
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
        <Card className="mb-8 border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Activity className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Recent Activity</CardTitle>
                  <p className="text-sm text-slate-500">Your latest transactions</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto text-slate-600 hover:bg-slate-100" onClick={() => window.location.href = "/dashboard/history"}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'sale' ? 'bg-slate-200' :
                      activity.type === 'commission' ? 'bg-slate-200' :
                      activity.type === 'purchase' ? 'bg-slate-200' :
                      'bg-slate-200'
                    }`}>
                      {activity.type === 'sale' ? <DollarSign className="h-4 w-4 text-slate-600" /> :
                       activity.type === 'commission' ? <TrendingUp className="h-4 w-4 text-slate-600" /> :
                       activity.type === 'purchase' ? <ShoppingCart className="h-4 w-4 text-slate-600" /> :
                       <Users className="h-4 w-4 text-slate-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{activity.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium text-sm sm:text-base ${
                    activity.type === 'purchase' ? 'text-slate-900' :
                    activity.type === 'sale' || activity.type === 'commission' ? 'text-slate-900' :
                    'text-slate-900'
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
      <h2 className="text-lg font-semibold mb-4 text-slate-900">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <QuickActionCard
          title="Buy Wholesale"
          description={`Purchase at ${profile.discount_rate}% discount`}
          icon={ShoppingCart}
          onClick={() => window.location.href = "/dashboard/reseller/purchase"}
        />
        <QuickActionCard
          title="My Inventory"
          description={`${stats?.inventory.count || 0} cards in stock`}
          icon={Store}
          onClick={() => window.location.href = "/dashboard/reseller/inventory"}
        />
        <QuickActionCard
          title="Marketing Tools"
          description="Referral links & assets"
          icon={Users}
          onClick={() => window.location.href = "/dashboard/reseller/marketing"}
        />
      </div>

      {/* New Feature Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Security Overview */}
        <Card className="hover:border-slate-300 transition-colors cursor-pointer border-slate-200" onClick={() => window.location.href = "/dashboard/reseller/security"}>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Shield className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Security Overview</h3>
                  <p className="text-sm text-slate-500">No fraud alerts</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Secure</Badge>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              <span>Account security score: 100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card className="hover:border-slate-300 transition-colors cursor-pointer border-slate-200" onClick={() => window.location.href = "/dashboard/reseller/tiers"}>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Trophy className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Tier Progress</h3>
                <p className="text-sm text-slate-500">Current: Bronze Reseller</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progress to Silver</span>
                <span className="font-medium text-slate-900">0%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-slate-600 rounded-full" />
              </div>
              <p className="text-xs text-slate-500">Need GHS 5,000 more in sales</p>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Quick Actions */}
        <Card className="hover:border-slate-300 transition-colors cursor-pointer border-slate-200" onClick={() => window.location.href = "/dashboard/reseller/marketing"}>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Megaphone className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Marketing Tools</h3>
                <p className="text-sm text-slate-500">Quick actions</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(profile.reseller_code);
                  toast.success("Code copied!");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">View Assets</Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Snapshot */}
        <Card className="hover:border-slate-300 transition-colors cursor-pointer border-slate-200" onClick={() => window.location.href = "/dashboard/reseller/analytics"}>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Analytics Snapshot</h3>
                <p className="text-sm text-slate-500">Last 30 days</p>
              </div>
            </div>
            <div className="flex items-end gap-2 h-16">
              {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-slate-300 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Section with Toggle */}
      <Card className="mt-8 border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-slate-900">Referral Program</CardTitle>
              <p className="text-sm text-slate-500">Share your code or link to earn {profile.commission_rate}% commission</p>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setReferralView('code')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  referralView === 'code'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setReferralView('link')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  referralView === 'link'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Link
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {referralView === 'code' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <code className="flex-1 p-4 bg-slate-100 rounded-lg text-base sm:text-lg font-mono text-slate-900 break-all text-center sm:text-left">
                  {profile.reseller_code}
                </code>
                <Button 
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.reseller_code);
                    toast.success("Code copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => window.location.href = "/dashboard/reseller/marketing"}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    const text = `Join Topchart Ghana and get amazing deals! Use my referral code: ${profile.reseller_code}`;
                    navigator.clipboard.writeText(text);
                    toast.success("Message copied to clipboard");
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Message
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter landing page (e.g., /register)"
                  className="flex-1 border-slate-300"
                  value={newLinkLandingPage}
                  onChange={(e) => setNewLinkLandingPage(e.target.value)}
                />
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  onClick={createReferralLink}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              </div>
              {referralLinks.length > 0 ? (
                <div className="space-y-3">
                  {referralLinks.map((link) => {
                    const fullUrl = `${window.location.origin}/r/${link.code}`;
                    return (
                      <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <code className="text-sm font-mono text-slate-900 break-all">{link.code}</code>
                            <p className="text-xs text-slate-500 truncate">{fullUrl}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <div className="text-right mr-2 hidden sm:block">
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              <span className="font-mono">{link.clicks || 0} clicks</span>
                              <span className="font-mono">{link.conversions || 0} conv</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => shareViaWhatsApp(fullUrl)}
                              title="Share on WhatsApp"
                              className="h-8 w-8 p-0"
                            >
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyLink(fullUrl)}
                              title="Copy link"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteReferralLink(link.id)}
                              title="Delete link"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No custom referral links created yet</p>
                  <p className="text-xs mt-1">Create a custom link to track different campaigns</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
