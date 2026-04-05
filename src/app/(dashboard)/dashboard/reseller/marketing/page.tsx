"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Megaphone, Copy, CheckCircle, Download, Link2, MousePointer, Users, Image, FileText, Video } from "lucide-react";

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
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <Download className="h-5 w-5" />;
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
        <h1 className="text-2xl font-bold">Marketing Tools</h1>
        <p className="text-muted-foreground">Promote your business with referral links and marketing assets</p>
      </div>

      {/* Referral Code Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>Share this code with customers to earn commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 p-4 bg-muted rounded-lg text-xl font-mono font-bold">
              {resellerCode}
            </code>
            <Button 
              size="lg"
              onClick={copyReferralCode}
              className="gap-2"
            >
              {copiedCode ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedCode ? "Copied!" : "Copy Code"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Share your code on social media, with friends, or add it to your marketing materials. 
            You earn commission on every purchase made by users who sign up with your code.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralLinks.reduce((sum, link) => sum + (link.clicks || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralLinks.reduce((sum, link) => sum + (link.conversions || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Referral Link</CardTitle>
          <CardDescription>Create custom referral links for different campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Landing page (e.g., /register)"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createReferralLink}>
              <Link2 className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Links */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Referral Links</CardTitle>
          <CardDescription>Track performance of your referral links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referralLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <code className="text-sm font-mono">{link.referral_code}</code>
                    <p className="text-xs text-muted-foreground">{link.landing_page}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-3 text-sm">
                      <span><MousePointer className="h-3 w-3 inline mr-1" />{link.clicks || 0}</span>
                      <span><Users className="h-3 w-3 inline mr-1" />{link.conversions || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyLink(`${window.location.origin}/r/${link.referral_code}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {referralLinks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-2" />
                <p>No referral links created yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marketing Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Assets</CardTitle>
          <CardDescription>Download promotional materials for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2" />
                <p>No marketing assets available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
