"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { secureFetch } from "@/lib/csrf";
import { CreditCard, Wallet, ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <Card className="border-slate-200">
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
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <Button variant="ghost" className="mb-4 sm:mb-6 border-slate-200 hover:bg-slate-100" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="max-w-2xl mx-auto">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-slate-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-slate-600" />
              </div>
              Complete Payment
            </CardTitle>
            <CardDescription className="text-slate-500">
              Pay the application fee to activate your reseller account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Application Summary */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Application Fee</span>
                <span className="text-lg font-bold text-slate-900">GHS {application?.application_fee?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Business Name</span>
                <span className="text-sm text-slate-900">{application?.business_name || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Payment Status</span>
                <Badge variant={application?.payment_status === "paid" ? "default" : "secondary"} className={application?.payment_status === "paid" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}>
                  {application?.payment_status || "—"}
                </Badge>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Select Payment Method</p>
              
              {/* Paystack Option */}
              <Button
                variant="outline"
                className="w-full h-auto py-4 justify-between border-slate-300 hover:bg-slate-100"
                onClick={handlePaystackPayment}
                disabled={processing}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Pay with Card/Bank</p>
                    <p className="text-xs text-slate-500">Secure payment via Paystack</p>
                  </div>
                </div>
                {isPaystackProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                )}
              </Button>

              {/* Wallet Option */}
              <Button
                variant="outline"
                className="w-full h-auto py-4 justify-between border-slate-300 hover:bg-slate-100"
                onClick={handleWalletPayment}
                disabled={processing || !hasEnoughBalance}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Pay with Wallet</p>
                    <p className="text-xs text-slate-500">
                      Balance: GHS {Number(wallet?.balance).toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
                {!hasEnoughBalance && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">Insufficient</Badge>
                )}
                {isWalletProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : hasEnoughBalance ? (
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                ) : null}
              </Button>
              {paymentMethod === "wallet" && wallet && wallet.balance < (application?.application_fee || 0) && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-sm text-amber-800">
                    Insufficient wallet balance. Please add funds or use Paystack.
                  </span>
                </div>
              )}
            </div>

            {/* Back Link */}
            <Link href="/dashboard/reseller/apply">
              <Button variant="ghost" className="w-full border-slate-200 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Application
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
