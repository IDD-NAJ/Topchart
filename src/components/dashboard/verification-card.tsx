"use client";

import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VerificationCardProps {
  verificationNumber: string;
  index?: number;
}

export function VerificationCard({ verificationNumber, index = 0 }: VerificationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(verificationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <span className="text-sm font-bold">#</span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200",
            copied
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}
          title="Copy verification number"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">Verification Number</p>
        <p className="text-xl font-bold text-foreground tracking-tight font-mono break-all">
          {verificationNumber}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Share for referrals & support</p>
      </div>
    </motion.div>
  );
}
