"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  Phone, 
  Wifi, 
  ArrowRight,
  Settings,
  DollarSign,
  Package,
  Globe
} from "lucide-react";

interface DashboardStats {
  phonePlans: number;
  activePhonePlans: number;
  dataPackages: number;
  activeDataPackages: number;
}

export default function ESIMAdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = async () => {
    try {
      const [plansRes, packagesRes] = await Promise.all([
        fetch("/api/admin/esim/plans"),
        fetch("/api/admin/esim/packages"),
      ]);

      const plansData = plansRes.ok ? await plansRes.json() : { success: false, data: [] };
      const packagesData = packagesRes.ok ? await packagesRes.json() : { success: false, data: [] };

      if (plansData.success && packagesData.success) {
        setStats({
          phonePlans: plansData.data.length,
          activePhonePlans: plansData.data.filter((p: any) => p.isActive).length,
          dataPackages: packagesData.data.length,
          activeDataPackages: packagesData.data.filter((p: any) => p.isActive).length,
        });
      }
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">eSIM Management</h1>
        <p className="text-muted-foreground">
          Manage phone number plans and travel data eSIMs
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Plans
              </CardDescription>
              <CardTitle className="text-2xl">{stats.phonePlans}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600">{stats.activePhonePlans} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Data Packages
              </CardDescription>
              <CardTitle className="text-2xl">{stats.dataPackages}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600">{stats.activeDataPackages} active</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Plans */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Phone Number Plans</CardTitle>
                  <CardDescription>US phone number eSIM plans</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{stats?.phonePlans || 0} plans</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage US Basic, US Premium, US Business and other phone number plans. 
              Set prices, minutes, SMS limits, and features.
            </p>
            <Link href="/admin/esim/phone-plans">
              <Button className="w-full">
                Manage Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Data Packages */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Travel Data eSIMs</CardTitle>
                  <CardDescription>Country/region data packages</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{stats?.dataPackages || 0} packages</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage travel data eSIMs for different countries and regions. 
              Set data allowances, validity periods, and pricing.
            </p>
            <Link href="/admin/esim/packages">
              <Button className="w-full" variant="outline">
                Manage Packages
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Phone Plans Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">₵120</p>
              <p className="text-sm text-muted-foreground">US Basic</p>
              <p className="text-xs text-muted-foreground">100 min / 100 SMS</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">₵200</p>
              <p className="text-sm text-muted-foreground">US Premium</p>
              <p className="text-xs text-muted-foreground">500 min / 500 SMS</p>
              <Badge className="mt-1 bg-amber-500 text-[10px]">Popular</Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">₵350</p>
              <p className="text-sm text-muted-foreground">US Business</p>
              <p className="text-xs text-muted-foreground">999 min / 999 SMS</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
