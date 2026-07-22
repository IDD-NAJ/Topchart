"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Smartphone, ArrowRight, Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ForeignNumber {
  id: string;
  number: string;
  service_name?: string;
  service_category?: string;
  service_icon?: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  sms_count?: number;
  type?: string;
}

interface ForeignNumbersSectionProps {
  numbers?: ForeignNumber[];
  isLoading?: boolean;
  activeCount?: number;
  totalCount?: number;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  active: { label: "Active", icon: Check, color: "text-success" },
  pending: { label: "Pending", icon: Clock, color: "text-warning" },
  completed: { label: "Completed", icon: Check, color: "text-success" },
  expired: { label: "Expired", icon: AlertCircle, color: "text-muted-foreground" },
};

function ForeignNumbersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForeignNumbersSection({
  numbers = [],
  isLoading = false,
  activeCount = 0,
  totalCount = 0,
}: ForeignNumbersSectionProps) {
  const displayNumbers = numbers.slice(0, 3);
  const hasMore = numbers.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Foreign Verification Numbers
          </h2>
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {activeCount} active · {totalCount} total
            </p>
          )}
        </div>
        <Link
          href="/dashboard/verification"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <ForeignNumbersSkeleton />
      ) : displayNumbers.length > 0 ? (
        <div className="space-y-3">
          {displayNumbers.map((number, idx) => {
            const StatusIcon = statusConfig[number.status]?.icon || Clock;
            const statusColor = statusConfig[number.status]?.color || "text-muted-foreground";
            const statusLabel = statusConfig[number.status]?.label || number.status;

            return (
              <motion.div
                key={number.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {number.number}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap flex-shrink-0">
                        {number.type || "STR"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {number.service_name || "Verification Service"}
                      {number.sms_count && number.sms_count > 0 && ` • ${number.sms_count} SMS`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={cn("flex items-center gap-1 text-xs font-medium", statusColor)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusLabel}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {hasMore && (
            <Link href="/dashboard/verification">
              <Button variant="ghost" className="w-full text-xs h-8">
                View all {numbers.length} numbers <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-dashed border-border p-6 text-center">
          <Smartphone className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-foreground mb-1">No verification numbers yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Buy a foreign verification number to get started
          </p>
          <Link href="/dashboard/verification">
            <Button size="sm" className="text-xs h-8">
              Get a Number
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
