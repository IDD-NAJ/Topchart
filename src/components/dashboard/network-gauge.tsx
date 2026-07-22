"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkSales } from "@/lib/actions/dashboard";

interface NetworkCardProps {
  network: NetworkSales;
  index?: number;
}

function getNetworkStyle(network: string): { bg: string; dot: string } {
  if (network.toUpperCase().includes("MTN")) return { bg: "bg-amber-500/10", dot: "bg-amber-500" };
  if (network.toUpperCase().includes("TELECEL")) return { bg: "bg-red-500/10", dot: "bg-red-500" };
  if (network.toUpperCase().includes("AT")) return { bg: "bg-sky-500/10", dot: "bg-sky-500" };
  return { bg: "bg-primary/10", dot: "bg-primary" };
}

export function NetworkGauge({ network, index = 0 }: NetworkCardProps) {
  const isPositive = network.percentageChange >= 0;
  const style = getNetworkStyle(network.network);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card rounded-xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", style.dot)} />
          <span className="text-sm font-semibold text-foreground">{network.network}</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5",
            isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {isPositive ? "+" : ""}{network.percentageChange.toFixed(0)}%
        </div>
      </div>

      <div className={cn("rounded-lg p-4", style.bg)}>
        <p className="text-xs text-muted-foreground mb-1">Today&apos;s Sales</p>
        <p className="text-xl font-bold text-foreground tracking-tight">
          GH₵ {network.sales.toFixed(2)}
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">vs last week</p>
    </motion.div>
  );
}
