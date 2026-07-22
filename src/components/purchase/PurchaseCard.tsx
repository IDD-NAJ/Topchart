"use client";

import { cn } from "@/lib/utils";
import { DataBundle, _NETWORKS } from "@/lib/purchase-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, Clock, Star, Sparkles, ArrowRight } from "lucide-react";

interface PurchaseCardProps {
  bundle: DataBundle;
  onPurchase: (bundle: DataBundle) => void;
  isLoading?: boolean;
  className?: string;
  inStock?: boolean;
  availabilityLoading?: boolean;
}

export function PurchaseCard({
  bundle,
  onPurchase,
  isLoading,
  className,
  inStock,
  availabilityLoading,
}: PurchaseCardProps) {
  const network = _NETWORKS.find((n) => n.id === bundle.networkId);
  const price = Number(bundle.price) || 0;
  const originalPrice = Number(bundle.originalPrice ?? bundle.price) || 0;
  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <button
      onClick={() => onPurchase(bundle)}
      className={cn(
        "relative group w-full flex flex-col p-3 rounded-lg border bg-card",
        "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
        "transition-all duration-200 text-left",
        bundle.isPopular && "border-primary/30 ring-1 ring-primary/10",
        className
      )}
      disabled={isLoading}
    >
      {/* Top section: Network + Badges */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${network?.color}15` }}
          >
            <Wifi className="w-3 h-3" style={{ color: network?.color }} />
          </div>
          <span className="text-xs font-semibold text-foreground truncate">
            {network?.name}
          </span>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          {bundle.isPopular && (
            <Badge className="bg-primary text-primary-foreground gap-0.5 text-[9px] px-1.5 py-0.5 h-5 shrink-0">
              <Star className="w-2.5 h-2.5 fill-current" />
              Popular
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 h-5 shrink-0">
              -{discountPercent}%
            </Badge>
          )}
        </div>
      </div>

      {/* Data amount + Price (prominent) */}
      <div className="mb-2">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <h3 className="text-lg font-bold text-foreground leading-tight">
            {bundle.dataAmount}
          </h3>
          <span className="text-sm font-bold text-primary">
            GH₵{price.toFixed(2)}
          </span>
        </div>
        {hasDiscount && (
          <span className="text-xs text-muted-foreground line-through">
            GH₵{originalPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Plan name */}
      <p className="text-xs font-medium text-foreground line-clamp-1 mb-2">
        {bundle.name}
      </p>

      {/* Validity */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2.5">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{bundle.validity}</span>
      </div>

      {/* Availability indicator */}
      <div className="h-0.5 bg-border mb-2.5" />
      {availabilityLoading ? (
        <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
      ) : inStock === true ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          In Stock
        </span>
      ) : inStock === false ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          Out of Stock
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          Check Stock
        </span>
      )}

      {/* Buy button */}
      <Button
        size="sm"
        className="w-full mt-2.5 gap-1 text-xs h-8 group-hover:gap-2 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onPurchase(bundle);
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processing
          </>
        ) : (
          <>
            Buy Now
            <ArrowRight className="w-3 h-3" />
          </>
        )}
      </Button>
    </button>
  );
}
