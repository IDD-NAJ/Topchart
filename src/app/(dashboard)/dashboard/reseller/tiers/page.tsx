"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trophy, Star, CheckCircle, Lock, TrendingUp, Users, DollarSign } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  display_name: string;
  min_sales_amount: number;
  min_referrals: number;
  commission_rate: number;
  discount_rate: number;
  bonus_amount: number;
  perks: string[];
}

export default function ResellerTiersPage() {
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [nextTier, setNextTier] = useState<Tier | null>(null);
  const [allTiers, setAllTiers] = useState<Tier[]>([]);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalReferrals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTierData();
  }, []);

  const loadTierData = async () => {
    try {
      const res = await fetch("/api/reseller/tiers", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setCurrentTier(data.currentTier);
        setNextTier(data.nextTier);
        setAllTiers(data.allTiers);
        setProgress(data.progress);
        setStats({
          totalSales: data.totalSales,
          totalReferrals: data.totalReferrals
        });
      }
    } catch (error) {
      toast.error("Failed to load tier data");
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'BRONZE': return <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-lg">B</div>;
      case 'SILVER': return <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg">S</div>;
      case 'GOLD': return <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold text-lg">G</div>;
      case 'PLATINUM': return <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">P</div>;
      default: return <Trophy className="h-12 w-12 text-muted-foreground" />;
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
        <h1 className="text-2xl font-bold">Tiered Reseller Levels</h1>
        <p className="text-muted-foreground">Unlock higher commissions and exclusive benefits</p>
      </div>

      {/* Current Tier Card */}
      {currentTier && (
        <Card className="mb-8 border-2 border-[#006994]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {getTierIcon(currentTier.name)}
                <div>
                  <h2 className="text-2xl font-bold">{currentTier.display_name}</h2>
                  <p className="text-muted-foreground">Your current tier</p>
                </div>
              </div>
              <Badge variant="default" className="text-lg px-4 py-1">
                <Star className="h-4 w-4 mr-1" />
                Active
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-[#006994]">{currentTier.commission_rate}%</div>
                <div className="text-xs text-muted-foreground">Commission Rate</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-[#006994]">{currentTier.discount_rate}%</div>
                <div className="text-xs text-muted-foreground">Discount Rate</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-[#006994]">GHS {currentTier.bonus_amount}</div>
                <div className="text-xs text-muted-foreground">Monthly Bonus</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-[#722F37]">{currentTier.perks?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Perks</div>
              </div>
            </div>

            {nextTier && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress to {nextTier.display_name}</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Need GHS {(nextTier.min_sales_amount - stats.totalSales).toFixed(2)} more sales and {nextTier.min_referrals - stats.totalReferrals} more referrals
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime sales amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Users referred</p>
          </CardContent>
        </Card>
      </div>

      {/* All Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>All Tier Levels</CardTitle>
          <CardDescription>Requirements and benefits for each tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allTiers.map((tier, index) => {
              const isCurrentTier = currentTier?.name === tier.name;
              const isLocked = stats.totalSales < tier.min_sales_amount;
              
              return (
                <div 
                  key={tier.id} 
                  className={`flex items-start justify-between p-4 border rounded-lg ${isCurrentTier ? 'border-[#006994] bg-[#006994]/5' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {getTierIcon(tier.name)}
                      {isCurrentTier && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {isLocked && !isCurrentTier && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-gray-400 rounded-full flex items-center justify-center">
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{tier.display_name}</span>
                        {isCurrentTier && <Badge>Current</Badge>}
                        {isLocked && !isCurrentTier && <Badge variant="secondary">Locked</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Min Sales: GHS {tier.min_sales_amount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          Min Referrals: {tier.min_referrals}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tier.perks?.map((perk: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {perk.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#006994]">{tier.commission_rate}%</div>
                    <div className="text-xs text-muted-foreground">commission</div>
                    <div className="text-sm font-semibold mt-1">{tier.discount_rate}% off</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
