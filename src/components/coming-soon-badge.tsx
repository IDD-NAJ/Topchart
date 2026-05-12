"use client";

import { Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComingSoonBadgeProps {
  message?: string | null;
  expectedDate?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "prominent";
  className?: string;
}

/**
 * Badge component to display "Coming Soon" status on service cards
 */
export function ComingSoonBadge({
  message,
  expectedDate,
  size = "md",
  variant = "default",
  className,
}: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const variantClasses = {
    default: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    subtle: "bg-muted text-muted-foreground",
    prominent: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const tooltipContent = (
    <div className="space-y-1 max-w-xs">
      <p className="font-medium">{message || "Coming Soon"}</p>
      {expectedDate && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Expected: {new Date(expectedDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-medium",
              sizeClasses[size],
              variantClasses[variant],
              className
            )}
          >
            <Sparkles className={iconSizes[size]} />
            Coming Soon
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ComingSoonOverlayProps {
  message?: string | null;
  expectedDate?: string | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * Overlay component that wraps service cards to show "Coming Soon" status
 */
export function ComingSoonOverlay({
  message,
  expectedDate,
  children,
  className,
}: ComingSoonOverlayProps) {
  return (
    <div className={cn("relative group", className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center p-4 transition-opacity">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow-lg">
          <Sparkles className="w-5 h-5" />
          Coming Soon
        </div>
        {message && (
          <p className="mt-3 text-center text-sm text-muted-foreground max-w-[200px]">
            {message}
          </p>
        )}
        {expectedDate && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Expected: {new Date(expectedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
