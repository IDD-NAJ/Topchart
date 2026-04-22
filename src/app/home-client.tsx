"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState, useCallback } from "react"
import { useHomepageMedia } from "@/hooks/use-homepage-media"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowRight,
  Phone,
  Wifi,
  PhoneCall,
  Store,
  GraduationCap,
  Play,
  Fingerprint,
  CreditCard,
  Ticket,
  ChevronDown,
  LayoutDashboard,
  Server,
  Activity,
  Terminal,
  Smartphone,
  Shield,
  Gift,
} from "lucide-react"
import { motion } from "framer-motion"
import { ScrollReveal, StaggerReveal, StaggerRevealItem, PageTransition } from "@/components/animations"
import { TestimonialCarousel, type Testimonial } from "@/components/marketing/testimonial-carousel"

const SERVICES = [
  {
    icon: Wifi,
    title: "Data Bundles",
    description: "Affordable daily, weekly and monthly data packages for every network.",
    href: "/dashboard/data",
    label: "Browse bundles",
  },
  {
    icon: PhoneCall,
    title: "Verification Numbers",
    description: "Temporary virtual numbers for OTP verification on any platform.",
    href: "/dashboard/verification",
    label: "Get a number",
  },
  {
    icon: GraduationCap,
    title: "Result Checkers",
    description: "WAEC, BECE, and NOVDEC results with your index number.",
    href: "/dashboard/result-checkers",
    label: "Check results",
  },
  {
    icon: Smartphone,
    title: "eSIM",
    description: "Get a US phone number or travel data eSIM for 50+ countries.",
    href: "/dashboard/esim",
    label: "Get eSIM",
  },
  {
    icon: Shield,
    title: "Proxies",
    description: "Residential, mobile & datacenter proxies via 9Proxy.",
    href: "/dashboard/proxies",
    label: "Get proxies",
  },
  {
    icon: Gift,
    title: "Gift Cards",
    description: "Digital gift cards for Netflix, Amazon, Steam & more — delivered instantly.",
    href: "/dashboard/giftcards",
    label: "Buy gift cards",
  },
  {
    icon: CreditCard,
    title: "Pay Bills",
    description: "Electricity, TV, water & internet bill payments in .",
    href: "/dashboard/bills",
    label: "Pay now",
  },
  {
    icon: Store,
    title: "Reseller Program",
    description: "Earn commissions reselling our services under your own brand.",
    href: "/dashboard/reseller",
    label: "Become a reseller",
  },
]

const FAQS = [
  {
    q: "How fast is airtime ana dirtime and data delivery?",
    a: "Most orders complete within seconds. Network congestion may occasionally add a short delay.",
  },
  {
    q: "What payment methods are supported?",
    a: "MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, Mastercard, and wallet balance via Paystack.",
  },
  {
    q: "How do verification numbers work?",
    a: "You rent a temporary number; OTP SMS appears in your dashboard in real time.",
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    brand: "North Ridge Fintech",
    quote:
      "Topchart cut our recharge turnaround to seconds. Wallet funding and reporting are exactly what we needed for ops.",
    name: "Kwame A.",
    role: "Head of Operations",
  },
  {
    brand: "Campus Hub GH",
    quote:
      "We sell data ad  airtimitime to students daily. Reliability and the reseller tools have been excellent.",
    name: "Ama O.",
    role: "Product Lead",
  },
  {
    brand: "VerifyPro Labs",
    quote:
      "Verification numbers for QA saved us from juggling personal SIMs. Support is responsive.",
    name: "Kofi M.",
    role: "Engineering Manager",
  },
  {
    brand: "Retail Collective",
    quote:
      "Airrime tndiaatadata in one dashboard simplified payouts for our field teams.",
    name: "Esi T.",
    role: "Finance Director",
  },
]

type NetworkLogoConfig = {
  key: string
  name: string
  color: string
  image: string
}

const DEFAULT_NETWORK_LOGOS: NetworkLogoConfig[] = [
  { key: "mtn_logo", name: "MTN", image: "/download.png", color: "bg-yellow-400" },
  { key: "telecel_logo", name: "Telecel", image: "/download.jpg", color: "bg-red-500" },
  { key: "airteltigo_logo", name: "AirtelTigo", image: "/download (1).png", color: "bg-red-600" },
]

const DEFAULT_DEVELOPER_IMAGE = "/images/technical-partnership.jpg"

function TopographicBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='0.6' d='M40 200 Q100 80 200 200 T360 200'/%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='0.5' d='M0 120 Q140 40 280 140 T400 100'/%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='0.5' d='M20 320 Q180 240 340 300'/%3E%3C/svg%3E")`,
        backgroundSize: "420px 420px",
      }}
      aria-hidden
    />
  )
}

function ConnectionsGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute left-[50%] top-0 h-[48rem] max-w-none -translate-x-[50%] stroke-white/10 [mask-image:radial-gradient(64rem_34rem_at_center,white,transparent)]"
        aria-hidden="true"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="e813992c-7d03-4cc4-a2bd-151760b470a0"
            width="100"
            height="100"
            x="50%"
            y="-1"
            patternUnits="userSpaceOnUse"
          >
            <path d="M100 200V.5M.5 .5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y="-1" className="overflow-visible fill-[#0a1128]/50">
          <path
            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
            strokeWidth="0"
          />
        </svg>
        <rect
          width="100%"
          height="100%"
          strokeWidth="0"
          fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)"
        />
        <g strokeWidth="2" stroke="url(#gradient-pulse)" className="opacity-40">
          <path d="M-100 100 L100 100 L100 300 L300 300" fill="none" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
          </path>
          <path d="M500 100 L300 100 L300 500 L100 500" fill="none" strokeDasharray="4 4" className="opacity-50">
            <animate attributeName="stroke-dashoffset" values="0;8" dur="1.5s" repeatCount="indefinite" />
          </path>
        </g>
        <defs>
          <linearGradient id="gradient-pulse" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Central glowing core */}
      <div
        className="absolute left-[50%] top-[40%] -translate-x-[50%] -translate-y-[50%] h-[600px] w-[600px] rounded-full opacity-30 blur-[120px] mix-blend-screen pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(74, 154, 200, 1) 0%, transparent 60%)' }}
      />
    </div>
  )
}

function FloatingCard({ className, delay, children }: { className?: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -5 }}
      animate={{ 
        opacity: [0.3, 0.5, 0.3],
        y: [0, -20, 0],
        rotate: [-5, 5, -5]
      }}
      transition={{ 
        duration: 6, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: delay || 0 
      }}
      className={`absolute rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm pointer-events-none ${className || ""}`}
    >
      {children}
    </motion.div>
  )
}

function FloatingCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <FloatingCard delay={0} className="left-[5%] top-[15%] w-32 h-24 hidden lg:block">
        <div className="p-3 space-y-2">
          <div className="h-2 w-16 rounded bg-white/20" />
          <div className="h-2 w-12 rounded bg-white/15" />
        </div>
      </FloatingCard>

      <FloatingCard delay={1.5} className="right-[8%] top-[20%] w-28 h-28 hidden lg:block">
        <div className="p-3 flex items-center justify-center h-full">
          <Phone className="h-8 w-8 text-white/30" />
        </div>
      </FloatingCard>

      <FloatingCard delay={0.5} className="left-[10%] bottom-[25%] w-36 h-20 hidden md:block">
        <div className="p-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-full rounded bg-white/20" />
            <div className="h-2 w-2/3 rounded bg-white/15" />
          </div>
        </div>
      </FloatingCard>

      <FloatingCard delay={2} className="right-[12%] bottom-[30%] w-40 h-24 hidden lg:block">
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded bg-white/20" />
            <div className="h-6 w-6 rounded bg-white/15" />
          </div>
          <div className="h-2 w-full rounded bg-white/20" />
        </div>
      </FloatingCard>

      <FloatingCard delay={1} className="left-[20%] top-[35%] w-24 h-24 hidden xl:block">
        <div className="p-3 flex items-center justify-center h-full">
          <Wifi className="h-10 w-10 text-white/25" />
        </div>
      </FloatingCard>

      <FloatingCard delay={2.5} className="right-[20%] top-[40%] w-20 h-32 hidden xl:block">
        <div className="p-2 space-y-2">
          <div className="h-2 w-full rounded bg-white/20" />
          <div className="h-2 w-3/4 rounded bg-white/15" />
          <div className="h-2 w-full rounded bg-white/20" />
        </div>
      </FloatingCard>
    </div>
  )
}

function DotGridCorner({ className }: { className?: string }) {
  const dots = [
    1, 0, 1, 0,
    0, 1, 0, 1,
    1, 0, 1, 0,
    0, 1, 0, 1,
  ]
  return (
    <div className={`grid grid-cols-4 gap-1.5 ${className ?? ""}`} aria-hidden>
      {dots.map((filled, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${filled ? "bg-neutral-800" : "border border-amber-800/40 bg-transparent"}`}
        />
      ))}
    </div>
  )
}

function GoldDotCluster({ className }: { className?: string }) {
  return (
    <div className={`grid grid-cols-3 gap-1 ${className ?? ""}`} aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-[color:var(--marketing-gold)] opacity-80" />
      ))}
    </div>
  )
}

function PrimaryLink({
  href,
  children,
  className,
  variant = "solid",
}: {
  href: string
  children: React.ReactNode
  className?: string
  variant?: "solid" | "light"
}) {
  if (variant === "light") {
    return (
      <Link
        href={href}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition-opacity hover:opacity-90 ${className ?? ""}`}
      >
        {children}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] ${className ?? ""}`}
      style={{ backgroundColor: "var(--primary)" }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

export default function HomeClient({ initialMedia }: { initialMedia: any[] }) {
  const [networkLogos, setNetworkLogos] = useState<NetworkLogoConfig[]>(DEFAULT_NETWORK_LOGOS)
  const [developerImage, setDeveloperImage] = useState(DEFAULT_DEVELOPER_IMAGE)
  const [heroMedia, setHeroMedia] = useState<{ type: "image" | "video"; url: string } | null>(null)
  const [scaleMedia, setScaleMedia] = useState<{ type: "image" | "video"; url: string } | null>(null)
  const [logoErrorKeys, setLogoErrorKeys] = useState<Record<string, boolean>>({})
  const { media, isLoading: mediaLoading } = useHomepageMedia({ initialData: initialMedia })

  useEffect(() => {
    if (mediaLoading || !media.length) return

    const hero = media.find((m) =>
      (m.slot_key === "hero_background" || m.section_key === "hero_background_video") && m.is_active
    )
    if (hero) {
      const url = hero.file_url || hero.public_url || hero.storage_path
      if (url) setHeroMedia({ type: hero.media_type ?? hero.asset_type ?? "video", url })
    }

    const scale = media.find((m) =>
      (m.slot_key === "scale_background_video" || m.section_key === "scale_background_video") && m.is_active
    )
    if (scale) {
      const url = scale.file_url || scale.public_url || scale.storage_path
      if (url) setScaleMedia({ type: scale.media_type ?? scale.asset_type ?? "video", url })
    }

    const devImg = media.find((m) =>
      (m.slot_key === "developer_community_image" || m.section_key === "developer_community_image") && m.is_active
    )
    if (devImg) {
      const url = devImg.file_url || devImg.public_url || devImg.storage_path
      if (url) setDeveloperImage(url)
    }

    const logoKeyMap: Record<string, string> = {
      network_mtn_logo: "mtn_logo",
      network_telecel_logo: "telecel_logo",
      network_airteltigo_logo: "airteltigo_logo",
    }
    const updatedLogos = DEFAULT_NETWORK_LOGOS.map((logo) => {
      const matched = media.find(
        (m) => (logoKeyMap[m.slot_key ?? ""] === logo.key || m.slot_key === logo.key || m.section_key === logo.key) && m.is_active
      )
      if (matched) {
        const url = matched.file_url || matched.public_url || matched.storage_path
        if (url) return { ...logo, image: url }
      }
      return logo
    })
    setNetworkLogos(updatedLogos)
  }, [media, mediaLoading])

  return (
    <PageTransition className="min-h-screen flex flex-col bg-[color:var(--marketing-cream)]">
      <Header />

      <main className="flex-1 pt-[72px]">
        <section
          className="relative overflow-hidden px-4 pb-32 pt-20 sm:px-6 sm:pb-40 sm:pt-28 lg:pt-36 selection:bg-primary/30 selection:text-white flex min-h-[85vh] flex-col items-center justify-center bg-[#0d1627]"
        >
          {heroMedia && heroMedia.type === "video" ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              preload="metadata"
              onError={() => setHeroMedia(null)}
            >
              <source src={heroMedia.url} type="video/mp4" />
            </video>
          ) : heroMedia && heroMedia.type === "image" ? (
            <div className="absolute inset-0 h-full w-full opacity-40">
              <Image
                src={heroMedia.url}
                alt="Topchart Hero Background"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1627]/80 via-[#0d1627]/60 to-[#0d1627] pointer-events-none" />
          <ConnectionsGrid />
          
          {/* Bottom fade blending into the next white section */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

          <div className="relative z-[2] mx-auto flex max-w-4xl flex-col items-center text-center">

            <motion.h1
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-balance text-5xl leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[5.5rem]"
            >
             Complete <br className="hidden md:block" />
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-sky-200 inline-block"
              >
                Digital Services
              </motion.span>{" "}
              Platform
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-2xl text-[15px] sm:text-base leading-relaxed text-[#8a9ba8]"
            >
              Airtime, dirtime, data bundles, verification numbers, exam results, and a full reseller programme — all in one secure platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-[#0d1627] transition-all hover:bg-neutral-100 shadow-xl group"
                >
                  Get started free
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-transparent px-8 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Sign in to dashboard
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            >
              {networkLogos.map((network, index) => (
                <motion.div
                  key={network.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05 }}
                  className="relative flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
                >
                  <div className="relative h-8 w-8">
                    <Image
                      src={network.image}
                      alt={network.name}
                      fill
                      className="object-contain"
                      sizes="32px"
                      onError={() => {
                        setLogoErrorKeys((prev) => ({ ...prev, [network.key]: true }));
                      }}
                    />
                    <div className={`${logoErrorKeys[network.key] ? "flex" : "hidden"} h-8 w-8 items-center justify-center`}>
                      <div className={`h-3 w-3 rounded-full ${network.color}`} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-white/90">{network.name}</span>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    className="h-2 w-2 rounded-full bg-emerald-400"
                  ></motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          id="capacity"
          className="relative border-b border-neutral-200/60 bg-white px-4 py-20 sm:px-6"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-[min(90%,720px)] -translate-x-1/2 -translate-y-1/2 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(242,141,97,0.35) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
            aria-hidden
          />
          <div className="relative z-[1] mx-auto max-w-[1200px]">
            <ScrollReveal
              once={false}
              amount={0.22}
              className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end"
            >
              <div className="max-w-3xl border-l-[3px] border-primary pl-6">
                <h2 className="text-balance text-3xl font-bold leading-tight sm:text-4xl">
                  API-First Infrastructure for<br/>
                  <span className="text-primary">African scale.</span>
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  Engineered for developers, startups, and enterprises. Integrate powerful communication and payments APIs in minutes.
                </p>
              </div>
              <PrimaryLink href="/login" className="shrink-0 rounded font-sans uppercase tracking-widest">
                Start Building
              </PrimaryLink>
            </ScrollReveal>
          </div>
        </section>

        <section
          className="border-b border-neutral-200/40 px-4 py-20 sm:px-6"
          style={{ backgroundColor: "var(--marketing-cream-alt)" }}
        >
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal once={false} amount={0.22} className="relative pl-5">
              <div
                className="absolute left-0 top-2 bottom-2 w-1 bg-primary"
              />
              <h2 className="text-balance text-3xl font-bold text-neutral-900 sm:text-4xl">
                Scale With Confidence
              </h2>
              <p className="mt-6 max-w-lg text-neutral-600 leading-relaxed">
                One wallet, transparent pricing, and support when you need it — whether you are topping up, verifying, or scaling as a reseller.
              </p>
            </ScrollReveal>
            <ScrollReveal once={false} amount={0.22}>
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-neutral-200/80 shadow-lg">
                {scaleMedia && scaleMedia.type === "video" ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    preload="metadata"
                    onError={() => setScaleMedia(null)}
                  >
                    <source src={scaleMedia.url} type="video/mp4" />
                  </video>
                ) : scaleMedia && scaleMedia.type === "image" ? (
                  <img src={scaleMedia.url} alt="Scale background" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section
          id="what-we-offer"
          className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6"
          style={{ backgroundColor: "var(--marketing-cream-alt)" }}
        >
          <DotGridCorner className="absolute bottom-8 right-8 opacity-80" />
          <div className="relative z-[1] mx-auto max-w-[1200px]">
            <ScrollReveal once={false} amount={0.2}>
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl border-b-2 border-primary pb-4 inline-block">
                Our Products
              </h2>
            </ScrollReveal>
            <StaggerReveal
              className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.09}
              once={false}
              stack
              amount={0.12}
            >
              {SERVICES.map((s, i) => (
                <StaggerRevealItem key={s.title} index={i} stack>
                  <motion.div whileHover={{ y: -8, transition: { duration: 0.3 } }} className="h-full">
                    <Link
                      href={s.href}
                      className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div
                        className="mb-6 flex h-12 w-12 items-center justify-center bg-transparent text-primary transition-transform duration-300 group-hover:scale-110"
                      >
                        <s.icon className="h-8 w-8" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 z-10">{s.title}</h3>
                      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-neutral-600 z-10">{s.description}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide z-10">
                        {s.label}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </motion.div>
                </StaggerRevealItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal once={false} amount={0.22} className="relative pl-5">
              <div
                className="absolute left-0 top-2 bottom-2 w-1 bg-primary"
              />
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Developer Community
              </h2>
              <p className="mt-6 text-neutral-600 leading-relaxed">
                Banks, fintechs, and growing brands use Topchart to deliver data and adjacent services without rebuilding telco integrations. We handle compliance-minded flows, wallet logic, and operational tooling.
              </p>
            </ScrollReveal>
            <ScrollReveal once={false} amount={0.22} className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded bg-neutral-900">
                <Image
                  src={developerImage}
                  alt="A user looking at code metrics"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <Link
                href="/about"
                className="absolute -bottom-4 left-4 inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground sm:left-8 bg-primary transition-transform hover:-translate-y-1"
              >
                Learn how
                <ArrowRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
          </div>
        </section>

        <section
          className="relative overflow-hidden px-4 py-24 sm:px-6"
          style={{ backgroundColor: "var(--marketing-hero-dark)" }}
        >
          <TopographicBg />
          <div className="pointer-events-none absolute bottom-10 left-8">
            <GoldDotCluster />
          </div>
          <div className="relative z-[1] mx-auto max-w-[820px] text-center">
            <ScrollReveal once={false} amount={0.25} direction="up" className="text-center">
              <h2 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                Full white-label solution
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Launch your own branded storefront, wallet, and service catalogue on top of Topchart infrastructure — with commissions, analytics, and support built in.
              </p>
              <div className="mt-10 flex flex-col items-center gap-2">
                <PrimaryLink href="/login">Login</PrimaryLink>
                <p className="text-xs text-white/50">Sign in to access your dashboard and reseller tools.</p>
              </div>
            </ScrollReveal>
          </div>

          <StaggerReveal
            className="relative z-[1] mx-auto mt-16 flex max-w-[1000px] flex-wrap justify-center gap-4 pb-4 sm:flex-nowrap sm:gap-6"
            once={false}
            stack
            stagger={0.12}
            amount={0.14}
          >
            <StaggerRevealItem
              index={0}
              stack
              className="relative mt-8 h-[200px] w-[100px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 shadow-xl sm:h-[240px] sm:w-[120px]"
            >
              <div className="space-y-2 p-2 pt-4">
                <div className="h-2 w-full rounded bg-white/20" />
                <div className="h-2 w-[80%] rounded bg-white/10" />
                <div className="h-2 w-full rounded bg-white/15" />
              </div>
            </StaggerRevealItem>
            <StaggerRevealItem
              index={1}
              stack
              className="relative z-[2] -mt-4 h-[220px] w-[min(100%,380px)] overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl sm:h-[280px]"
            >
              <div className="flex h-10 items-center border-b border-neutral-200 bg-neutral-50 px-3 text-xs font-bold text-neutral-700">
                Wallet
              </div>
              <div className="space-y-2 p-4">
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg bg-primary/20 text-center text-[10px] font-semibold leading-8 text-primary">
                    Fund
                  </div>
                  <div className="h-8 flex-1 rounded-lg bg-neutral-100 text-center text-[10px] font-semibold leading-8 text-neutral-600">
                    History
                  </div>
                </div>
                <div className="h-24 rounded-xl border border-neutral-100 bg-neutral-50/80" />
                <div className="h-8 rounded-lg bg-neutral-100" />
                <div className="h-8 rounded-lg bg-neutral-100" />
              </div>
            </StaggerRevealItem>
            <StaggerRevealItem
              index={2}
              stack
              className="relative mt-8 h-[200px] w-[100px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 shadow-xl sm:h-[240px] sm:w-[120px]"
            >
              <div className="p-2 pt-6 text-center text-[10px] font-bold text-white/70">Terminal</div>
              <div className="mx-2 mt-2 h-16 rounded-lg bg-white/10" />
            </StaggerRevealItem>
          </StaggerReveal>
        </section>

        <section
          className="border-b border-neutral-200/60 px-4 py-20 sm:px-6"
          style={{ backgroundColor: "var(--marketing-cream)" }}
        >
          <div className="mx-auto max-w-[1200px]">
            <ScrollReveal
              once={false}
              amount={0.2}
              className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                What people are saying
              </h2>
            </ScrollReveal>
            <TestimonialCarousel items={TESTIMONIALS} />
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6" style={{ backgroundColor: "var(--marketing-cream)" }}>
          <div className="mx-auto max-w-[1200px]">
            <ScrollReveal once={false} amount={0.22}>
              <div
                className="flex flex-col items-stretch gap-8 rounded-3xl px-6 py-12 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-14"
                style={{ backgroundColor: "var(--marketing-nav)" }}
              >
                <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
                  <DotGridCorner className="shrink-0 opacity-50 invert" />
                  <h2 className="text-balance text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
                    Enjoy the best of data and digital services
                  </h2>
                </div>
                <PrimaryLink href="/register" className="shrink-0 self-start sm:self-center">
                  Get Started
                </PrimaryLink>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section id="faq" className="border-t border-neutral-200/60 bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal once={false} amount={0.25} className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900">Common questions</h2>
            </ScrollReveal>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${i}`}
                  className="rounded-2xl border border-neutral-200 bg-[color:var(--marketing-cream)] px-4 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="py-4 text-left font-semibold text-neutral-900 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-neutral-600">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </PageTransition>
  )
}
