"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Smartphone,
  QrCode,
  Copy
} from "lucide-react";
import Image from "next/image";

interface UserDataOrder {
  id: string;
  product_name: string;
  country: string;
  region: string | null;
  data_volume: string;
  validity_days: number;
  total_amount: string;
  status: string;
  activation_code: string | null;
  qr_code_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function UserEsimTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<UserDataOrder[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/esim/orders");
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        } else {
          toast.error(data.error || "Failed to load orders");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Activation code copied to clipboard!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/esim">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">eSIM Tracker</h1>
            <p className="text-muted-foreground">Track your Travel Data eSIM purchases</p>
          </div>
        </div>
        <Link href="/dashboard/esim">
           <Button variant="outline" className="shrink-0 bg-background">Buy New eSIM</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No active eSIMs</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">You haven't purchased any Travel Data eSIMs yet.</p>
            <Link href="/dashboard/esim">
              <Button>Browse Packages</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
             <Card key={order.id} className="overflow-hidden border-2 border-emerald-100">
               <div className="flex flex-col md:flex-row">
                 <div className="p-6 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r bg-emerald-50/20">
                   <div className="flex justify-between items-start mb-4">
                      <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'failed' ? 'destructive' :
                        order.status === 'processing' ? 'secondary' : 'outline'
                      } className="capitalize px-3 py-1 text-xs">
                         {order.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                         {order.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                         {(order.status === "pending" || order.status === "processing") && <Clock className="h-3 w-3 mr-1" />}
                         {order.status}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">#{order.id.split('-')[0]}</span>
                   </div>
                   
                   <h2 className="text-2xl font-bold flex items-center gap-2">
                     {order.country}
                   </h2>
                   <p className="text-muted-foreground flex items-center gap-2 mb-6">
                     <Globe className="h-4 w-4" /> {order.product_name} {order.region && `(${order.region})`}
                   </p>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Data</p>
                        <p className="font-semibold">{order.data_volume}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Validity</p>
                        <p className="font-semibold">{order.validity_days} Days</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Cost</p>
                        <p className="font-semibold text-emerald-600">₵{order.total_amount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Purchased</p>
                        <p className="font-medium text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                 </div>

                 <div className="p-6 md:w-1/3 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
                    {order.status === "completed" ? (
                      <div className="text-center w-full space-y-4">
                        {order.qr_code_url ? (
                           <div className="mx-auto rounded-xl overflow-hidden border-4 shadow-sm w-40 h-40 relative flex items-center justify-center bg-white p-2">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={order.qr_code_url} alt="eSIM QR Code" className="w-full h-full object-contain" />
                           </div>
                        ) : (
                           <div className="mx-auto rounded-xl border-dashed border-2 w-32 h-32 flex flex-col items-center justify-center text-muted-foreground">
                              <QrCode className="h-8 w-8 mb-2" />
                              <span className="text-xs">No QR</span>
                           </div>
                        )}
                        
                        {order.activation_code ? (
                           <div className="w-full">
                             <p className="text-xs text-muted-foreground mb-2">Or use Activation Code:</p>
                             <div className="flex bg-muted/50 p-1.5 rounded-lg border items-center">
                               <p className="text-xs font-mono truncate flex-1 px-2">{order.activation_code}</p>
                               <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(order.activation_code!)}>
                                 <Copy className="h-3 w-3" />
                               </Button>
                             </div>
                           </div>
                        ) : (
                           <div className="text-center text-sm pt-2">
                             <p className="font-semibold">Ready to install</p>
                             <p className="text-xs text-muted-foreground mt-1">Scan to activate eSIM</p>
                           </div>
                        )}
                      </div>
                    ) : order.status === "failed" ? (
                      <div className="text-center text-muted-foreground">
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-3" />
                        <p className="font-medium text-foreground">Activation Failed</p>
                        <p className="text-sm mt-1">Please contact support for a refund or retry.</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground space-y-3">
                        <div className="h-16 w-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                           <Clock className="h-8 w-8 text-amber-500" />
                        </div>
                        <p className="font-medium text-foreground">Processing Order</p>
                        <p className="text-sm">We are generating your eSIM profile. This takes a few minutes.</p>
                      </div>
                    )}
                 </div>
               </div>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}
