"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/networks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Plus, Wallet } from "lucide-react"
import { FundWalletModal } from "@/components/fund-wallet-modal"

export function WalletCard() {
  const { user } = useAuth()
  const [showBalance, setShowBalance] = useState(true)
  const [fundModalOpen, setFundModalOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative animate-in fade-in slide-in-from-left-4 duration-700 hover:shadow-xl transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Wallet Balance</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-3xl font-bold tracking-tight">
              {showBalance ? formatCurrency(user.walletBalance) : "****"}
            </p>
          </div>
          
          <Button
            onClick={() => setFundModalOpen(true)}
            className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Fund Wallet
          </Button>
        </CardContent>
      </Card>

      <FundWalletModal open={fundModalOpen} onOpenChange={setFundModalOpen} />
    </>
  )
}
