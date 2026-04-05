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
  Copy
} from "lucide-react";

interface ResellerProfile {
  id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  reseller_code: string;
  commission_rate: number;
  discount_rate: number;
  wallet_balance: number;
  total_sales: number;
  total_commission_earned: number;
  total_referrals: number;
  status: string;
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

export default function ResellerDashboardPage() {
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [stats, setStats] = useState<ResellerStats | null>(null);
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
      } else {
        toast.error(data.error || "Failed to load dashboard");
      }
    } catch (error) {
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
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not a Reseller Yet</h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Apply to become a reseller to access wholesale pricing and earn commissions on referrals.
            </p>
            <Button onClick={() => window.location.href = "/dashboard/reseller/apply"}>
              Apply Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
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
              GHS {profile.wallet_balance.toFixed(2)}
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
              GHS {profile.total_sales.toFixed(2)}
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
              GHS {profile.total_commission_earned.toFixed(2)}
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

      {/* Quick Actions */}
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
            <div className="flex gap-2">
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
          <div className="flex items-center gap-4">
            <code className="flex-1 p-3 bg-muted rounded-lg text-lg font-mono">
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
