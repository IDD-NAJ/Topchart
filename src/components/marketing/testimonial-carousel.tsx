"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
export type Testimonial = {
  quote: string
  name: string
  role: string
  brand: string
}

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [i, setI] = useState(0)
  const len = items.length

  const prev = useCallback(() => setI((x) => (x - 1 + len) % len), [len])
  const next = useCallback(() => setI((x) => (x + 1) % len), [len])

  useEffect(() => {
    const t = setInterval(next, 7000)
    return () => clearInterval(t)
  }, [next])

  return (
    <div className="relative">
      <div className="mb-8 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={prev}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 transition-colors hover:bg-neutral-200"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-opacity hover:opacity-95"
          style={{ backgroundColor: "var(--marketing-accent)" }}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-hidden pb-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              { offset: 0, hide: "" },
              { offset: 1, hide: "hidden sm:block" },
              { offset: 2, hide: "hidden lg:block" },
            ].map(({ offset, hide }) => {
              const item = items[(i + offset) % len]
              return (
                <article
                  key={`${i}-${offset}`}
                  className={`relative flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm ${hide}`}
                >
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {item.brand}
                  </p>
                  <Quote
                    className="pointer-events-none absolute right-4 top-14 h-16 w-16 text-[color:var(--marketing-accent)] opacity-[0.12]"
                    aria-hidden
                  />
                  <p className="relative z-[1] flex-1 text-sm leading-relaxed text-neutral-700">
                    {item.quote}
                  </p>
                  <div className="mt-6 border-t border-neutral-100 pt-4">
                    <p className="font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">{item.role}</p>
                  </div>
                </article>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
