"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, Zap } from "lucide-react";

interface AmountSelectorProps {
  value: number;
  onChange: (amount: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function AmountSelector({
  value,
  onChange,
  min = 1,
  max = 1000,
  className,
}: AmountSelectorProps) {
  const [customMode, setCustomMode] = useState(false);

  const handlePresetClick = (amount: number) => {
    onChange(amount);
    setCustomMode(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const increment = () => {
    const newValue = Math.min(value + 1, max);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - 1, min);
    onChange(newValue);
  };

  const quickAdd = (amount: number) => {
    const newValue = Math.min(value + amount, max);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Select Amount
        </label>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>GH₵{min} - GH₵{max}</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 5, 10, 20, 50].map((amount) => (
          <button
            key={amount}
            onClick={() => handlePresetClick(amount)}
            className={cn(
              "relative flex items-center justify-center px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200",
              "hover:shadow-md hover:scale-[1.02]",
              value === amount && !customMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:border-primary/50",
              (amount === 5 || amount === 10) && "ring-1 ring-primary/20"
            )}
          >
            {(amount === 5 || amount === 10) && (
              <Zap className="absolute -top-1 -right-1 w-4 h-4 text-primary fill-primary" />
            )}
            <span>GH₵{amount}</span>
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={decrement}
            disabled={value <= min}
            className="shrink-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              GH₵
            </span>
            <Input
              type="number"
              value={value}
              onChange={handleCustomChange}
              onFocus={() => setCustomMode(true)}
              min={min}
              max={max}
              step={0.5}
              className="pl-10 text-center font-semibold text-lg"
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={increment}
            disabled={value >= max}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick add buttons */}
        <div className="flex gap-2 justify-center">
          {[1, 5, 10].map((amount) => (
            <Button
              key={amount}
              variant="ghost"
              size="sm"
              onClick={() => quickAdd(amount)}
              disabled={value + amount > max}
              className="text-xs"
            >
              +GH₵{amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount:</span>
          <span className="text-lg font-bold text-foreground">
            GH₵{value.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
