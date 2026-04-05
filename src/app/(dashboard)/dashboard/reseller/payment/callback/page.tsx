"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  const reference = searchParams.get("reference");
  const applicationId = searchParams.get("application_id");

  useEffect(() => {
    if (reference && applicationId) {
      verifyPayment();
    } else {
      setStatus("failed");
      setMessage("Invalid payment callback - missing reference");
    }
  }, [reference, applicationId]);

  const verifyPayment = async () => {
    try {
      const res = await fetch("/api/reseller/payment/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, application_id: applicationId }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("Payment successful! Your reseller application has been submitted.");
        toast.success("Payment verified successfully");
      } else {
        setStatus("failed");
        setMessage(data.error || "Payment verification failed");
        toast.error(data.error || "Payment verification failed");
      }
    } catch (error) {
      setStatus("failed");
      setMessage("Network error while verifying payment");
      toast.error("Network error");
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-[#006994] mx-auto" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            )}
            {status === "failed" && (
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            )}
          </div>
          <CardTitle>
            {status === "loading" && "Processing Payment"}
            {status === "success" && "Payment Successful"}
            {status === "failed" && "Payment Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Your application is now pending admin review. You will be notified once approved.
              </p>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = "/dashboard/reseller"}
              >
                Go to Reseller Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {status === "failed" && (
            <>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.location.href = "/dashboard/reseller/apply"}
              >
                Try Again
              </Button>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = "/dashboard"}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
