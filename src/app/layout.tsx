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
    default: 'Topchart — Cheap Data Bundles, Airtime & Verification Numbers Ghana',
    template: '%s | Topchart Ghana',
  },
  description: 'Buy cheap MTN, Telecel & AirtelTigo data bundles instantly. Get virtual numbers for OTP & SMS verification in Ghana. Secure, fast & always on.',
  keywords: [
    'cheap data bundles Ghana',
    'buy airtime online Ghana',
    'verification numbers Ghana',
    'OTP number Ghana',
    'SMS verification Ghana',
    'MTN data bundles',
    'Telecel data bundles',
    'AirtelTigo data',
    'WAEC result checker',
    'BECE result checker',
    'NOVDEC checker',
    'cheap internet Ghana',
    'data reseller Ghana',
    'digital services Ghana',
    'virtual phone numbers',
    'gift cards Ghana',
    'bill payment Ghana',
    'mobile money payments',
    'Topchart Ghana',
  ],
  authors: [{ name: 'Topchart', url: 'https://topchart.store' }],
  creator: 'Topchart',
  publisher: 'Topchart',
  category: 'Digital Services',
  applicationName: 'Topchart',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google860c28ee3c4b1e50.html',
  },
  alternates: {
    canonical: 'https://topchart.store',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://topchart.store',
    siteName: 'Topchart',
    title: 'Topchart — Cheap Data Bundles, Airtime & Verification Numbers Ghana',
    description: 'Buy cheap MTN, Telecel & AirtelTigo data bundles instantly. Get virtual numbers for OTP & SMS verification in Ghana. Fast, secure & reliable.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Topchart Ghana — Cheap Data Bundles, Airtime & Verification Numbers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@topchartgh',
    creator: '@topchartgh',
    title: 'Topchart — Cheap Data Bundles & Verification Numbers Ghana',
    description: 'Buy cheap data bundles, airtime & OTP verification numbers in Ghana instantly.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'msvalidate.01': '7E495D7163563B23502D4333EA6974C4',
    'script:ld+json': JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Topchart',
        alternateName: 'Topchart Ghana',
        url: 'https://topchart.store',
        logo: 'https://topchart.store/logo.svg',
        description: "Ghana's digital services platform for data bundles, airtime, verification numbers, result checkers, gift cards and bill payments.",
        email: 'support@topchart.store',
        telephone: '+233509122072',
        foundingLocation: {
          '@type': 'Place',
          name: 'Accra, Ghana',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'East Legon',
          addressLocality: 'Accra',
          addressRegion: 'Greater Accra',
          addressCountry: 'GH',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Ghana',
        },
        sameAs: [
          'https://twitter.com/topchartgh',
          'https://linkedin.com/company/topchartgh',
          'https://wa.me/233509122072',
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+233509122072',
            contactType: 'customer support',
            availableLanguage: ['English'],
            areaServed: 'GH',
          },
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
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Topchart Popular Services',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Buy Airtime Online Ghana',
            item: 'https://topchart.store/buy-airtime-online-ghana',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Cheap Mobile Data Ghana',
            item: 'https://topchart.store/cheap-mobile-data-ghana',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Virtual Number for Verification',
            item: 'https://topchart.store/virtual-phone-number-for-verification',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'WAEC Result Checker',
            item: 'https://topchart.store/waec-result-checker',
          },
          {
            '@type': 'ListItem',
            position: 5,
            name: 'Reseller Programme',
            item: 'https://topchart.store/about',
          },
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
          'https://topchart.store/terms',
        ],
      },
    ]),
  },
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
