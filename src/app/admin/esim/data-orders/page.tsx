"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  QrCode
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataOrder {
  id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  product_name: string;
  data_volume: string;
  country: string;
  validity_days: number;
  total_amount: string;
  status: string;
  created_at: string;
}

export default function AdminDataOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DataOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fulfill Modal State
  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [fulfillingOrder, setFulfillingOrder] = useState<DataOrder | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [processingStatus, setProcessingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/esim/orders${query}`);
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

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const updateOrderStatus = async (id: string, action: string) => {
    try {
      setProcessingStatus(true);
      const res = await fetch(`/api/admin/esim/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${action}ed successfully`);
        fetchOrders();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingStatus(false);
    }
  };

  const submitFulfillment = async () => {
    if (!fulfillingOrder) return;
    if (!qrCodeUrl && !activationCode) {
      toast.error("Please provide at least a QR code URL or an Activation code");
      return;
    }

    try {
      setProcessingStatus(true);
      const res = await fetch(`/api/admin/esim/orders/${fulfillingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "complete",
          qr_code_url: qrCodeUrl,
          activation_code: activationCode
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order fulfilled and completed!");
        setIsFulfillOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || "Fulfillment failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingStatus(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/esim">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Data eSIM Orders</h1>
          <p className="text-muted-foreground">Manage and dispatch travel data eSIMs to users</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2 border rounded-md bg-muted/50 p-1">
              {['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 text-sm font-medium rounded-sm capitalize transition-colors ${statusFilter === tab ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setStatusFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No orders found for this status.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="font-medium text-left p-4">User</th>
                  <th className="font-medium text-left p-4">Product</th>
                  <th className="font-medium text-left p-4">Specs</th>
                  <th className="font-medium text-left p-4">Amount</th>
                  <th className="font-medium text-left p-4">Status</th>
                  <th className="font-medium text-right p-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">{order.first_name || 'N/A'} {order.last_name || ''}</p>
                      <p className="text-xs text-muted-foreground">{order.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{order.product_name}</p>
                      <p className="text-xs text-muted-foreground">{order.country}</p>
                    </td>
                    <td className="p-4 text-xs">
                      {order.data_volume} / {order.validity_days} Days
                    </td>
                    <td className="p-4 font-semibold text-primary">
                      ₵{order.total_amount}
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'failed' ? 'destructive' :
                        order.status === 'processing' ? 'secondary' : 'outline'
                      } className="capitalize">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 leading-none" disabled={processingStatus}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'process')}>
                              Mark as Processing
                            </DropdownMenuItem>
                          )}
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <DropdownMenuItem onClick={() => {
                              setFulfillingOrder(order);
                              setQrCodeUrl("");
                              setActivationCode("");
                              setIsFulfillOpen(true);
                            }}>
                              Fulfill Order (Complete)
                            </DropdownMenuItem>
                          )}
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => updateOrderStatus(order.id, 'fail')}>
                              Mark as Failed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFulfillOpen} onOpenChange={setIsFulfillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill eSIM Order</DialogTitle>
            <DialogDescription>
              Provide the destination user with their new eSIM QR code or activation string.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>QR Code Image URL (Recommended)</Label>
              <Input 
                value={qrCodeUrl} 
                onChange={(e) => setQrCodeUrl(e.target.value)}
                placeholder="https://provider.com/images/qr/..."
              />
            </div>
            <div className="flex items-center gap-4 px-2">
              <div className="flex-1 h-px bg-muted"></div>
              <span className="text-muted-foreground text-xs font-semibold">AND / OR</span>
              <div className="flex-1 h-px bg-muted"></div>
            </div>
            <div className="space-y-2">
              <Label>Activation Code (Manual entry)</Label>
              <textarea 
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={activationCode} 
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="LPA:1$..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFulfillOpen(false)}>Cancel</Button>
            <Button onClick={submitFulfillment} disabled={processingStatus}>
              {processingStatus && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Complete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
