"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, Store } from "lucide-react";
import { toast } from "sonner";

type AppStatus = "loading" | "pending" | "approved" | "rejected" | "none";

interface ApplicationData {
  id: string;
  application_status: string;
  business_name: string;
  rejection_reason?: string;
  created_at: string;
  payment_status: string;
}

export default function ResellerStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AppStatus>("loading");
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [paidPending, setPaidPending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/reseller/apply", {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();

      if (!data.success) {
        setStatus("none");
        return;
      }

      if (!data.application) {
        setStatus("none");
        return;
      }

      const app: ApplicationData = data.application;
      setApplication(app);

      const appStatus = app.application_status;
      if (appStatus === "pending") {
        setStatus("pending");
        setPaidPending(app.payment_status === "paid");
      } else if (appStatus === "approved") {
        setStatus("approved");
        setPaidPending(false);
        stopPolling();
        startCountdown();
      } else if (appStatus === "rejected") {
        setStatus("rejected");
        setPaidPending(false);
        stopPolling();
      }
    } catch {
      // silently continue polling
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startCountdown = () => {
    toast.success("Your application was approved!");
    let count = 5;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        router.replace("/dashboard/reseller");
      }
    }, 1000);
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => {
      stopPolling();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <Card className="border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 mt-2">
            {status === "loading" && (
              <Loader2 className="h-14 w-14 animate-spin text-slate-400 mx-auto" />
            )}
            {status === "pending" && (
              <div className="relative inline-flex">
                <Clock className="h-14 w-14 text-amber-500 mx-auto" />
              </div>
            )}
            {status === "approved" && (
              <CheckCircle className="h-14 w-14 text-green-600 mx-auto" />
            )}
            {status === "rejected" && (
              <XCircle className="h-14 w-14 text-red-600 mx-auto" />
            )}
            {status === "none" && (
              <Store className="h-14 w-14 text-slate-400 mx-auto" />
            )}
          </div>

          <CardTitle className="text-xl text-slate-900">
            {status === "loading" && "Checking Application Status"}
            {status === "pending" && "Application Under Review"}
            {status === "approved" && "Application Approved!"}
            {status === "rejected" && "Application Rejected"}
            {status === "none" && "No Application Found"}
          </CardTitle>

          <CardDescription className="mt-1 text-slate-500">
            {status === "loading" && "Please wait..."}
            {status === "pending" && "Your application is being reviewed by our team. This page updates automatically."}
            {status === "approved" && `Congratulations! You are now a Topchart Reseller.`}
            {status === "rejected" && "Unfortunately your application was not approved at this time."}
            {status === "none" && "You haven't submitted a reseller application yet."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {application && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Business</span>
                <span className="font-medium text-slate-900">{application.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment</span>
                <Badge variant={application.payment_status === "paid" ? "default" : "secondary"} className={application.payment_status === "paid" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}>
                  {application.payment_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <Badge
                  variant={
                    application.application_status === "approved"
                      ? "default"
                      : application.application_status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                  className={
                    application.application_status === "approved"
                      ? "bg-slate-900 text-white"
                      : application.application_status === "rejected"
                      ? ""
                      : "bg-slate-100 text-slate-700"
                  }
                >
                  {application.application_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Submitted</span>
                <span className="text-slate-900">{new Date(application.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {status === "pending" && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500 shrink-0" />
              <span>Auto-refreshing every 5 seconds...</span>
            </div>
          )}

          {status === "pending" && paidPending && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Payment is confirmed. Your account approval is being finalized automatically.
            </div>
          )}

          {status === "approved" && (
            <div className="space-y-3">
              <p className="text-sm text-center text-slate-600">
                Redirecting to your reseller dashboard in{" "}
                <span className="font-bold text-slate-900">{countdown}s</span>...
              </p>
              <Button
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => router.replace("/dashboard/reseller")}
              >
                Go to Reseller Dashboard Now
              </Button>
            </div>
          )}

          {status === "rejected" && (
            <div className="space-y-3">
              {application?.rejection_reason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium mb-1">Reason:</p>
                  <p>{application.rejection_reason}</p>
                </div>
              )}
              <Button
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => router.push("/dashboard/reseller/apply")}
              >
                Apply Again
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          )}

          {status === "none" && (
            <Button
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => router.push("/dashboard/reseller/apply")}
            >
              Apply to Become a Reseller
            </Button>
          )}

          {status === "pending" && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100"
                onClick={() => fetchStatus()}
              >
                Refresh Status
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
