"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GHANA_NETWORKS, Network, detectNetwork } from "@/lib/purchase-data";
import { Signal, Check } from "lucide-react";

interface NetworkSelectorProps {
  selectedNetworkId: string | null;
  onSelect: (networkId: string) => void;
  phoneNumber?: string;
  className?: string;
}

export function NetworkSelector({
  selectedNetworkId,
  onSelect,
  phoneNumber,
  className,
}: NetworkSelectorProps) {
  const [detectedNetwork, setDetectedNetwork] = useState<Network | null>(null);

  // Auto-detect network when phone number changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 3) {
      const detected = detectNetwork(phoneNumber);
      setDetectedNetwork(detected);
      
      // Auto-select if detected and not already selected
      if (detected && !selectedNetworkId) {
        onSelect(detected.id);
      }
    } else {
      setDetectedNetwork(null);
    }
  }, [phoneNumber, selectedNetworkId, onSelect]);

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-foreground">
        Select Network
        {detectedNetwork && (
          <span className="ml-2 text-xs text-muted-foreground">
            (Auto-detected: {detectedNetwork.name})
          </span>
        )}
      </label>
      
      <div className="grid grid-cols-3 gap-3">
        {GHANA_NETWORKS.map((network) => {
          const isSelected = selectedNetworkId === network.id;
          const isDetected = detectedNetwork?.id === network.id;
          
          return (
            <button
              key={network.id}
              onClick={() => onSelect(network.id)}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                "hover:shadow-md hover:scale-[1.02]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-background hover:border-primary/50",
                isDetected && !isSelected && "ring-2 ring-primary/30"
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              {/* Network Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}
                style={{
                  backgroundColor: isSelected ? `${network.color}30` : undefined,
                }}
              >
                <Signal
                  className="w-6 h-6"
                  style={{ color: network.color }}
                />
              </div>
              
              {/* Network Name */}
              <span
                className={cn(
                  "text-sm font-semibold",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {network.name}
              </span>
              
              {/* Detection badge */}
              {isDetected && !isSelected && (
                <span className="absolute -top-1 -left-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full">
                  Detected
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Phone prefix hints */}
      {selectedNetworkId && (
        <p className="text-xs text-muted-foreground text-center">
          Phone prefixes: {GHANA_NETWORKS.find(n => n.id === selectedNetworkId)?.phonePrefixes.join(", ")}
        </p>
      )}
    </div>
  );
}
