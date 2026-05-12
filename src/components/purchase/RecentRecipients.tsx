"use client";

import { cn } from "@/lib/utils";
import { RecentRecipient, formatPhoneNumber, _NETWORKS } from "@/lib/purchase-data";
import { History, User, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentRecipientsProps {
  recipients: RecentRecipient[];
  onSelect: (recipient: RecentRecipient) => void;
  onRemove?: (recipient: RecentRecipient) => void;
  className?: string;
}

export function RecentRecipients({
  recipients,
  onSelect,
  onRemove,
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
          const network = _NETWORKS.find(
            (n) => n.id === recipient.networkId
          );

          return (
            <div
              key={recipient.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border bg-background",
                "hover:bg-muted hover:border-primary/50 transition-all duration-200",
                "min-w-fit shrink-0 group"
              )}
            >
              <button
                onClick={() => onSelect(recipient)}
                className="flex items-center gap-2 flex-1"
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

              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(recipient);
                  }}
                  className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Remove from recent contacts"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
