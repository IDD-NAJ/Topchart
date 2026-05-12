"use client"

import { motion } from "framer-motion"
import { Phone } from "lucide-react"

const EXPO = [0.16, 1, 0.3, 1] as const

interface PreloadOverlayProps {
  isVisible: boolean
  message?: string
}

export function PreloadOverlay({ isVisible, message }: PreloadOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-8">
        {/* Phone icon with ringing animation */}
        <div className="relative">
          {/* Ripple rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            initial={{ scale: 0.8, opacity: 0 } }
            animate={{ scale: 2, opacity: 0 } }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            initial={{ scale: 0.8, opacity: 0 } }
            animate={{ scale: 2, opacity: 0 } }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5,
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/10"
            initial={{ scale: 0.8, opacity: 0 } }
            animate={{ scale: 2, opacity: 0 } }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 1,
            }}
          />

          {/* Phone icon container */}
          <motion.div
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
            animate={{
              rotate: [0, -5, 5, -5, 5, 0],
              scale: [1, 1.05, 1, 1.05, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeInOut",
              }}
            >
              <Phone className="h-12 w-12 text-primary" strokeWidth={2} />
            </motion.div>
          </motion.div>
        </div>

        {/* Loading text */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 } }
          animate={{ opacity: 1, y: 0 } }
          transition={{ duration: 0.5, delay: 0.2, ease: EXPO }}
        >
          <p className="text-lg font-semibold text-foreground">
            {message || "Connecting..."}
          </p>
          <p className="text-sm text-muted-foreground">
            Please wait while we get things ready
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 } }
          animate={{ opacity: 1 } }
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
