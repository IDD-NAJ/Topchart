"use client";

import { cn } from "@/lib/utils";
import { RecentRecipient, formatPhoneNumber, GHANA_NETWORKS } from "@/lib/purchase-data";
import { History, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentRecipientsProps {
  recipients: RecentRecipient[];
  onSelect: (recipient: RecentRecipient) => void;
  className?: string;
}

export function RecentRecipients({
  recipients,
  onSelect,
  className,
}: RecentRecipientsProps) {
  if (recipients.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <History className="w-4 h-4 text-muted-foreground" />
        <span>Recent Recipients</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {recipients.map((recipient) => {
          const network = GHANA_NETWORKS.find(
            (n) => n.id === recipient.networkId
          );

          return (
            <button
              key={recipient.id}
              onClick={() => onSelect(recipient)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border bg-background",
                "hover:bg-muted hover:border-primary/50 transition-all duration-200",
                "min-w-fit shrink-0"
              )}
            >
              {/* Network color indicator */}
              <div
                className="w-2 h-8 rounded-full"
                style={{ backgroundColor: network?.color || "#ccc" }}
              />

              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Phone info */}
              <div className="text-left">
                <p className="text-sm font-medium">
                  {formatPhoneNumber(recipient.phoneNumber)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {network?.name || "Unknown"}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
