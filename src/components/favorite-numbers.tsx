"use client"

import { useState, useEffect } from "react"
import { Star, Trash2, User, Phone, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  getFavorites, 
  removeFavorite, 
  type Favorite 
} from "@/lib/actions/favorites"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FavoriteNumbersProps {
  userId: string;
  type: 'airtime' | 'data';
  onSelect: (phoneNumber: string) => void;
  className?: string;
}

export function FavoriteNumbers({ userId, type, onSelect, className }: FavoriteNumbersProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function loadFavorites() {
      const result = await getFavorites(userId, type)
      if (result.success && result.data) {
        setFavorites(result.data)
      }
      setLoading(false)
    }
    loadFavorites()
  }, [userId, type])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const result = await removeFavorite(id, userId)
    if (result.success) {
      setFavorites(favorites.filter(f => f.id !== id))
    }
  }

  const filteredFavorites = favorites.filter(f => 
    f.phone_number.includes(search) || 
    (f.name && f.name.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[color:var(--marketing-accent)]"></div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center p-6 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/30">
        <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No saved numbers yet.</p>
        <p className="text-xs">Save numbers you frequently top up for quick access.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search saved numbers..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {filteredFavorites.map((fav) => (
          <div 
            key={fav.id}
            onClick={() => onSelect(fav.phone_number)}
            className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:border-[color:var(--marketing-accent)] hover:bg-[color:var(--marketing-accent)]/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[color:var(--marketing-accent)]/10 flex items-center justify-center text-[color:var(--marketing-accent)]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{fav.name || "Untitled"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {fav.phone_number}
                </p>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, fav.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove from favorites</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}

        {filteredFavorites.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No matches found.</p>
        )}
      </div>
    </div>
  )
}
