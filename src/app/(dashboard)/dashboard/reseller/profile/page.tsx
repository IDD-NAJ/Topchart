"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  Percent,
  Wallet,
  Save,
  Loader2,
  Copy,
  ArrowLeft,
  Shield,
  Trophy,
  CheckCircle,
  Banknote
} from "lucide-react";
import Link from "next/link";

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
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
}

export default function ResellerProfilePage() {
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ResellerProfile>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/reseller/profile", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);
        setFormData(data.profile);
      } else {
        toast.error(data.error || "Failed to load profile");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const res = await fetch("/api/reseller/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Profile updated successfully");
        setProfile(data.profile);
        setEditMode(false);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSaving(false);
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
            <p className="text-muted-foreground">No reseller profile found</p>
            <Link href="/dashboard/reseller">
              <Button className="mt-4">Back to Reseller Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reseller">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Reseller Profile</h1>
            <p className="text-muted-foreground">Manage your business information</p>
          </div>
        </div>
        <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
          {profile.status.toUpperCase()}
        </Badge>
      </div>

      {/* Edit/Save Button */}
      <div className="flex justify-end mb-6">
        {editMode ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setEditMode(false);
              setFormData(profile);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEditMode(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#006994]/10 rounded-lg">
                <Building2 className="h-6 w-6 text-[#006994]" />
              </div>
              <div>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Your business details visible to customers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                {editMode ? (
                  <Input
                    id="business_name"
                    value={formData.business_name || ''}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded">{profile.business_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_phone">Business Phone</Label>
                {editMode ? (
                  <Input
                    id="business_phone"
                    value={formData.business_phone || ''}
                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded">{profile.business_phone || 'N/A'}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_address">Business Address</Label>
              {editMode ? (
                <Input
                  id="business_address"
                  value={formData.business_address || ''}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                />
              ) : (
                <p className="font-medium p-2 bg-muted rounded">{profile.business_address || 'N/A'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              {editMode ? (
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email || ''}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                />
              ) : (
                <p className="font-medium p-2 bg-muted rounded">{profile.business_email || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reseller Code & Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <LinkIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Reseller Details</CardTitle>
                <CardDescription>Your unique code and commission rates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Reseller Code</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-lg font-mono">
                    {profile.reseller_code}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.reseller_code);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Rate</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Percent className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-medium">{profile.commission_rate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Earned on each referral sale</p>
              </div>

              <div className="space-y-2">
                <Label>Discount Rate</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-medium">{profile.discount_rate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Off wholesale purchases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Tier Status</CardTitle>
                <CardDescription>Your current tier and progress</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                {profile.tier_name || 'BRONZE'}
              </Badge>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to {profile.next_tier_name || 'SILVER'}</span>
                  <span className="font-medium">
                    {profile.next_tier_threshold
                      ? Math.min(100, Math.round((profile.total_sales / profile.next_tier_threshold) * 100))
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{
                      width: `${profile.next_tier_threshold
                        ? Math.min(100, Math.round((profile.total_sales / profile.next_tier_threshold) * 100))
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {profile.next_tier_threshold
                ? `You need GHS ${(profile.next_tier_threshold - profile.total_sales).toFixed(0)} more in sales to reach ${profile.next_tier_name}`
                : 'Congratulations! You have reached the maximum tier.'}
            </p>
          </CardContent>
        </Card>

        {/* Bank/Payout Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Payout Information</CardTitle>
                <CardDescription>Bank details for commission payouts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                {editMode ? (
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g., Ecobank"
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded">{profile.bank_name || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Name</Label>
                {editMode ? (
                  <Input
                    id="bank_account_name"
                    value={formData.bank_account_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                    placeholder="Full name on account"
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded">{profile.bank_account_name || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                {editMode ? (
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number || ''}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="Account number"
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded">{profile.bank_account_number || 'Not set'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Your reseller statistics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-[#006994]">
                  GHS {profile.wallet_balance.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  GHS {profile.total_sales.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  GHS {profile.total_commission_earned.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Commission Earned</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {profile.total_referrals}
                </p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
