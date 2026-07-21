"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/networks";
import { ServiceGuard } from "@/components/service-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { trackAdsPurchase } from "@/lib/ads";
import { motion } from "framer-motion";
import {
  CreditCard,
  Loader2,
  Copy,
  CheckCircle,
  Search,
  History,
  Info,
  ExternalLink,
  Wallet,
  ShoppingCart,
  GraduationCap,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { ResultCheckerServiceSchema } from "./schema";

interface ResultCard {
  id: string;
  examType: string;
  price: number;
  wholesalePrice: number;
  status: string;
}

interface PurchasedCard {
  id: string;
  exam_type: string;
  card_pin: string;
  serial_number: string;
  amount_paid: number;
  created_at: string;
}

const examInfo: Record<string, { name: string; url: string; instructions: string[]; color: string }> = {
  WAEC: {
    name: "WAEC",
    url: "https://www.waecdirect.org",
    instructions: ["Visit www.waecdirect.org", "Enter your 10-digit Examination Number", "Select Exam Year and Type", "Enter PIN and Serial Number"],
    color: "text-blue-600 bg-blue-50"
  },
  NECO: {
    name: "NECO",
    url: "https://result.neco.gov.ng",
    instructions: ["Visit result.neco.gov.ng", "Select Exam Year and Type", "Enter Token (PIN)"],
    color: "text-green-600 bg-green-50"
  },
  JAMB: {
    name: "JAMB",
    url: "https://www.jamb.gov.ng",
    instructions: ["Visit www.jamb.gov.ng", "Click 'Check UTME Result'", "Enter Registration Number and PIN"],
    color: "text-purple-600 bg-purple-50"
  },
  NABTEB: {
    name: "NABTEB",
    url: "https://www.nabteb.gov.ng",
    instructions: ["Visit www.nabteb.gov.ng", "Click 'Result Checking'", "Enter Candidate Number, PIN, and Year"],
    color: "text-orange-600 bg-orange-50"
  }
};

export default function ResultCheckersPage() {
  const { user, refreshUser } = useAuth();
  const [cards, setCards] = useState<ResultCard[]>([]);
  const [purchases, setPurchases] = useState<PurchasedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("buy");

  useEffect(() => {
    loadCards();
    const stored = localStorage.getItem("resultCheckerPurchases");
    if (stored) setPurchases(JSON.parse(stored));
  }, []);

  const savePurchase = (purchase: PurchasedCard) => {
    const updated = [purchase, ...purchases];
    setPurchases(updated);
    localStorage.setItem("resultCheckerPurchases", JSON.stringify(updated));
  };

  const loadCards = async () => {
    try {
      const res = await fetch("/api/result-checkers", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setCards(data.cards);
      }
    } catch (error) {
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const walletBalance = user?.walletBalance || 0;
    if (walletBalance < card.price) {
      toast.error(
        <div className="flex flex-col gap-2">
          <span>Insufficient balance</span>
          <Link href="/dashboard/wallet">
            <Button size="sm" variant="outline">Fund Wallet</Button>
          </Link>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    setPurchasing(cardId);
    try {
      const res = await fetch("/api/result-checkers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: cardId })
      });

      const data = await res.json();

      if (data.success) {
        try {
          trackAdsPurchase(String(data.purchase?.id || cardId), {
            value: data.purchase?.amount_paid,
            currency: "GHS",
          })
        } catch {}
        toast.success("Purchase successful!");
        savePurchase({
          id: data.card.id,
          exam_type: data.card.examType,
          card_pin: data.card.pin,
          serial_number: data.card.serialNumber,
          amount_paid: data.purchase.amount_paid,
          created_at: new Date().toISOString()
        });
        refreshUser();
        loadCards();
        setActiveTab("history");
      } else {
        toast.error(data.error || "Purchase failed");
        refreshUser();
      }
    } catch (error) {
      toast.error("Network error");
      refreshUser();
    } finally {
      setPurchasing(null);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    toast.success("PIN copied to clipboard");
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const copySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    toast.success("Serial copied");
  };

  const filteredCards = cards.filter(c => 
    (selectedExamType === "all" || c.examType === selectedExamType) &&
    c.examType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const examTypes = [...new Set(cards.map(c => c.examType))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ServiceGuard serviceKey="result_checker">
    <ResultCheckerServiceSchema />
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Result Checker Cards</h1>
          <p className="text-muted-foreground mt-1">Purchase exam result checker cards instantly</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="bg-[#0052CC]/5">
            <CardContent className="py-2 px-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#0052CC]" />
              <span className="font-medium">{formatCurrency(user?.walletBalance || 0)}</span>
            </CardContent>
          </Card>
          <Link href="/dashboard/wallet">
            <Button variant="outline" size="sm">Fund Wallet</Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Buy Cards
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History {purchases.length > 0 && <Badge variant="secondary">{purchases.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search exam types..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {examTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6">
            {examTypes.map(type => {
              const typeCards = filteredCards.filter(c => c.examType === type);
              if (typeCards.length === 0) return null;
              
              const card = typeCards[0];
              const info = examInfo[type] || { name: type, url: "#", instructions: [], color: "text-gray-600 bg-gray-50" };
              
              return (
                <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="overflow-hidden">
                    <CardHeader className={`${info.color} border-b`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="h-6 w-6" />
                          <div>
                            <CardTitle>{info.name}</CardTitle>
                            <CardDescription>{typeCards.length} cards available</CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-lg">{formatCurrency(card.price)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {user?.role === "RESELLER" && card.wholesalePrice && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800">
                                <span className="font-semibold">Wholesale:</span> {formatCurrency(card.wholesalePrice)}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Save {formatCurrency(card.price - card.wholesalePrice)} per card
                              </p>
                            </div>
                          )}
                          <Button size="lg" className="w-full" onClick={() => handlePurchase(card.id)} disabled={purchasing === card.id}>
                            {purchasing === card.id ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : <><CreditCard className="h-4 w-4 mr-2" />Buy Now</>}
                          </Button>
                          {(user?.walletBalance || 0) < card.price && <p className="text-sm text-red-600 text-center">Insufficient balance. <Link href="/dashboard/wallet" className="underline">Fund wallet</Link></p>}
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4" />How to Check Result</h4>
                          <ol className="space-y-2 text-sm">
                            {info.instructions.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0052CC]/10 text-[#0052CC] text-xs font-medium flex items-center justify-center">{idx + 1}</span>
                                <span className="text-muted-foreground">{step}</span>
                              </li>
                            ))}
                          </ol>
                          <a href={info.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#0052CC] hover:underline">
                            Visit Official Website <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cards available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No purchases yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("buy")}>Buy Your First Card</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => {
                const info = examInfo[purchase.exam_type] || examInfo["WAEC"];
                return (
                  <motion.div key={purchase.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className={`p-6 ${info.color} md:w-48 flex-shrink-0`}>
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="h-5 w-5" />
                              <span className="font-semibold">{purchase.exam_type}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{formatCurrency(purchase.amount_paid)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(purchase.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex-1 p-6">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase">Card PIN</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="flex-1 p-2 bg-muted rounded text-lg font-mono">{purchase.card_pin}</code>
                                  <Button variant="outline" size="sm" onClick={() => copyPin(purchase.card_pin)}>
                                    {copiedPin === purchase.card_pin ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              {purchase.serial_number && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase">Serial Number</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 p-2 bg-muted rounded font-mono">{purchase.serial_number}</code>
                                    <Button variant="outline" size="sm" onClick={() => copySerial(purchase.serial_number)}><Copy className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                              <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0052CC] hover:underline flex items-center gap-1">
                                Check Result Now <ExternalLink className="h-3 w-3" />
                              </a>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm"><Info className="h-4 w-4 mr-2" />How to Use</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />{purchase.exam_type} Instructions</DialogTitle>
                                  </DialogHeader>
                                  <ol className="space-y-3 mt-4">
                                    {info.instructions.map((step, idx) => (
                                      <li key={idx} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0052CC] text-white text-xs font-medium flex items-center justify-center">{idx + 1}</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" />Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I use the result checker card?</AccordionTrigger>
              <AccordionContent>
                After purchasing, you will receive a PIN and Serial Number. Visit the official exam board website, enter your examination details along with the PIN and Serial Number to access your results.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What if my PIN doesn't work?</AccordionTrigger>
              <AccordionContent>
                If your PIN doesn't work, please contact our support team immediately with your purchase details. We will verify the PIN and provide a replacement if necessary.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I get a refund?</AccordionTrigger>
              <AccordionContent>
                Result checker cards are digital products and cannot be refunded once purchased. However, if you receive an invalid PIN, we will replace it free of charge.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
    </ServiceGuard>
  );
}
