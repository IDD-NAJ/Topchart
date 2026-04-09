"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Store, 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Copy,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Loader2,
  Tag,
  Eye,
  EyeOff
} from "lucide-react";

interface InventoryItem {
  id: string;
  exam_type: string;
  card_pin: string;
  serial_number: string;
  cost_price: number;
  selling_price: number;
  status: string;
  sold_to: string;
  sold_at: string;
  created_at: string;
}

interface Sale {
  id: string;
  product_type: string;
  network: string;
  customer_phone: string;
  amount: number;
  cost_price: number;
  selling_price: number;
  profit: number;
  status: string;
  created_at: string;
}

interface Stats {
  inventory: {
    available_count: number;
    sold_count: number;
    total_sold_value: number;
  };
  sales: {
    total_sales: number;
    total_profit: number;
    total_revenue: number;
  };
}

export default function ResellerInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState("cards");
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [sellingCard, setSellingCard] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const res = await fetch("/api/reseller/inventory", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory);
        setSales(data.sales);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast.success("PIN copied to clipboard");
  };

  const togglePinVisibility = (id: string) => {
    setShowPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const markAsSold = async (inventoryId: string) => {
    if (!buyerPhone) {
      toast.error("Please enter buyer's phone number");
      return;
    }
    
    try {
      const res = await fetch("/api/reseller/inventory", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, soldTo: buyerPhone })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Card marked as sold");
        setSellingCard(null);
        setBuyerPhone("");
        loadInventory();
      } else {
        toast.error(data.error || "Failed to mark as sold");
      }
    } catch (error) {
      toast.error("Failed to mark as sold");
    }
  };

  const availableCards = inventory.filter(item => item.status === 'available');
  const soldCards = inventory.filter(item => item.status === 'sold');

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
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Inventory</h1>
        <p className="text-muted-foreground">Manage your stock and track sales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventory?.available_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cards Sold</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventory?.sold_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sales?.total_sales || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {parseFloat(String(stats?.sales?.total_profit || 0)).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Result Cards
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales History
          </TabsTrigger>
        </TabsList>

        {/* Cards Tab */}
        <TabsContent value="cards">
          <div className="space-y-4">
            {/* Available Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  Available Cards ({availableCards.length})
                </CardTitle>
                <CardDescription>Cards ready to sell to customers</CardDescription>
              </CardHeader>
              <CardContent>
                {availableCards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2" />
                    <p>No available cards. Purchase cards from the Buy Wholesale page.</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.push("/dashboard/reseller/purchase")}
                    >
                      Buy Cards
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCards.map((card) => (
                      <Card key={card.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{card.exam_type}</Badge>
                            <Badge className="bg-green-100 text-green-700">Available</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">Serial: {card.serial_number}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <code className="flex-1 bg-muted px-2 py-1 rounded text-sm font-mono">
                              {showPins[card.id] ? card.card_pin : '••••••••••••'}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => togglePinVisibility(card.id)}
                            >
                              {showPins[card.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyPin(card.card_pin)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Cost: GHS {parseFloat(String(card.cost_price || 0)).toFixed(2)}</p>
                              <p className="text-sm font-medium">Sell: GHS {parseFloat(String(card.selling_price || 0)).toFixed(2)}</p>
                            </div>
                            {sellingCard === card.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Buyer phone"
                                  value={buyerPhone}
                                  onChange={(e) => setBuyerPhone(e.target.value)}
                                  className="w-32"
                                />
                                <Button size="sm" onClick={() => markAsSold(card.id)}>Sell</Button>
                                <Button size="sm" variant="ghost" onClick={() => setSellingCard(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => setSellingCard(card.id)}
                              >
                                <Tag className="h-4 w-4 mr-1" />
                                Mark Sold
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sold Cards */}
            {soldCards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    Sold Cards ({soldCards.length})
                  </CardTitle>
                  <CardDescription>Cards already sold to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {soldCards.map((card) => (
                      <Card key={card.id} className="border-l-4 border-l-blue-500 opacity-75">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{card.exam_type}</Badge>
                            <Badge className="bg-blue-100 text-blue-700">Sold</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Serial: {card.serial_number}</p>
                          <p className="text-xs text-muted-foreground">Sold to: {card.sold_to}</p>
                          <p className="text-xs text-muted-foreground">
                            Sold on: {new Date(card.sold_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium mt-2">
                            Sold for: GHS {parseFloat(String(card.selling_price || 0)).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Sales History Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sales History
              </CardTitle>
              <CardDescription>All your sales transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                  <p>No sales yet. Start selling to see your history here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-left p-3 text-sm font-medium">Product</th>
                        <th className="text-left p-3 text-sm font-medium">Customer</th>
                        <th className="text-left p-3 text-sm font-medium">Amount</th>
                        <th className="text-left p-3 text-sm font-medium">Profit</th>
                        <th className="text-left p-3 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{new Date(sale.created_at).toLocaleDateString()}</td>
                          <td className="p-3 text-sm">
                            <Badge variant="outline">{sale.product_type}</Badge>
                            {sale.network && <span className="text-xs text-muted-foreground ml-1">({sale.network})</span>}
                          </td>
                          <td className="p-3 text-sm">{sale.customer_phone || '-'}</td>
                          <td className="p-3 text-sm">GHS {parseFloat(String(sale.selling_price || 0)).toFixed(2)}</td>
                          <td className="p-3 text-sm text-green-600">
                            +GHS {parseFloat(String(sale.profit || 0)).toFixed(2)}
                          </td>
                          <td className="p-3 text-sm">
                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                              {sale.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
