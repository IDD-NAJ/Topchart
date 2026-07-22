"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface PopupBannerData {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  dismissible: boolean;
}

interface PopupBannerProps {
  banner: PopupBannerData;
  onDismiss: () => void;
}

const fadeIn = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export function PopupBanner({ banner, onDismiss }: PopupBannerProps) {
  const handleDismiss = async () => {
    try {
      await fetch("/api/user/popup-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerId: banner.id }),
      });
      onDismiss();
    } catch (error) {
      console.error("Failed to dismiss banner:", error);
    }
  };

  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, "_blank");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onDismiss}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatePresence mode="wait">
          <motion.div
            {...fadeIn}
            className="relative"
          >
            {banner.image_url && (
              <div className="relative w-full h-56 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90 z-10" />
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 z-20">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">New</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{banner.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{banner.content}</p>
                </div>
                {banner.dismissible && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="h-9 w-9 shrink-0 hover:bg-muted/50 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {banner.link_url && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <Button 
                    onClick={handleClick} 
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 font-semibold"
                  >
                    {banner.link_text || "Learn More"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
              
              <div className="pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-medium">
                  Topchart Exclusive
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export function PopupBannerContainer() {
  const [banner, setBanner] = useState<PopupBannerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/user/popup-banners");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setBanner(data.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, []);

  if (loading || !banner) {
    return null;
  }

  return <PopupBanner banner={banner} onDismiss={() => setBanner(null)} />;
}
