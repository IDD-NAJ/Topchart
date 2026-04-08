"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  CreditCard, 
  Upload, 
  Trash2,
  RefreshCw,
  Plus
} from "lucide-react";

interface ResultCard {
  id: string;
  exam_type: string;
  card_pin: string;
  serial_number: string;
  status: string;
  selling_price: number;
  wholesale_price: number;
  expiry_date: string;
  purchased_by_email: string | null;
}

interface Stats {
  exam_type: string;
  status: string;
  count: number;
}

export default function AdminResultCheckersPage() {
  const [cards, setCards] = useState<ResultCard[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkInput, setBulkInput] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const res = await fetch("/api/admin/result-checkers", {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setCards(data.cards);
        setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load cards");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!bulkInput.trim()) {
      toast.error("Please enter card data");
      return;
    }

    setImporting(true);
    try {
      // Parse CSV format: exam_type,card_pin,serial_number,selling_price,expiry_date
      const lines = bulkInput.trim().split("\n");
      const cards = lines.map(line => {
        const [exam_type, card_pin, serial_number, selling_price, expiry_date] = line.split(",");
        return {
          exam_type: exam_type?.trim(),
          card_pin: card_pin?.trim(),
          serial_number: serial_number?.trim(),
          selling_price: parseFloat(selling_price),
          expiry_date: expiry_date?.trim() || null
        };
      }).filter(c => c.exam_type && c.card_pin);

      const res = await fetch("/api/admin/result-checkers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success(`Imported ${data.inserted} cards`);
        setBulkInput("");
        loadCards();
      } else {
        toast.error(data.error || "Failed to import");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      const res = await fetch(`/api/admin/result-checkers?id=${cardId}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Card deleted");
        loadCards();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Group stats by exam type
  const statsByExam = stats.reduce((acc, stat) => {
    if (!acc[stat.exam_type]) {
      acc[stat.exam_type] = {};
    }
    acc[stat.exam_type][stat.status] = stat.count;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006994]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Result Checker Management</h1>
        <Button variant="outline" onClick={loadCards}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(statsByExam).map(([examType, statuses]) => (
          <Card key={examType}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{examType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{statuses.available || 0}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{statuses.sold || 0}</p>
                  <p className="text-xs text-muted-foreground">Sold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Import */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Bulk Import Cards</CardTitle>
          </div>
          <CardDescription>
            Enter card data in CSV format: exam_type, card_pin, serial_number, selling_price, expiry_date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="WAEC,1234567890,SN123456,50.00,2025-12-31&#10;NECO,0987654321,SN654321,45.00,2025-12-31"
              className="w-full h-32 border rounded-md p-3 font-mono text-sm"
            />
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="w-full"
            >
              {importing ? "Importing..." : "Import Cards"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards List */}
      <Card>
        <CardHeader>
          <CardTitle>All Cards</CardTitle>
          <CardDescription>Manage result checker cards inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Exam Type</th>
                  <th className="text-left p-3">PIN</th>
                  <th className="text-left p-3">Serial</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Purchased By</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.slice(0, 50).map((card) => (
                  <tr key={card.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <Badge variant="outline">{card.exam_type}</Badge>
                    </td>
                    <td className="p-3 font-mono text-sm">
                      {card.status === 'available' ? '••••••••••' : card.card_pin}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {card.serial_number || '-'}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">GHS {card.selling_price}</p>
                        <p className="text-xs text-muted-foreground">
                          Wholesale: GHS {card.wholesale_price}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={card.status === 'available' ? 'default' : 
                                card.status === 'sold' ? 'secondary' : 'outline'}
                      >
                        {card.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {card.purchased_by_email || '-'}
                    </td>
                    <td className="p-3">
                      {card.status !== 'sold' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(card.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
