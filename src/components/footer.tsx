"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Twitter, Linkedin, Mail, MapPin, Phone, ArrowUpRight, Sparkles } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const columns = [
    {
      title: "Company",
      links: [
        { href: "/about", label: "About Us" },
        { href: "/faq", label: "Help Center" },
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
      ],
    },
    {
      title: "Services",
      links: [
        { href: "/dashboard/data", label: "Data bundles" },
        { href: "/dashboard/verification", label: "Verification numbers" },
      ],
    },
  ]

  const contactInfo = [
    { icon: Mail, text: "support@topchart.gh" },
    { icon: Phone, text: "+233 20 123 4567" },
    { icon: MapPin, text: "Accra, Ghana" },
  ]

  return (
    <footer className="relative overflow-hidden bg-[#0d1627]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1627] via-[#1a2736] to-[#0d1627]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/20 blur-[128px]" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/10 blur-[128px]" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-16 py-20 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/" className="inline-block group">
                <motion.span
                  className="font-sans font-bold tracking-tight text-3xl text-white"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Topchart
                </motion.span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#8a9ba8]">
                Ghana&apos;s platform for data, verification numbers, exam results, and reseller tools — fast, secure, and always on.
              </p>
              
              <div className="mt-8 flex items-center gap-4">
                {[
                  { icon: Twitter, href: "https://twitter.com/topchartgh", label: "Twitter" },
                  { icon: Linkedin, href: "https://linkedin.com/company/topchartgh", label: "LinkedIn" },
                ].map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#8a9ba8] transition-colors hover:bg-primary hover:text-white hover:border-primary/50"
                    aria-label={social.label}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {columns.map((col, colIndex) => (
            <motion.div
              key={col.title}
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: colIndex * 0.1 }}
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a9ba8]">
                {col.title}
              </h3>
              <ul className="mt-6 space-y-3">
                {col.links.map((link, linkIndex) => (
                  <li key={link.href}>
                    <motion.div whileHover={{ x: 4 }}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors hover:text-primary"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-white/10 py-12"
        >
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact Us</h4>
              <ul className="space-y-3">
                {contactInfo.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 text-sm text-[#8a9ba8]"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Stay Updated</h4>
              <p className="mb-4 text-sm text-[#8a9ba8]">
                Get the latest updates on new features and special offers.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#8a9ba8]/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-center sm:flex-row sm:text-left"
        >
          <p className="text-xs font-mono text-[#8a9ba8]">
            Copyright — {currentYear} | Topchart. All rights reserved.
          </p>
          <motion.div
            className="flex items-center gap-2 text-xs text-[#8a9ba8]"
            whileHover={{ scale: 1.02 }}
          >
            <span>Made by CU7 Solutions Tech</span>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
