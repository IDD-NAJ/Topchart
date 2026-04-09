import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, Mail, CheckCircle, ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";

interface PublicResellerProfile {
  id: string;
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  reseller_code: string;
  tier_name: string;
  status: string;
  total_sales: number;
  commission_rate: number;
}

async function getPublicResellerProfile(code: string): Promise<PublicResellerProfile | null> {
  try {
    const rows = await sql`
      SELECT
        r.id,
        r.business_name,
        r.business_address,
        r.business_phone,
        r.reseller_code,
        COALESCE(rt.name, 'BRONZE') as tier_name,
        r.status,
        r.total_sales,
        r.commission_rate,
        u.email as business_email
      FROM reseller_profiles r
      LEFT JOIN reseller_tiers rt ON rt.name = (
        SELECT CASE
          WHEN COALESCE(r.total_sales, 0) >= 100000 THEN 'PLATINUM'
          WHEN COALESCE(r.total_sales, 0) >= 20000 THEN 'GOLD'
          WHEN COALESCE(r.total_sales, 0) >= 5000 THEN 'SILVER'
          ELSE 'BRONZE'
        END
      )
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.reseller_code = ${code}
        AND r.status = 'active'
      LIMIT 1
    `;

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    return rows[0] as PublicResellerProfile;
  } catch (error) {
    console.error("Error fetching public reseller profile:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getPublicResellerProfile(code);

  if (!profile) {
    return {
      title: "Reseller Not Found | Topchart",
    };
  }

  return {
    title: `${profile.business_name} | Topchart Reseller`,
    description: `Shop with ${profile.business_name} - Verified Topchart Reseller`,
  };
}

export default async function PublicResellerPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getPublicResellerProfile(code);

  if (!profile) {
    notFound();
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/reseller/${profile.reseller_code}`
    : `/reseller/${profile.reseller_code}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#006994]/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#006994] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-lg text-[#006994]">Topchart</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                My Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Profile Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-24 h-24 bg-[#006994]/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-[#006994]" />
            </div>
            <CardTitle className="text-2xl">{profile.business_name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified Reseller
              </Badge>
              <Badge variant="outline">{profile.tier_name} Tier</Badge>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Reseller Code */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Reseller Code</p>
              <code className="text-2xl font-bold text-[#006994] font-mono">
                {profile.reseller_code}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Use this code when shopping to support this reseller
              </p>
            </div>

            {/* Business Details */}
            <div className="grid gap-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Business Information
              </h3>

              {profile.business_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{profile.business_address}</p>
                  </div>
                </div>
              )}

              {profile.business_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.business_phone}</p>
                  </div>
                </div>
              )}

              {profile.business_email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.business_email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#006994]">
                  GHS {profile.total_sales?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#006994]">
                  {profile.commission_rate}%
                </p>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <Link href={`/register?ref=${profile.reseller_code}`} className="block">
                <Button className="w-full bg-[#006994] hover:bg-[#005a7a]" size="lg">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Shop with this Reseller
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${profile.business_name} - Topchart Reseller`,
                      text: `Shop with ${profile.business_name} using code ${profile.reseller_code}`,
                      url: shareUrl,
                    });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share this Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-md mx-auto">
          This is a verified Topchart reseller. When you use their referral code,
          they earn a commission on your purchases at no extra cost to you.
        </p>
      </main>
    </div>
  );
}
