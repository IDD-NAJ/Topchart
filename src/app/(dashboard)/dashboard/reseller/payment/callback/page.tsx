"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  const reference = searchParams.get("reference");
  const applicationId = searchParams.get("application_id");

  useEffect(() => {
    if (reference) {
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
        body: JSON.stringify({ reference, application_id: applicationId || undefined }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("Payment verified. Redirecting to your reseller status...");
        toast.success("Payment verified successfully");
        setTimeout(() => {
          router.replace("/dashboard/reseller/status");
        }, 800);
      } else {
        setStatus("failed");
        setMessage(data.error || "Payment verification failed");
        toast.error(data.error || "Payment verification failed");
      }
    } catch {
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
              <Loader2 className="h-12 w-12 animate-spin text-[#0052CC] mx-auto" />
            )}
            {status === "success" && (
              <Loader2 className="h-12 w-12 animate-spin text-[#0052CC] mx-auto" />
            )}
            {status === "failed" && (
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            )}
          </div>
          <CardTitle>
            {status === "failed" ? "Payment Failed" : "Processing Payment"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "failed" && (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(
                    applicationId
                      ? `/dashboard/reseller/payment?application_id=${encodeURIComponent(applicationId)}`
                      : "/dashboard/reseller/status"
                  )
                }
              >
                Try Again
              </Button>
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
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
