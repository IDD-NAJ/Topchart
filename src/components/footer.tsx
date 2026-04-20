"use client"

import Image from "next/image"

import Link from "next/link"

import { motion } from "framer-motion"

import { ScrollReveal, StaggerReveal, StaggerRevealItem } from "@/components/animations"

import { 

  Mail, 

  Phone, 

  MapPin, 

  Twitter, 

  Linkedin, 

  Github, 

  Globe,

  ArrowRight,

  ShieldCheck,

  CreditCard,

  Smartphone

} from "lucide-react"



export function Footer() {

  const currentYear = new Date().getFullYear()



  const footerLinks = {

    platform: [

      { href: "/dashboard/airtime", label: "Airtime Top-Up" },

      { href: "/dashboard/data", label: "Data Bundles" },

      { href: "/dashboard/verification", label: "Verification Numbers" },

      { href: "/dashboard/result-checkers", label: "Result Checkers" },

      { href: "/dashboard/reseller", label: "Reseller Program" },

    ],

    company: [

      { href: "/about", label: "About Us" },

      { href: "/blog", label: "Blog" },

      { href: "/careers", label: "Careers" },

      { href: "/press", label: "Press Kit" },

    ],

    support: [

      { href: "/faq", label: "Help Center" },

      { href: "/dashboard/tickets", label: "Support Tickets" },

      { href: "/dashboard/disputes", label: "Disputes" },

    ],

    legal: [

      { href: "/privacy", label: "Privacy Policy" },

      { href: "/terms", label: "Terms of Service" },

    ],

  }



  return (

    <footer className="relative border-t border-[#006994]/20 bg-background pt-24 pb-12 overflow-hidden">

      {/* Sea Blue gradient top accent */}

      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#722F37] via-[#006994] to-[#722F37]" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#006994]/20 to-transparent" />

      

      <div className="container mx-auto px-4 md:px-6 relative">

        <div className="grid gap-12 lg:grid-cols-12 mb-20">

            {/* Brand & Mission */}

            <div className="lg:col-span-4">

                <Link href="/" className="flex items-center gap-2.5 mb-8 group">

                  <Image 

                    src="/logo.svg" 

                    alt="Topchart" 

                    width={160} 

                    height={45} 

                    className="h-10 w-auto object-contain"

                  />

                </Link>

              <p className="text-muted-foreground leading-relaxed text-base max-w-sm mb-10 font-body">

              The easiest way to buy airtime and data in Ghana. Fast, reliable, and always available.

            </p>

            <div className="flex items-center gap-5">

              {[

                { icon: Twitter, href: "https://twitter.com/topchartgh", label: "Twitter" },

                { icon: Linkedin, href: "https://linkedin.com/company/topchartgh", label: "LinkedIn" },

                { icon: Github, href: "https://github.com/topchartgh", label: "GitHub" },

                { icon: Globe, href: "https://topchart.gh", label: "Website" },

              ].map((social) => (

                <Link 

                  key={social.label}

                  href={social.href} 

                  className="h-10 w-10 flex items-center justify-center rounded-full border border-[#006994]/20 text-muted-foreground hover:text-[#006994] hover:border-[#006994]/40 hover:bg-[#EFF6FA] transition-all duration-300"

                  style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}

                >

                  <span className="sr-only">{social.label}</span>

                  <social.icon className="h-5 w-5" />

                </Link>

              ))}

            </div>

          </div>



          {/* Links Grid */}

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">

            <div>

              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-8 font-body">Platform</h3>

              <ul className="space-y-4">

                {footerLinks.platform.map((link) => (

                  <li key={link.label}>

                    <Link

                      href={link.href}

                      className="text-sm text-muted-foreground hover:text-[#006994] transition-all duration-300 flex items-center group"

                      style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}

                    >

                      {link.label}

                      <ArrowRight className="h-3 w-3 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }} />

                    </Link>

                  </li>

                ))}

              </ul>

            </div>

            <div>

              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-8 font-body">Company</h3>

              <ul className="space-y-4">

                {footerLinks.company.map((link) => (

                  <li key={link.label}>

                    <Link

                      href={link.href}

                      className="text-sm text-muted-foreground hover:text-[#006994] transition-all duration-300 flex items-center group"

                      style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}

                    >

                      {link.label}

                      <ArrowRight className="h-3 w-3 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }} />

                    </Link>

                  </li>

                ))}

              </ul>

            </div>

            <div>

              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-8 font-body">Support</h3>

              <ul className="space-y-4">

                {footerLinks.support.map((link) => (

                  <li key={link.label}>

                    <Link

                      href={link.href}

                      className="text-sm text-muted-foreground hover:text-[#006994] transition-all duration-300 flex items-center group"

                      style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}

                    >

                      {link.label}

                      <ArrowRight className="h-3 w-3 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }} />

                    </Link>

                  </li>

                ))}

              </ul>

            </div>

            <div>

              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground mb-8">Contact</h3>

              <ul className="space-y-5">

                <li className="flex items-start gap-3 text-sm text-muted-foreground">

                  <Mail className="h-4 w-4 mt-0.5 text-[#006994]/70" />

                  <span className="hover:text-[#006994] transition-colors cursor-pointer">hello@topchart.gh</span>

                </li>

                <li className="flex items-start gap-3 text-sm text-muted-foreground">

                  <Phone className="h-4 w-4 mt-0.5 text-[#006994]/70" />

                  <span className="hover:text-[#006994] transition-colors cursor-pointer">+233 20 000 0000</span>

                </li>

                <li className="flex items-start gap-3 text-sm text-muted-foreground">

                  <MapPin className="h-4 w-4 mt-0.5 text-[#006994]/70" />

                  <span>East Legon, Accra</span>

                </li>

              </ul>

            </div>

          </div>

        </div>



        {/* Bottom Bar: Trust & Legal */}

        <div className="pt-10 border-t border-[#006994]/15 flex flex-col lg:flex-row items-center justify-between gap-10">

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">

            <p className="text-sm text-muted-foreground font-medium">

              &copy; {currentYear} Topchart Infrastructure Limited.

            </p>

            <div className="flex items-center gap-6">

              {footerLinks.legal.slice(0, 2).map((link) => (

                <Link 

                  key={link.label} 

                  href={link.href} 

                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-[#006994] transition-colors"

                >

                  {link.label}

                </Link>

              ))}

            </div>

          </div>

          

            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-muted/50 border border-border/50">

              <ShieldCheck className="h-4 w-4 text-success" />

              <span className="text-[11px] font-bold uppercase tracking-widest text-foreground font-body">PCI DSS Level 1</span>

            </div>

            <div className="flex items-center gap-6 opacity-60">

              <div className="flex -space-x-3">

                <div className="h-8 w-8 rounded-full border-2 border-background bg-[#FFCC00] flex items-center justify-center overflow-hidden">

                  <Smartphone className="h-4 w-4 text-black/20" />

                </div>

                <div className="h-8 w-8 rounded-full border-2 border-background bg-[#E60000] flex items-center justify-center overflow-hidden">

                  <CreditCard className="h-4 w-4 text-white/20" />

                </div>

                <div className="h-8 w-8 rounded-full border-2 border-background bg-[#E40046] flex items-center justify-center overflow-hidden" />

              </div>

              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Supported Networks</span>

            </div>

          </div>

        </div>

      </div>

    </footer>

  )

}

