"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Transaction } from "@/lib/actions/dashboard";

interface TransactionsTableProps {
  transactions: Transaction[];
}

function NetworkBadge({ network }: { network: string }) {
  const upper = network.toUpperCase();
  const cls = upper.includes("MTN")
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    : upper.includes("TELECEL")
      ? "bg-red-500/10 text-red-700 dark:text-red-400"
      : upper.includes("AT")
        ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
        : "bg-muted text-muted-foreground";

  let label = network.substring(0, 6).toUpperCase();
  if (upper.includes("MTN")) label = "MTN";
  else if (upper.includes("TELECEL")) label = "TC";
  else if (upper.includes("AT BIG")) label = "AT-B";
  else if (upper.includes("AT")) label = "AT";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", cls)}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const cls =
    lower === "completed" || lower === "success"
      ? "bg-success/10 text-success"
      : lower === "pending"
        ? "bg-warning/10 text-warning"
        : "bg-destructive/10 text-destructive";

  const label = lower === "completed" ? "Completed" : lower === "success" ? "Success" : lower.charAt(0).toUpperCase() + lower.slice(1);

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", cls)}>
      {label}
    </span>
  );
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Order
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Package
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                Network
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Date
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx, i) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{tx.orderId}</td>
                <td className="px-5 py-3.5 font-medium text-foreground">{tx.package}</td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <NetworkBadge network={tx.network} />
                </td>
                <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                  {formatDate(tx.createdAt)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                  GH₵ {parseFloat(String(tx.amount ?? 0)).toFixed(2)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
