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
  const originalPrice = bundle.originalPrice ?? bundle.price;
  const hasDiscount = originalPrice > bundle.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - bundle.price) / originalPrice) * 100)
    : 0;

  return (
    <div
      className={cn(
        "relative flex flex-col p-2 rounded-md border bg-background",
        "hover:shadow-sm hover:border-primary/50",
        "transition-all duration-150 cursor-pointer",
        bundle.isPopular && "ring-2 ring-primary/20 border-primary",
        className
      )}
      onClick={() => onPurchase(bundle)}
    >
      {/* Badges */}
      <div className="absolute top-1.5 right-1.5 flex flex-col gap-0 items-end">
        {bundle.isPopular && (
          <Badge className="bg-primary text-primary-foreground gap-0.5 text-[9px] px-1 py-0 h-4">
            <Star className="w-2 h-2 fill-current" />
            Popular
          </Badge>
        )}
        {bundle.isNew && (
          <Badge variant="secondary" className="gap-0.5 text-[9px] px-1 py-0 h-4">
            <Sparkles className="w-2 h-2" />
            New
          </Badge>
        )}
        {hasDiscount && (
          <Badge variant="destructive" className="gap-0.5 text-[9px] px-1 py-0 h-4">
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Network indicator */}
      <div className="flex items-center gap-1 mb-1">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${network?.color}20` }}
        >
          <Wifi className="w-2.5 h-2.5" style={{ color: network?.color }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {network?.name}
        </span>
      </div>

      {/* Data amount */}
      <div className="mb-0.5">
        <h3 className="text-base font-bold text-foreground">
          {bundle.dataAmount}
        </h3>
      </div>

      {/* Plan name */}
      <p className="text-xs font-medium text-foreground mb-1 line-clamp-1">
        {bundle.name}
      </p>

      {/* Validity */}
      <div className="flex items-center gap-0.5 text-xs text-muted-foreground mb-1">
        <Clock className="w-3 h-3" />
        <span>{bundle.validity}</span>
      </div>

      {/* Description if available */}
      {bundle.description && (
        <p className="text-[9px] text-muted-foreground mb-1 line-clamp-1">
          {bundle.description}
        </p>
      )}

      {/* Availability */}
      {availabilityLoading ? (
        <div className="h-3.5 w-14 rounded-full bg-muted animate-pulse mb-1" />
      ) : inStock === true ? (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-green-600 dark:text-green-400 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          In Stock
        </span>
      ) : inStock === false ? (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-muted-foreground mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          Out of Stock
        </span>
      ) : null}

      {/* Price section */}
      <div className="mt-auto pt-1.5 border-t">
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-base font-bold text-foreground">
            GH₵{bundle.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              GH₵{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full gap-1 text-xs h-7"
          onClick={(e) => {
            e.stopPropagation();
            onPurchase(bundle);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ...
            </>
          ) : (
            <>
              Buy
              <ArrowRight className="w-2.5 h-2.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
