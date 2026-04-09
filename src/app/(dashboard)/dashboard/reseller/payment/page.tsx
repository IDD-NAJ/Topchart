"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { secureFetch } from "@/lib/csrf";
import { 
  CreditCard, 
  Wallet, 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  Building2,
  DollarSign
} from "lucide-react";
import Link from "next/link";

interface ApplicationData {
  id: string;
  business_name: string;
  application_fee: number;
  payment_status: string;
  application_status: string;
}

interface UserWallet {
  balance: number;
}

export default function ResellerPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("application_id");
  
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "wallet" | null>(null);

  useEffect(() => {
    if (!applicationId) {
      toast.error("No application ID provided");
      router.push("/dashboard/reseller/apply");
      return;
    }
    loadData();
  }, [applicationId]);

  const loadData = async () => {
    try {
      // Load application details
      const appRes = await fetch(`/api/reseller/apply?id=${encodeURIComponent(applicationId || "")}`, {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" }
      });
      const appData = await appRes.json();
      
      if (!appData.success || !appData.application) {
        toast.error("Application not found");
        router.push("/dashboard/reseller/apply");
        return;
      }
      if (appData.application.id !== applicationId) {
        toast.error("Invalid application selected");
        router.push("/dashboard/reseller/apply");
        return;
      }

      setApplication(appData.application);

      // Load wallet balance
      const walletRes = await fetch("/api/wallet", {
        credentials: "include"
      });
      const walletData = await walletRes.json();
      
      if (walletData.success) {
        setWallet({ balance: walletData.data?.balance || 0 });
      }
    } catch (error) {
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!application) return;
    setProcessing(true);
    setPaymentMethod("paystack");

    try {
      const res = await secureFetch("/api/reseller/payment/initialize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: application.id,
          amount: application.application_fee,
          payment_method: "paystack"
        })
      });

      const data = await res.json();

      const authorizationUrl = data.authorization_url || data.data?.authorization_url;

      if (data.success && authorizationUrl) {
        // Redirect to Paystack
        window.location.href = authorizationUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment");
        setProcessing(false);
      }
    } catch (error) {
      toast.error("Network error");
      setProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!application || !wallet) return;
    
    if (wallet.balance < application.application_fee) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setProcessing(true);
    setPaymentMethod("wallet");

    try {
      const res = await secureFetch("/api/reseller/payment/wallet", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: application.id,
          amount: application.application_fee
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Payment successful! Your application has been approved.");
        router.push("/dashboard/reseller/status");
      } else {
        toast.error(data.error || "Payment failed");
        setProcessing(false);
      }
    } catch (error) {
      toast.error("Network error");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-[#006994] mb-4" />
            <p className="text-muted-foreground">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Application not found</p>
            <Link href="/dashboard/reseller/apply">
              <Button className="mt-4">Back to Application</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If already paid, redirect to status
  if (application.payment_status === "paid") {
    router.push("/dashboard/reseller/status");
    return null;
  }

  const fee = Number(application.application_fee) || 100;
  const hasEnoughBalance = wallet && wallet.balance >= fee;
  const isPaystackProcessing = processing && paymentMethod === "paystack";
  const isWalletProcessing = processing && paymentMethod === "wallet";

  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 bg-[#006994]/10 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-8 w-8 text-[#006994]" />
            </div>
          </div>
          <CardTitle className="text-xl">Complete Your Application</CardTitle>
          <CardDescription>
            Choose a payment method to pay the application fee
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Application Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-medium">{application.business_name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Application Fee</span>
              <span className="text-lg font-bold text-[#006994]">GHS {fee.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Select Payment Method</p>
            
            {/* Paystack Option */}
            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-between"
              onClick={handlePaystackPayment}
              disabled={processing}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Pay with Card/Bank</p>
                  <p className="text-xs text-muted-foreground">Secure payment via Paystack</p>
                </div>
              </div>
              {isPaystackProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

            {/* Wallet Option */}
            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-between"
              onClick={handleWalletPayment}
              disabled={processing || !hasEnoughBalance}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Pay with Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    Balance: GHS {Number(wallet?.balance).toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
              {!hasEnoughBalance && (
                <Badge variant="secondary">Insufficient</Badge>
              )}
              {isWalletProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : hasEnoughBalance ? (
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              ) : null}
            </Button>
            {!hasEnoughBalance && (
              <p className="text-xs text-red-600">
                Wallet balance is insufficient for this fee.{" "}
                <Link href="/dashboard/wallet" className="underline">
                  Fund wallet
                </Link>
              </p>
            )}
          </div>

          {/* Back Link */}
          <Link href="/dashboard/reseller/apply">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Application
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
