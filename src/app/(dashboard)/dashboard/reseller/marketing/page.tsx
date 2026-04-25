"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Megaphone, Copy, CheckCircle, Download, Link2, MousePointer, Users, Image, FileText, Video, Trash2, Share2, MessageCircle, Loader2 } from "lucide-react";

interface ReferralLink {
  id: string;
  referral_code: string;
  landing_page: string;
  clicks: number;
  conversions: number;
  created_at: string;
}

interface MarketingAsset {
  id: string;
  name: string;
  type: string;
  category: string;
  file_url: string;
  thumbnail_url: string;
  download_count: number;
}

export default function ResellerMarketingPage() {
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [resellerCode, setResellerCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      const res = await fetch("/api/reseller/marketing", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setReferralLinks(data.referralLinks);
        setAssets(data.assets);
        setResellerCode(data.resellerCode);
      }
    } catch (error) {
      toast.error("Failed to load marketing data");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(resellerCode);
    setCopiedCode(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const shareViaWhatsApp = (url: string) => {
    const text = `Join Topchart  and get amazing deals on airtime and data! Use my referral link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const deleteLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/reseller/marketing?id=${linkId}`, {
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

  const createReferralLink = async () => {
    try {
      const res = await fetch("/api/reseller/marketing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landing_page: newLinkUrl || "/register" })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("New referral link created");
        setReferralLinks(prev => [data.link, ...prev]);
        setNewLinkUrl("");
      }
    } catch (error) {
      toast.error("Failed to create link");
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-slate-600" />;
      case 'video': return <Video className="h-5 w-5 text-slate-600" />;
      case 'document': return <FileText className="h-5 w-5 text-slate-600" />;
      default: return <Download className="h-5 w-5 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Marketing Tools</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">Promote your business with referral links and marketing assets</p>
      </div>

      {/* Referral Code Card */}
      <Card className="border-slate-200 mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <Megaphone className="h-5 w-5 text-slate-600" />
            </div>
            Your Referral Code
          </CardTitle>
          <CardDescription className="text-slate-500">Share this code with customers to earn commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 p-4 bg-slate-100 rounded-lg text-xl font-mono font-bold text-slate-900">
              {resellerCode}
            </code>
            <Button 
              size="lg"
              onClick={copyReferralCode}
              className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
            >
              {copiedCode ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedCode ? "Copied!" : "Copy Code"}
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Share your code on social media, with friends, or add it to your marketing materials. 
            You earn commission on every purchase made by users who sign up with your code.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {referralLinks.reduce((sum, link) => sum + (link.clicks || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Conversions</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {referralLinks.reduce((sum, link) => sum + (link.conversions || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Conversion Rate</CardTitle>
            <Link2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {(() => {
                const totalClicks = referralLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
                const totalConv = referralLinks.reduce((sum, link) => sum + (link.conversions || 0), 0);
                return totalClicks > 0 ? ((totalConv / totalClicks) * 100).toFixed(1) : 0;
              })()}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Link */}
      <Card className="border-slate-200 mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-slate-900">Create Referral Link</CardTitle>
          <CardDescription className="text-slate-500">Create custom referral links for different campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Landing page (e.g., /register)"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="flex-1 border-slate-300"
            />
            <Button onClick={createReferralLink} className="bg-slate-900 text-white hover:bg-slate-800">
              <Link2 className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Links */}
      <Card className="border-slate-200 mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-slate-900">Your Referral Links</CardTitle>
          <CardDescription className="text-slate-500">Track performance of your referral links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referralLinks.map((link) => {
              const fullUrl = `${window.location.origin}/r/${link.referral_code}`;
              return (
                <div key={link.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-4 w-4 text-slate-500" />
                    <div>
                      <code className="text-sm font-mono text-slate-700">{link.referral_code}</code>
                      <p className="text-xs text-slate-500">{fullUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-600"><MousePointer className="h-3 w-3 inline mr-1" />{link.clicks || 0}</span>
                        <span className="text-slate-600"><Users className="h-3 w-3 inline mr-1" />{link.conversions || 0}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-slate-100"
                        onClick={() => shareViaWhatsApp(fullUrl)}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-slate-100"
                        onClick={() => copyLink(fullUrl)}
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-slate-100"
                        onClick={() => deleteLink(link.id)}
                        title="Delete link"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {referralLinks.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Link2 className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                <p>No referral links created yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marketing Assets */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Marketing Assets</CardTitle>
          <CardDescription className="text-slate-500">Download promotional materials for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-500">{asset.category}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-100" asChild>
                  <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-500">
                <Image className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                <p>No marketing assets available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
