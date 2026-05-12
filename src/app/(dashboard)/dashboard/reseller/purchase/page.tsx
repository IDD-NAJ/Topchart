"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Smartphone, 
  Wifi, 
  GraduationCap,
  Zap,
  Check,
  Loader2,
  Tag,
  Wallet
} from "lucide-react";

interface PricingData {
  discountRate: number;
  resellerCode: string;
  walletBalance: number;
  resultCheckerCards: { exam_type: string; count: number }[];
  networks: { id: string; name: string; color: string }[];
  dataBundles: { id: string; network: string; name: string; size: string; price: number }[];
}

export default function ResellerPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [activeTab, setActiveTab] = useState("data");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<any>(null);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  
  // Data form
  const [dataNetwork, setDataNetwork] = useState("");
  const [dataPhone, setDataPhone] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<string>("");
  
  // Result checker form
  const [examType, setExamType] = useState("WAEC");
  const [cardQuantity, setCardQuantity] = useState("1");

  useEffect(() => {
    loadPricing();
    loadRecentPurchases();
  }, []);

  const loadPricing = async () => {
    try {
      const res = await fetch("/api/reseller/purchase", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setPricing(data);
      }
    } catch (error) {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentPurchases = async () => {
    try {
      const res = await fetch("/api/reseller/purchases?limit=5", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setRecentPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error("Failed to load recent purchases:", error);
    }
  };

  const getDiscountedPrice = (originalPrice: number) => {
    if (!pricing) return originalPrice;
    return originalPrice * (1 - pricing.discountRate / 100);
  };


  const handleDataPurchase = () => {
    if (!dataNetwork || !dataPhone || !selectedBundle) {
      toast.error("Please fill in all fields");
      return;
    }
    const bundle = pricing?.dataBundles.find(b => b.id === selectedBundle);
    if (!bundle) return;
    const networkName = pricing?.networks.find(n => n.id === dataNetwork)?.name || dataNetwork;
    const originalAmount = bundle.price;
    const discountedAmount = getDiscountedPrice(originalAmount);
    
    if (pricing?.walletBalance && discountedAmount > pricing.walletBalance) {
      toast.error(`Insufficient wallet balance. You need GHS ${discountedAmount.toFixed(2)} but have GHS ${pricing.walletBalance.toFixed(2)}`);
      return;
    }
    
    setPendingPurchase({
      type: "data",
      network: dataNetwork,
      networkName,
      phone: dataPhone,
      bundleId: bundle.id,
      bundleName: bundle.size,
      amount: originalAmount,
      discountedAmount,
      discountRate: pricing?.discountRate
    });
    setShowConfirmModal(true);
  };

  const handleCardPurchase = () => {
    const available = pricing?.resultCheckerCards.find(c => c.exam_type === examType)?.count || 0;
    if (parseInt(cardQuantity) > available) {
      toast.error(`Only ${available} cards available`);
      return;
    }
    const quantity = parseInt(cardQuantity);
    const wholesalePrice = 18;
    const retailPrice = 25;
    const totalWholesale = quantity * wholesalePrice;
    const totalRetail = quantity * retailPrice;
    
    if (pricing?.walletBalance && totalWholesale > pricing.walletBalance) {
      toast.error(`Insufficient wallet balance. You need GHS ${totalWholesale.toFixed(2)} but have GHS ${pricing.walletBalance.toFixed(2)}`);
      return;
    }
    
    setPendingPurchase({
      type: "result_checker",
      examType,
      quantity,
      wholesalePrice,
      retailPrice,
      totalWholesale,
      totalRetail,
      savings: totalRetail - totalWholesale
    });
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!pendingPurchase) return;
    setShowConfirmModal(false);
    
    let payload: any = {};
    if (pendingPurchase.type === "data") {
      payload = {
        type: "data",
        network: pendingPurchase.network,
        phone: pendingPurchase.phone,
        bundleId: pendingPurchase.bundleId
      };
    } else if (pendingPurchase.type === "result_checker") {
      payload = {
        type: "result_checker",
        examType: pendingPurchase.examType,
        quantity: pendingPurchase.quantity
      };
    }
    
    await submitPurchase(payload);
  };

  const createIdempotencyKey = () => {
    const globalCrypto = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
    if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
      return globalCrypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const submitPurchase = async (payload: any) => {
    setPurchasing(true);
    try {
      const idempotencyKey = createIdempotencyKey();
      const res = await fetch("/api/reseller/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Purchase completed!");
        await loadPricing();
        await loadRecentPurchases();
        if (payload.type === 'result_checker') {
          router.push("/dashboard/reseller/inventory");
        } else {
          router.push("/dashboard/reseller");
        }
      } else {
        toast.error(data.error || "Purchase failed");
      }
    } catch (error) {
      toast.error("Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0052CC]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="border-slate-200 hover:bg-slate-100" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Buy Wholesale</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Purchase at discounted prices with your {pricing?.discountRate}% reseller discount
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Wallet className="h-5 w-5 text-slate-600" />
          <div>
            <p className="text-xs text-slate-500">Wallet Balance</p>
            <p className="text-lg font-semibold text-slate-900 font-mono">
              GHS {pricing?.walletBalance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger value="data" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wifi className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="h-4 w-4" />
            Exam Cards
          </TabsTrigger>
        </TabsList>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2.5 bg-slate-100 rounded-lg">
                  <Wifi className="h-5 w-5 text-slate-600" />
                </div>
                Buy Data Bundle
              </CardTitle>
              <CardDescription className="text-slate-500">Purchase data bundles at wholesale rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {pricing?.networks.map((network) => (
                  <Button
                    key={network.id}
                    variant={dataNetwork === network.id ? "default" : "outline"}
                    className={`h-16 flex flex-col items-center justify-center ${dataNetwork === network.id ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setDataNetwork(network.id)}
                  >
                    <span className="font-semibold">{network.name}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Phone Number</Label>
                <Input
                  placeholder="e.g., 0241234567"
                  value={dataPhone}
                  onChange={(e) => setDataPhone(e.target.value)}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Select Bundle</Label>
                <div className="grid grid-cols-2 gap-3">
                  {pricing?.dataBundles.filter(b => b.network === dataNetwork).map((bundle) => (
                    <Button
                      key={bundle.id}
                      variant={selectedBundle === bundle.id ? "default" : "outline"}
                      className={`h-20 flex flex-col items-center justify-center ${selectedBundle === bundle.id ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                      onClick={() => setSelectedBundle(bundle.id)}
                    >
                      <span className="font-semibold text-lg">{bundle.size}</span>
                      <span className="text-xs text-slate-600">
                        GHS {getDiscountedPrice(bundle.price).toFixed(2)}
                      </span>
                    </Button>
                  ))}
                  {dataNetwork && pricing?.dataBundles.filter(b => b.network === dataNetwork).length === 0 && (
                    <div className="col-span-2 py-8 text-center text-slate-500 text-sm">
                      No data bundles available for this network
                    </div>
                  )}
                  {!dataNetwork && (
                    <div className="col-span-2 py-8 text-center text-slate-500 text-sm">
                      Please select a network first
                    </div>
                  )}
                </div>
              </div>

              {selectedBundle && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {(() => {
                    const bundle = pricing?.dataBundles.find(b => b.id === selectedBundle);
                    if (!bundle) return null;
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Bundle:</span>
                          <span className="font-medium text-slate-900">{bundle.size}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-slate-600">Original Price:</span>
                          <span className="line-through text-slate-500">GHS {bundle.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium text-slate-900">Your Price ({pricing?.discountRate}% off):</span>
                          <span className="text-lg font-bold text-slate-900">
                            GHS {getDiscountedPrice(bundle.price).toFixed(2)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button 
                className="w-full bg-slate-900 text-white hover:bg-slate-800" 
                size="lg"
                onClick={handleDataPurchase}
                disabled={purchasing || !dataNetwork || !dataPhone || !selectedBundle}
              >
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                Complete Purchase
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Checker Cards Tab */}
        <TabsContent value="cards">
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2.5 bg-slate-100 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-slate-600" />
                </div>
                Buy Result Checker Cards
              </CardTitle>
              <CardDescription className="text-slate-500">Purchase WAEC/BECE scratch cards at wholesale prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-700">Exam Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["WAEC", "BECE", "NOVDEC"].map((type) => {
                    const available = pricing?.resultCheckerCards.find(c => c.exam_type === type)?.count || 0;
                    return (
                      <Button
                        key={type}
                        variant={examType === type ? "default" : "outline"}
                        className={`h-16 flex flex-col items-center justify-center relative ${examType === type ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                        onClick={() => setExamType(type)}
                      >
                        <span className="font-semibold">{type}</span>
                        <Badge variant="secondary" className="text-xs mt-1 bg-slate-200 text-slate-700">
                          {available} available
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max={pricing?.resultCheckerCards.find(c => c.exam_type === examType)?.count || 1}
                  value={cardQuantity}
                  onChange={(e) => setCardQuantity(e.target.value)}
                  className="border-slate-300"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Cards:</span>
                  <span className="font-medium text-slate-900">{cardQuantity} x {examType}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-slate-900">Your Price (Wholesale):</span>
                  <span className="text-lg font-bold text-slate-900">
                    GHS {(parseInt(cardQuantity) * 18).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-slate-600">Retail Value:</span>
                  <span className="line-through text-slate-500">GHS {(parseInt(cardQuantity) * 25).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-slate-900">
                  <span className="text-sm font-medium">You Save:</span>
                  <span className="font-medium">GHS {(parseInt(cardQuantity) * 7).toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-slate-900 text-white hover:bg-slate-800" 
                size="lg"
                onClick={handleCardPurchase}
                disabled={purchasing || !cardQuantity}
              >
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                Buy Cards
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Cards will be added to your inventory immediately after purchase
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Purchases */}
      {recentPurchases.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900">Recent Purchases</CardTitle>
            <CardDescription className="text-slate-500">Your latest wholesale purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPurchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-100 rounded-lg">
                      {purchase.product_type === 'data' && <Wifi className="h-5 w-5 text-slate-600" />}
                      {purchase.product_type === 'result_checker' && <GraduationCap className="h-5 w-5 text-slate-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{purchase.product_type.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">
                        {purchase.customer_phone && `To: ${purchase.customer_phone}`}
                        {purchase.network && ` • ${purchase.network}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 font-mono">GHS {purchase.amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Confirm Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pendingPurchase?.type === "data" && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium text-slate-900">Data Bundle</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Network:</span>
                  <span className="font-medium text-slate-900">{pendingPurchase.networkName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Phone:</span>
                  <span className="font-medium text-slate-900">{pendingPurchase.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Bundle:</span>
                  <span className="font-medium text-slate-900">{pendingPurchase.bundleName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Original Price:</span>
                  <span className="font-medium text-slate-500 line-through">GHS {pendingPurchase.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Discount ({pendingPurchase.discountRate}%):</span>
                  <span className="font-medium text-slate-900">GHS {(pendingPurchase.amount - pendingPurchase.discountedAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-900 font-semibold">Total to Pay:</span>
                  <span className="text-lg font-bold text-slate-900">GHS {pendingPurchase.discountedAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            {pendingPurchase?.type === "result_checker" && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium text-slate-900">Result Checker Cards</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Exam:</span>
                  <span className="font-medium text-slate-900">{pendingPurchase.examType}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Quantity:</span>
                  <span className="font-medium text-slate-900">{pendingPurchase.quantity} cards</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Wholesale Price:</span>
                  <span className="font-medium text-slate-900">GHS {pendingPurchase.totalWholesale.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Retail Value:</span>
                  <span className="font-medium text-slate-500 line-through">GHS {pendingPurchase.totalRetail.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-900 font-semibold">Total to Pay:</span>
                  <span className="text-lg font-bold text-slate-900">GHS {pendingPurchase.totalWholesale.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={confirmPurchase}
              disabled={purchasing}
            >
              {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
