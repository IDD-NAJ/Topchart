"use client";

import { cn } from "@/lib/utils";
import { DataBundle, GHANA_NETWORKS } from "@/lib/purchase-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, Clock, Star, Sparkles, ArrowRight } from "lucide-react";

interface PurchaseCardProps {
  bundle: DataBundle;
  onPurchase: (bundle: DataBundle) => void;
  isLoading?: boolean;
  className?: string;
}

export function PurchaseCard({
  bundle,
  onPurchase,
  isLoading,
  className,
}: PurchaseCardProps) {
  const network = GHANA_NETWORKS.find((n) => n.id === bundle.networkId);
  const originalPrice = bundle.originalPrice ?? bundle.price;
  const hasDiscount = originalPrice > bundle.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - bundle.price) / originalPrice) * 100)
    : 0;

  return (
    <div
      className={cn(
        "relative flex flex-col p-5 rounded-xl border-2 bg-background",
        "hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]",
        "transition-all duration-300 cursor-pointer",
        bundle.isPopular && "ring-2 ring-primary/20 border-primary",
        className
      )}
      onClick={() => onPurchase(bundle)}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
        {bundle.isPopular && (
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Star className="w-3 h-3 fill-current" />
            Popular
          </Badge>
        )}
        {bundle.isNew && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            New
          </Badge>
        )}
        {hasDiscount && (
          <Badge variant="destructive" className="gap-1">
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Network indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${network?.color}20` }}
        >
          <Wifi className="w-4 h-4" style={{ color: network?.color }} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {network?.name}
        </span>
      </div>

      {/* Data amount */}
      <div className="mb-2">
        <h3 className="text-2xl font-bold text-foreground">
          {bundle.dataAmount}
        </h3>
      </div>

      {/* Plan name */}
      <p className="text-sm font-medium text-foreground mb-3">
        {bundle.name}
      </p>

      {/* Validity */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Clock className="w-4 h-4" />
        <span>{bundle.validity}</span>
      </div>

      {/* Description if available */}
      {bundle.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {bundle.description}
        </p>
      )}

      {/* Price section */}
      <div className="mt-auto pt-3 border-t">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-foreground">
            GH₵{bundle.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              GH₵{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <Button
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onPurchase(bundle);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Buy Now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
