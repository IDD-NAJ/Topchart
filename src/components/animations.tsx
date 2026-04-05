"use client"

import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
import { ReactNode, useEffect, useRef } from "react"

const EXPO = [0.16, 1, 0.3, 1] as const
const SPRING = { type: "spring", stiffness: 260, damping: 22 }

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
}

// ─── Page-level entrance wrapper ─────────────────────────────────────────────
export function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Scroll-triggered reveal ──────────────────────────────────────────────────
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  amount = 0.15,
}: AnimatedSectionProps & { direction?: "up" | "down" | "left" | "right"; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount })
  const dirMap = {
    up: { y: 32, x: 0 },
    down: { y: -32, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  }
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Staggered children container (scroll-triggered) ─────────────────────────
export function StaggerReveal({
  children,
  className = "",
  stagger = 0.1,
  delay = 0,
  amount = 0.1,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
  amount?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerRevealItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Hover card (lift + sea-blue glow) ───────────────────────────────────────
export function HoverCard({ children, className = "", wineGlow = false }: { children: ReactNode; className?: string; wineGlow?: boolean }) {
  const shadow = wineGlow
    ? "0 20px 40px -12px rgba(114,47,55,0.25)"
    : "0 20px 40px -12px rgba(0,105,148,0.22)"
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: shadow }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.22, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Hover button (scale + glow) ─────────────────────────────────────────────
export function HoverButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated number count-up ─────────────────────────────────────────────────
export function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionVal = useMotionValue(0)
  const smoothVal = useSpring(motionVal, { stiffness: 80, damping: 20 })

  useEffect(() => {
    if (inView) motionVal.set(value)
  }, [inView, value, motionVal])

  useEffect(() => {
    return smoothVal.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix
    })
  }, [smoothVal, suffix])

  return <span ref={ref} className={className}>0{suffix}</span>
}

// ─── Floating decorative orb ──────────────────────────────────────────────────
export function FloatingOrb({
  color = "sea",
  size = 400,
  top,
  left,
  right,
  bottom,
  opacity = 0.12,
}: {
  color?: "sea" | "wine" | "grey"
  size?: number
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  opacity?: number
}) {
  const colorMap = {
    sea: "rgba(0,105,148,1)",
    wine: "rgba(114,47,55,1)",
    grey: "rgba(107,114,128,1)",
  }
  return (
    <motion.div
      animate={{ y: [0, -18, 0], scale: [1, 1.04, 1] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: colorMap[color],
        filter: `blur(${size * 0.35}px)`,
        opacity,
        top,
        left,
        right,
        bottom,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  )
}

// ─── Legacy helpers (kept for backwards compat) ───────────────────────────────
export function AnimatedSection({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedCard({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: EXPO }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedText({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.span>
  )
}

export function StaggerContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EXPO } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FadeIn({ children, className = "", delay = 0, direction = "up" }: AnimatedSectionProps & { direction?: "up" | "down" | "left" | "right" }) {
  const directionMap = { up: { y: 20, x: 0 }, down: { y: -20, x: 0 }, left: { x: 20, y: 0 }, right: { x: -20, y: 0 } }
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HoverScale({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
