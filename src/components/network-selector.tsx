"use client"

import { networks, type Network } from "@/lib/networks"
import { cn } from "@/lib/utils"

interface NetworkSelectorProps {
  selected: Network | null
  onSelect: (network: Network) => void
}

export function NetworkSelector({ selected, onSelect }: NetworkSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {networks.map((network) => (
        <button
          key={network.id}
          type="button"
          onClick={() => onSelect(network)}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
            selected?.id === network.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 bg-card"
          )}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: network.color }}
          >
            {network.code.substring(0, 3)}
          </div>
          <span className="text-xs font-medium text-foreground">{network.name}</span>
        </button>
      ))}
    </div>
  )
}
