"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gift,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Zap,
  ShoppingBag,
  Gamepad2,
  Music,
  Sparkles,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Step = "catalog" | "confirm" | "processing" | "success" | "failed"

interface GiftCard {
  id: string
  brand: string
  category: string
  region: string
  denominations: number[]
  image: string
}

const CATEGORY_TABS = [
  { id: "entertainment", label: "Entertainment", icon: Music, color: "text-red-600 bg-red-50" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, color: "text-green-600 bg-green-50" },
  { id: "lifestyle", label: "Lifestyle", icon: Sparkles, color: "text-purple-600 bg-purple-50" },
]

const GIFT_CARDS: GiftCard[] = [
  { id: "netflix", brand: "Netflix", category: "entertainment", region: "Global", denominations: [30, 50, 100], image: "🎬" },
  { id: "spotify", brand: "Spotify", category: "entertainment", region: "Global", denominations: [15, 30, 60], image: "🎵" },
  { id: "amazon", brand: "Amazon", category: "shopping", region: "US/Global", denominations: [25, 50, 100, 200], image: "📦" },
  { id: "google-play", brand: "Google Play", category: "shopping", region: "Global", denominations: [10, 25, 50], image: "▶️" },
  { id: "itunes", brand: "Apple/iTunes", category: "shopping", region: "Global", denominations: [15, 25, 50, 100], image: "🍎" },
  { id: "steam", brand: "Steam", category: "gaming", region: "Global", denominations: [20, 50, 100], image: "🎮" },
  { id: "playstation", brand: "PlayStation", category: "gaming", region: "US/EU", denominations: [25, 50, 100], image: "🎯" },
  { id: "xbox", brand: "Xbox", category: "gaming", region: "US/EU", denominations: [25, 50, 100], image: "🟢" },
  { id: "uber", brand: "Uber", category: "lifestyle", region: "Ghana", denominations: [20, 50, 100], image: "🚗" },
  { id: "airbnb", brand: "Airbnb", category: "lifestyle", region: "Global", denominations: [50, 100, 200], image: "🏠" },
]

export default function GiftCardsPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>("catalog")
  const [selectedCategory, setSelectedCategory] = useState("entertainment")
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [giftCode, setGiftCode] = useState("")

  const filteredCards = GIFT_CARDS.filter((c) => c.category === selectedCategory)

  const handleOrder = async () => {
    if (!selectedCard || !selectedDenomination) return
    setStep("processing")
    setError("")

    try {
      const res = await fetch("/api/purchases/giftcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedCard.id,
          denomination: selectedDenomination,
          amount: selectedDenomination,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setGiftCode(data.code || "XXXX-XXXX-XXXX-XXXX")
        setStep("success")
        toast.success("Gift card purchased!")
      } else {
        setStep("failed")
        setError(data.error || "Purchase failed. Please try again.")
        toast.error(data.error || "Purchase failed")
      }
    } catch {
      setStep("failed")
      setError("Network error. Please try again.")
      toast.error("Network error")
    }
  }

  const reset = () => {
    setStep("catalog")
    setSelectedCard(null)
    setSelectedDenomination(null)
    setError("")
    setGiftCode("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {step !== "catalog" && (
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gift Cards</h1>
          <p className="text-muted-foreground">Digital gift cards delivered instantly</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "catalog" && (
          <motion.div key="catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedCategory === tab.id
                        ? "bg-[color:var(--marketing-accent)] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCards.map((card) => (
                <Card
                  key={card.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2",
                    selectedCard?.id === card.id
                      ? "border-[color:var(--marketing-accent)] shadow-md"
                      : "border-transparent hover:border-[color:var(--marketing-accent)]/30"
                  )}
                  onClick={() => {
                    setSelectedCard(card)
                    setSelectedDenomination(card.denominations[0])
                    setStep("confirm")
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{card.image}</span>
                        <div>
                          <CardTitle className="text-base">{card.brand}</CardTitle>
                          <CardDescription className="text-xs">{card.region}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {card.denominations.map((d) => (
                        <Badge key={d} variant="secondary" className="text-xs">₵{d}</Badge>
                      ))}
                    </div>
                    <div className="pt-3 border-t mt-3">
                      <span className="text-sm text-muted-foreground">From </span>
                      <span className="text-lg font-bold text-[color:var(--marketing-accent)]">₵{card.denominations[0]}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === "confirm" && selectedCard && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <Card className="border-2 border-[color:var(--marketing-accent)]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCard.image}</span>
                  {selectedCard.brand} Gift Card
                </CardTitle>
                <CardDescription>Select amount and confirm purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Amount</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedCard.denominations.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDenomination(d)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center font-semibold transition-all",
                          selectedDenomination === d
                            ? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)]/10 text-[color:var(--marketing-accent)]"
                            : "border-muted hover:border-[color:var(--marketing-accent)]/30"
                        )}
                      >
                        ₵{d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Region</span>
                    <p className="font-semibold">{selectedCard.region}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Delivery</span>
                    <p className="font-semibold">Instant (digital code)</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-[color:var(--marketing-accent)]">₵{selectedDenomination}</span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={reset} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleOrder}
                    disabled={!selectedDenomination}
                    className="flex-1 bg-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/90"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Buy Gift Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--marketing-accent)]" />
            <p className="mt-4 text-lg font-medium">Processing your gift card...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </motion.div>
        )}

        {step === "success" && selectedCard && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Gift Card Purchased!</h2>
            <p className="text-muted-foreground mt-1">Your {selectedCard.brand} gift card is ready</p>

            <Card className="mt-6 w-full max-w-md border-2 border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <span className="text-4xl">{selectedCard.image}</span>
                  <p className="font-medium">{selectedCard.brand} Gift Card — ₵{selectedDenomination}</p>
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white border-2 border-dashed border-green-300">
                    <code className="text-lg font-mono font-bold tracking-wider">{giftCode}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(giftCode)
                        toast.success("Code copied!")
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Redeem this code on {selectedCard.brand}</p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={reset} className="mt-6">Buy Another Gift Card</Button>
          </motion.div>
        )}

        {step === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Purchase Failed</h2>
            <p className="text-muted-foreground mt-1">{error}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={reset}>Go Back</Button>
              <Button onClick={handleOrder}>Retry</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
