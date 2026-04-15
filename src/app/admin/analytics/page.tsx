"use client";



import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, MapPin, RefreshCw } from "lucide-react";



export default function AdminAnalyticsOverviewPage() {

  const [stats, setStats] = useState({

    totalResellers: 0,

    activeResellers: 0,

    totalSales: 0,

    totalCommissions: 0,

    totalReferrals: 0,

    fraudAlerts: 0

  });

  const [topResellers, setTopResellers] = useState<any[]>([]);

  const [salesByRegion, setSalesByRegion] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    loadAnalytics();

  }, []);



  const loadAnalytics = async () => {

    try {

      const res = await fetch("/api/admin/analytics", {

        credentials: "include"

      });

      const data = await res.json();



      if (data.success) {

        setStats(data.stats);

        setTopResellers(data.topResellers || []);

        setSalesByRegion(data.salesByRegion || []);

      }

    } catch (error) {

      toast.error("Failed to load analytics");

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



  return (

    <div className="container mx-auto py-8 px-4">

      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-2xl font-bold">Reseller Analytics Overview</h1>

          <p className="text-muted-foreground">Platform-wide reseller performance metrics</p>

        </div>

        <Button variant="outline" onClick={loadAnalytics}>

          <RefreshCw className="h-4 w-4 mr-2" />

          Refresh

        </Button>

      </div>



      {/* Stats Grid */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Total Resellers</CardTitle>

            <Users className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{stats.totalResellers}</div>

            <p className="text-xs text-muted-foreground">{stats.activeResellers} active</p>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>

            <DollarSign className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">GHS {Number(stats.totalSales || 0).toFixed(2)}</div>

            <p className="text-xs text-muted-foreground">All time revenue</p>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>

            <TrendingUp className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">GHS {Number(stats.totalCommissions || 0).toFixed(2)}</div>

            <p className="text-xs text-muted-foreground">To resellers</p>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Referrals</CardTitle>

            <ShoppingCart className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{stats.totalReferrals}</div>

            <p className="text-xs text-muted-foreground">Total referred users</p>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>

            <BarChart3 className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{stats.fraudAlerts}</div>

            <p className="text-xs text-muted-foreground">Open alerts</p>

          </CardContent>

        </Card>

      </div>



      {/* Top Resellers */}

      <Card className="mb-8">

        <CardHeader>

          <CardTitle>Top Performing Resellers</CardTitle>

          <CardDescription>Highest sales and commission earners</CardDescription>

        </CardHeader>

        <CardContent>

          <div className="space-y-4">

            {topResellers.length === 0 ? (

              <p className="text-center text-muted-foreground py-4">No reseller data available</p>

            ) : (

              topResellers.map((reseller, index) => (

                <div key={reseller.id} className="flex items-center justify-between p-4 border rounded-lg">

                  <div className="flex items-center gap-4">

                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">

                      {index + 1}

                    </div>

                    <div>

                      <p className="font-semibold">{reseller.business_name}</p>

                      <p className="text-sm text-muted-foreground">{reseller.user_email}</p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="font-bold">GHS {Number(reseller.total_sales || 0).toFixed(2)}</p>

                    <p className="text-xs text-muted-foreground">{reseller.total_referrals} referrals</p>

                  </div>

                </div>

              ))

            )}

          </div>

        </CardContent>

      </Card>



      {/* Sales by Region */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <MapPin className="h-5 w-5" />

            Sales by Region

          </CardTitle>

          <CardDescription>Geographic distribution of reseller sales</CardDescription>

        </CardHeader>

        <CardContent>

          <div className="space-y-3">

            {salesByRegion.length === 0 ? (

              <p className="text-center text-muted-foreground py-4">No geographic data available</p>

            ) : (

              salesByRegion.map((region: any) => (

                <div key={region.region} className="flex items-center justify-between p-3 border rounded-lg">

                  <div className="flex items-center gap-3">

                    <MapPin className="h-4 w-4 text-muted-foreground" />

                    <span className="font-medium">{region.region || "Unknown"}</span>

                  </div>

                  <div className="text-right">

                    <p className="font-semibold">GHS {Number(region.total_sales || 0).toFixed(2)}</p>

                    <p className="text-xs text-muted-foreground">{region.sales_count} sales</p>

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

