import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { PreloadWrapper } from '@/components/preload-wrapper'
import { TawkChat } from '@/components/tawk-chat'
import { WhatsAppFAB } from '@/components/whatsapp-fab'
import '@fontsource-variable/inter'
import '@fontsource/dm-serif-display'
import '@fontsource/great-vibes/400.css'
import '@fontsource-variable/space-grotesk/index.css'
import './globals.css'

// Fallback standard CSS variable system for Great Vibes (fixes Turbopack internal/font compilation network flake issues)

export const metadata: Metadata = {
  metadataBase: new URL('https://topchart.store'),
  title: {
    default: 'Topchart — Digital Services Platform',
    template: '%s | Topchart',
  },
  description: 'Topchart is Ghana\'s complete digital services platform for instant airtime top-up, MTN/Telecel/AirtelTigo data bundles, OTP verification numbers, WAEC and BECE result checkers, bill payments, gift cards, and reseller tools.',
  applicationName: 'Topchart',
  keywords: [
    'buy data online ghana',
    'instant airtime top up ghana',
    'cheap mobile data ghana',
    'mtn data bundle ghana',
    'telecel data bundle ghana',
    'airteltigo data bundle ghana',
    'verification numbers ghana',
    'otp verification number',
    'waec result checker',
    'bece result checker',
    'gift cards ghana',
    'pay bills online ghana',
    'reseller programme ghana',
    'topchart',
  ],
  authors: [{ name: 'Topchart', url: 'https://topchart.store' }],
  creator: 'Topchart',
  publisher: 'Topchart',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://topchart.store',
    siteName: 'Topchart',
    title: 'Topchart — Digital Services Platform',
    description: 'Buy airtime, data bundles, verification numbers, result checker vouchers, gift cards, and pay bills instantly on Topchart. Built for speed, reliability, and secure checkout in Ghana.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Topchart — Instant Data & Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@topchartgh',
    creator: '@topchartgh',
    title: 'Topchart — Digital Services Platform',
    description: 'Buy airtime, data bundles, verification numbers, result checker vouchers, gift cards, and pay bills instantly on Topchart.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://topchart.store',
  },
  other: {
    'script:ld+json': JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Topchart',
        alternateName: 'Topchart Ghana',
        url: 'https://topchart.store',
        logo: 'https://topchart.store/logo.svg',
        description: 'Ghana\'s digital services platform for data bundles, verification numbers, result checkers, and reseller services.',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+233-20-000-0000',
            contactType: 'customer service',
            areaServed: 'GH',
            availableLanguage: 'English',
          },
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Accra',
          addressCountry: 'GH',
          streetAddress: 'East Legon',
        },
        sameAs: [
          'https://twitter.com/topchartgh',
          'https://linkedin.com/company/topchartgh',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: 'https://topchart.store',
        name: 'Topchart',
        description: 'Digital services platform for airtime, data, verification numbers, result checkers, gift cards, and bill payments in Ghana.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://topchart.store/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Topchart Popular Services',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Buy Airtime Online Ghana', url: 'https://topchart.store/buy-airtime-online-ghana' },
          { '@type': 'ListItem', position: 2, name: 'Cheap Mobile Data Ghana', url: 'https://topchart.store/cheap-mobile-data-ghana' },
          { '@type': 'ListItem', position: 3, name: 'Virtual Number for Verification', url: 'https://topchart.store/virtual-phone-number-for-verification' },
          { '@type': 'ListItem', position: 4, name: 'WAEC Result Checker', url: 'https://topchart.store/waec-result-checker' },
          { '@type': 'ListItem', position: 5, name: 'Reseller Programme', url: 'https://topchart.store/about' },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SiteNavigationElement',
        name: ['About', 'FAQ', 'Blog', 'Privacy', 'Terms'],
        url: [
          'https://topchart.store/about',
          'https://topchart.store/faq',
          'https://topchart.store/blog',
          'https://topchart.store/privacy',
          'https://topchart.store/terms'
        ]
      }
    ]),
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  category: 'finance',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#146EF5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <PreloadWrapper>
            {children}
          </PreloadWrapper>
          <TawkChat />
          <WhatsAppFAB />
        </AuthProvider>
        <Analytics />
        {/* Client-side error tracking disabled to prevent noise */}
      </body>
    </html>
  )
}
