"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Gift, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard as StatCardType } from "@/lib/actions/dashboard";

interface StatCardProps {
  stat: StatCardType;
  index?: number;
}

function getIcon(label: string) {
  if (label.toLowerCase().includes("order")) return ShoppingCart;
  if (label.toLowerCase().includes("sale")) return DollarSign;
  if (label.toLowerCase().includes("loyal")) return Gift;
  return Briefcase;
}

export function StatCard({ stat, index = 0 }: StatCardProps) {
  const isPositive = stat.percentageChange >= 0;
  const Icon = getIcon(stat.label);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            isPositive
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}{stat.percentageChange.toFixed(1)}%
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{stat.label}</p>
        <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
        {stat.todayValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Today: <span className="font-medium text-foreground">{stat.todayValue}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
