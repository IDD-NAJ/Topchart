"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Tag
} from "lucide-react";

interface PricingData {
  discountRate: number;
  resellerCode: string;
  resultCheckerCards: { exam_type: string; count: number }[];
  networks: { id: string; name: string; color: string }[];
  dataBundles: { id: string; name: string; size: string; price: number }[];
}

export default function ResellerPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [activeTab, setActiveTab] = useState("airtime");
  
  // Airtime form
  const [airtimeNetwork, setAirtimeNetwork] = useState("");
  const [airtimePhone, setAirtimePhone] = useState("");
  const [airtimeAmount, setAirtimeAmount] = useState("");
  
  // Data form
  const [dataNetwork, setDataNetwork] = useState("");
  const [dataPhone, setDataPhone] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<string>("");
  
  // Result checker form
  const [examType, setExamType] = useState("WAEC");
  const [cardQuantity, setCardQuantity] = useState("1");

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const res = await fetch("/api/reseller/purchase", { credentials: "include" });
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

  const getDiscountedPrice = (originalPrice: number) => {
    if (!pricing) return originalPrice;
    return originalPrice * (1 - pricing.discountRate / 100);
  };

  const handleAirtimePurchase = async () => {
    if (!airtimeNetwork || !airtimePhone || !airtimeAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    await submitPurchase({
      type: "airtime",
      network: airtimeNetwork,
      phone: airtimePhone,
      amount: parseFloat(airtimeAmount)
    });
  };

  const handleDataPurchase = async () => {
    if (!dataNetwork || !dataPhone || !selectedBundle) {
      toast.error("Please fill in all fields");
      return;
    }
    const bundle = pricing?.dataBundles.find(b => b.id === selectedBundle);
    if (!bundle) return;
    await submitPurchase({
      type: "data",
      network: dataNetwork,
      phone: dataPhone,
      bundleId: bundle.id,
      bundlePrice: bundle.price
    });
  };

  const handleCardPurchase = async () => {
    const available = pricing?.resultCheckerCards.find(c => c.exam_type === examType)?.count || 0;
    if (parseInt(cardQuantity) > available) {
      toast.error(`Only ${available} cards available`);
      return;
    }
    await submitPurchase({
      type: "result_checker",
      examType,
      quantity: parseInt(cardQuantity)
    });
  };

  const submitPurchase = async (payload: any) => {
    setPurchasing(true);
    try {
      const res = await fetch("/api/reseller/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Purchase completed!");
        router.push("/dashboard/reseller/inventory");
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
          <Loader2 className="h-8 w-8 animate-spin text-[#006994]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Buy Wholesale</h1>
        <p className="text-muted-foreground">
          Purchase at discounted prices with your {pricing?.discountRate}% reseller discount
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="airtime" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Airtime
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Exam Cards
          </TabsTrigger>
        </TabsList>

        {/* Airtime Tab */}
        <TabsContent value="airtime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Buy Airtime
              </CardTitle>
              <CardDescription>Top up any phone number at wholesale rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {pricing?.networks.map((network) => (
                  <Button
                    key={network.id}
                    variant={airtimeNetwork === network.id ? "default" : "outline"}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setAirtimeNetwork(network.id)}
                  >
                    <span className="font-semibold">{network.name}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="e.g., 0241234567"
                  value={airtimePhone}
                  onChange={(e) => setAirtimePhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (GHS)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={airtimeAmount}
                  onChange={(e) => setAirtimeAmount(e.target.value)}
                />
              </div>

              {airtimeAmount && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Original Price:</span>
                    <span className="line-through">GHS {parseFloat(airtimeAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium">Your Price ({pricing?.discountRate}% off):</span>
                    <span className="text-lg font-bold text-green-600">
                      GHS {getDiscountedPrice(parseFloat(airtimeAmount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAirtimePurchase}
                disabled={purchasing || !airtimeNetwork || !airtimePhone || !airtimeAmount}
              >
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                Complete Purchase
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-blue-500" />
                Buy Data Bundle
              </CardTitle>
              <CardDescription>Purchase data bundles at wholesale rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {pricing?.networks.map((network) => (
                  <Button
                    key={network.id}
                    variant={dataNetwork === network.id ? "default" : "outline"}
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => setDataNetwork(network.id)}
                  >
                    <span className="font-semibold">{network.name}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="e.g., 0241234567"
                  value={dataPhone}
                  onChange={(e) => setDataPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Bundle</Label>
                <div className="grid grid-cols-2 gap-3">
                  {pricing?.dataBundles.map((bundle) => (
                    <Button
                      key={bundle.id}
                      variant={selectedBundle === bundle.id ? "default" : "outline"}
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => setSelectedBundle(bundle.id)}
                    >
                      <span className="font-semibold text-lg">{bundle.size}</span>
                      <span className="text-xs text-muted-foreground">
                        GHS {getDiscountedPrice(bundle.price).toFixed(2)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedBundle && (
                <div className="p-4 bg-muted rounded-lg">
                  {(() => {
                    const bundle = pricing?.dataBundles.find(b => b.id === selectedBundle);
                    if (!bundle) return null;
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Bundle:</span>
                          <span className="font-medium">{bundle.size}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-muted-foreground">Original Price:</span>
                          <span className="line-through">GHS {bundle.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium">Your Price ({pricing?.discountRate}% off):</span>
                          <span className="text-lg font-bold text-green-600">
                            GHS {getDiscountedPrice(bundle.price).toFixed(2)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button 
                className="w-full" 
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-500" />
                Buy Result Checker Cards
              </CardTitle>
              <CardDescription>Purchase WAEC/BECE scratch cards at wholesale prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["WAEC", "BECE", "NOVDEC"].map((type) => {
                    const available = pricing?.resultCheckerCards.find(c => c.exam_type === type)?.count || 0;
                    return (
                      <Button
                        key={type}
                        variant={examType === type ? "default" : "outline"}
                        className="h-16 flex flex-col items-center justify-center relative"
                        onClick={() => setExamType(type)}
                      >
                        <span className="font-semibold">{type}</span>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {available} available
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max={pricing?.resultCheckerCards.find(c => c.exam_type === examType)?.count || 1}
                  value={cardQuantity}
                  onChange={(e) => setCardQuantity(e.target.value)}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cards:</span>
                  <span className="font-medium">{cardQuantity} x {examType}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium">Your Price (Wholesale):</span>
                  <span className="text-lg font-bold text-green-600">
                    GHS {(parseInt(cardQuantity) * 18).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Retail Value:</span>
                  <span className="line-through">GHS {(parseInt(cardQuantity) * 25).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-green-600">
                  <span className="text-sm font-medium">You Save:</span>
                  <span className="font-medium">GHS {(parseInt(cardQuantity) * 7).toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCardPurchase}
                disabled={purchasing || !cardQuantity}
              >
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                Buy Cards
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Cards will be added to your inventory immediately after purchase
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
