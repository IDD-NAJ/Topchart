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

  logo_url?: string;

  phone_verified?: boolean;

  email_verified?: boolean;

  kyc_status?: string;

  security_score?: number;

  last_login_at?: string;

}



export default function ResellerProfilePage() {

  const [profile, setProfile] = useState<ResellerProfile | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState<Partial<ResellerProfile>>({});

  const [uploadingLogo, setUploadingLogo] = useState(false);



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



  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;



    setUploadingLogo(true);

    const formData = new FormData();

    formData.append('file', file);



    try {

      const res = await fetch('/api/upload', {

        method: 'POST',

        credentials: 'include',

        body: formData

      });

      const data = await res.json();



      if (data.success) {

        setFormData(prev => ({ ...prev, logo_url: data.url }));

        toast.success('Logo uploaded successfully');

      } else {

        toast.error(data.error || 'Failed to upload logo');

      }

    } catch (error) {

      toast.error('Failed to upload logo');

    } finally {

      setUploadingLogo(false);

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

    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">

        <div className="flex items-center gap-4">

          <Link href="/dashboard/reseller">

            <Button variant="ghost" size="icon" className="border-slate-200 hover:bg-slate-100">

              <ArrowLeft className="h-5 w-5" />

            </Button>

          </Link>

          <div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Reseller Profile</h1>

            <p className="text-sm sm:text-base text-slate-600 mt-1">Manage your business information</p>

          </div>

        </div>

        <Badge 

          variant={profile.status === 'active' ? 'default' : 'secondary'}

          className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"

        >

          {profile.status === 'active' ? 'Active' : profile.status.toUpperCase()}

        </Badge>

      </div>



      {/* Edit/Save Button */}

      <div className="flex justify-end mb-6">

        {editMode ? (

          <div className="flex gap-2">

            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => {

              setEditMode(false);

              setFormData(profile);

            }}>

              Cancel

            </Button>

            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleSave} disabled={saving}>

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

          <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setEditMode(true)}>

            Edit Profile

          </Button>

        )}

      </div>



      <div className="grid gap-4 sm:gap-6">

        {/* Profile Header Card */}

        <Card className="border-slate-200">

          <CardContent className="p-6 sm:p-8">

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

              <div className="relative group">

                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">

                  {profile.logo_url ? (

                    <img src={profile.logo_url} alt="Business Logo" className="w-full h-full object-cover" />

                  ) : (

                    <Building2 className="h-12 w-12 text-slate-400" />

                  )}

                </div>

                {editMode && (

                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">

                    <input

                      type="file"

                      accept="image/*"

                      onChange={handleLogoUpload}

                      className="hidden"

                    />

                    <span className="text-white text-sm font-medium">

                      {uploadingLogo ? 'Uploading...' : 'Change Logo'}

                    </span>

                  </label>

                )}

              </div>

              <div className="flex-1">

                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">{profile.business_name}</h2>

                <p className="text-sm text-slate-600 mt-1">Reseller Code: <code className="bg-slate-100 px-2 py-1 rounded">{profile.reseller_code}</code></p>

                <div className="flex flex-wrap gap-2 mt-3">

                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">

                    {profile.tier_name || 'BRONZE'} Tier

                  </Badge>

                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">

                    {profile.commission_rate}% Commission

                  </Badge>

                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">

                    {profile.discount_rate}% Discount

                  </Badge>

                </div>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Business Information */}

        <Card className="border-slate-200">

          <CardHeader className="pb-4">

            <div className="flex items-center gap-3">

              <div className="p-2.5 bg-slate-100 rounded-lg">

                <Building2 className="h-5 w-5 text-slate-600" />

              </div>

              <div>

                <CardTitle className="text-slate-900">Business Information</CardTitle>

                <CardDescription className="text-slate-500">Your business details visible to customers</CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent className="grid gap-4 sm:gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">

                <Label htmlFor="business_name" className="text-slate-700">Business Name</Label>

                {editMode ? (

                  <Input

                    id="business_name"

                    value={formData.business_name || ''}

                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}

                    className="border-slate-300"

                  />

                ) : (

                  <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200">{profile.business_name}</p>

                )}

              </div>



              <div className="space-y-2">

                <Label htmlFor="business_phone" className="text-slate-700">Business Phone</Label>

                <div className="flex items-center gap-2">

                  {editMode ? (

                    <Input

                      id="business_phone"

                      value={formData.business_phone || ''}

                      onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}

                      className="border-slate-300"

                    />

                  ) : (

                    <>

                      <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-1">{profile.business_phone || 'N/A'}</p>

                      {profile.phone_verified && (

                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>

                      )}

                    </>

                  )}

                </div>

              </div>

            </div>



            <div className="space-y-2">

              <Label htmlFor="business_address" className="text-slate-700">Business Address</Label>

              {editMode ? (

                <Input

                  id="business_address"

                  value={formData.business_address || ''}

                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}

                  className="border-slate-300"

                />

              ) : (

                <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200">{profile.business_address || 'N/A'}</p>

              )}

            </div>



            <div className="space-y-2">

              <Label htmlFor="business_email" className="text-slate-700">Business Email</Label>

              <div className="flex items-center gap-2">

                {editMode ? (

                  <Input

                    id="business_email"

                    type="email"

                    value={formData.business_email || ''}

                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}

                    className="border-slate-300"

                  />

                ) : (

                  <>

                    <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-1">{profile.business_email || 'N/A'}</p>

                    {profile.email_verified && (

                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>

                    )}

                  </>

                )}

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Reseller Code & Rates */}

        <Card className="border-slate-200">

          <CardHeader className="pb-4">

            <div className="flex items-center gap-3">

              <div className="p-2.5 bg-slate-100 rounded-lg">

                <LinkIcon className="h-5 w-5 text-slate-600" />

              </div>

              <div>

                <CardTitle className="text-slate-900">Reseller Details</CardTitle>

                <CardDescription className="text-slate-500">Your unique code and commission rates</CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

              <div className="space-y-2">

                <Label className="text-slate-700">Reseller Code</Label>

                <div className="flex items-center gap-2">

                  <code className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200 text-lg font-mono text-slate-900">

                    {profile.reseller_code}

                  </code>

                  <Button

                    size="icon"

                    variant="outline"

                    className="border-slate-300 hover:bg-slate-100"

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

                <Label className="text-slate-700">Commission Rate</Label>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">

                  <Percent className="h-5 w-5 text-slate-400" />

                  <span className="text-lg font-semibold text-slate-900">{profile.commission_rate}%</span>

                </div>

                <p className="text-xs text-slate-500">Earned on each referral sale</p>

              </div>



              <div className="space-y-2">

                <Label className="text-slate-700">Discount Rate</Label>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">

                  <Wallet className="h-5 w-5 text-slate-400" />

                  <span className="text-lg font-semibold text-slate-900">{profile.discount_rate}%</span>

                </div>

                <p className="text-xs text-slate-500">Off wholesale purchases</p>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Tier Status */}

        <Card className="border-slate-200">

          <CardHeader className="pb-4">

            <div className="flex items-center gap-3">

              <div className="p-2.5 bg-slate-100 rounded-lg">

                <Trophy className="h-5 w-5 text-slate-600" />

              </div>

              <div>

                <CardTitle className="text-slate-900">Tier Status</CardTitle>

                <CardDescription className="text-slate-500">Your current tier and progress</CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent>

            <div className="flex items-center gap-4 mb-4">

              <Badge variant="outline" className="text-lg px-4 py-2 bg-slate-100 text-slate-700 border-slate-200">

                {profile.tier_name || 'BRONZE'}

              </Badge>

              <div className="flex-1">

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-slate-600">Progress to {profile.next_tier_name || 'SILVER'}</span>

                  <span className="font-semibold text-slate-900">

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

              </div>

            </div>

            <p className="text-sm text-slate-500">

              {profile.next_tier_threshold

                ? `You need GHS ${(Number(profile.next_tier_threshold || 0) - Number(profile.total_sales || 0)).toFixed(0)} more in sales to reach ${profile.next_tier_name}`

                : 'Congratulations! You have reached the maximum tier.'}

            </p>

          </CardContent>

        </Card>



        {/* Bank/Payout Details */}

        <Card className="border-slate-200">

          <CardHeader className="pb-4">

            <div className="flex items-center gap-3">

              <div className="p-2.5 bg-slate-100 rounded-lg">

                <Banknote className="h-5 w-5 text-slate-600" />

              </div>

              <div>

                <CardTitle className="text-slate-900">Payout Information</CardTitle>

                <CardDescription className="text-slate-500">Bank details for commission payouts</CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent className="grid gap-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="space-y-2">

                <Label htmlFor="bank_name" className="text-slate-700">Bank Name</Label>

                {editMode ? (

                  <Input

                    id="bank_name"

                    value={formData.bank_name || ''}

                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}

                    placeholder="e.g., Ecobank"

                    className="border-slate-300"

                  />

                ) : (

                  <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200">{profile.bank_name || 'Not set'}</p>

                )}

              </div>



              <div className="space-y-2">

                <Label htmlFor="bank_account_name" className="text-slate-700">Account Name</Label>

                {editMode ? (

                  <Input

                    id="bank_account_name"

                    value={formData.bank_account_name || ''}

                    onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}

                    placeholder="Full name on account"

                    className="border-slate-300"

                  />

                ) : (

                  <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200">{profile.bank_account_name || 'Not set'}</p>

                )}

              </div>



              <div className="space-y-2">

                <Label htmlFor="bank_account_number" className="text-slate-700">Account Number</Label>

                {editMode ? (

                  <Input

                    id="bank_account_number"

                    value={formData.bank_account_number || ''}

                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}

                    placeholder="Account number"

                    className="border-slate-300"

                  />

                ) : (

                  <p className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-200">{profile.bank_account_number || 'Not set'}</p>

                )}

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Stats Summary */}

        <Card className="border-slate-200">

          <CardHeader className="pb-4">

            <div className="flex items-center gap-3">

              <div className="p-2.5 bg-slate-100 rounded-lg">

                <CheckCircle className="h-5 w-5 text-slate-600" />

              </div>

              <div>

                <CardTitle className="text-slate-900">Performance Summary</CardTitle>

                <CardDescription className="text-slate-500">Your reseller statistics</CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <div className="text-center p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200">

                <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">

                  GHS {Number(profile.wallet_balance || 0).toFixed(2)}

                </p>

                <p className="text-xs sm:text-sm text-slate-600 mt-1">Wallet Balance</p>

              </div>

              <div className="text-center p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200">

                <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">

                  GHS {Number(profile.total_sales || 0).toFixed(2)}

                </p>

                <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Sales</p>

              </div>

              <div className="text-center p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200">

                <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">

                  GHS {Number(profile.total_commission_earned || 0).toFixed(2)}

                </p>

                <p className="text-xs sm:text-sm text-slate-600 mt-1">Commission Earned</p>

              </div>

              <div className="text-center p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200">

                <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">

                  {profile.total_referrals}

                </p>

                <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Referrals</p>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* KYC Status */}

        {profile.kyc_status && (

          <Card className="border-slate-200">

            <CardHeader className="pb-4">

              <div className="flex items-center gap-3">

                <div className="p-2.5 bg-slate-100 rounded-lg">

                  <Shield className="h-5 w-5 text-slate-600" />

                </div>

                <div>

                  <CardTitle className="text-slate-900">KYC Status</CardTitle>

                  <CardDescription className="text-slate-500">Identity verification status</CardDescription>

                </div>

              </div>

            </CardHeader>

            <CardContent>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">

                <div className="flex items-center gap-3">

                  <CheckCircle className={`h-5 w-5 ${profile.kyc_status === 'verified' ? 'text-green-600' : 'text-amber-600'}`} />

                  <div>

                    <p className="font-semibold text-slate-900 capitalize">{profile.kyc_status}</p>

                    <p className="text-xs text-slate-500">Your identity verification status</p>

                  </div>

                </div>

                {profile.kyc_status !== 'verified' && (

                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">

                    Complete KYC

                  </Button>

                )}

              </div>

            </CardContent>

          </Card>

        )}



        {/* Security Score */}

        {profile.security_score !== undefined && (

          <Card className="border-slate-200">

            <CardHeader className="pb-4">

              <div className="flex items-center gap-3">

                <div className="p-2.5 bg-slate-100 rounded-lg">

                  <Shield className="h-5 w-5 text-slate-600" />

                </div>

                <div>

                  <CardTitle className="text-slate-900">Security Score</CardTitle>

                  <CardDescription className="text-slate-500">Account security rating</CardDescription>

                </div>

              </div>

            </CardHeader>

            <CardContent>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">

                    <span className="text-lg font-semibold text-slate-700">{profile.security_score || 0}</span>

                  </div>

                  <div>

                    <p className="font-semibold text-slate-900">{profile.security_score >= 80 ? 'Excellent' : profile.security_score >= 50 ? 'Good' : 'Needs Improvement'}</p>

                    <p className="text-xs text-slate-500">Based on your account security settings</p>

                  </div>

                </div>

                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">

                  Improve Security

                </Button>

              </div>

            </CardContent>

          </Card>

        )}

      </div>

    </div>

  );

}

