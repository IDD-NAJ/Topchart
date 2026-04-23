import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { PreloadWrapper } from '@/components/preload-wrapper'
import { TawkChat } from '@/components/tawk-chat'
import '@fontsource-variable/inter'
import '@fontsource/dm-serif-display'
import './globals.css'

// Fallback standard CSS variable system for Great Vibes (fixes Turbopack internal/font compilation network flake issues)

export const metadata: Metadata = {
  metadataBase: new URL('https://topchart.store'),
  title: {
    default: 'Topchart — Digital Services Platform',
    template: '%s | Topchart',
  },
  description: 'Topchart is Ghana\'s premier complete digital services platform. Buy data bundles, verification numbers, check exam results, and join our reseller programme — instantly and securely.',
  applicationName: 'Topchart',
  keywords: ['buy data online ghana', 'instant airtime top up ghana', 'cheap mobile data ghana', 'data bundles ghana', 'verification numbers ghana', 'WAEC result checker', 'BECE result checker', 'reseller programme ghana', 'MTN', 'Telecel', 'AirtelTigo', 'OTP verification number'],
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
    description: 'Complete digital services platform — data, verification numbers, exam results, and reseller programme.',
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
    description: 'Complete digital services platform — data, verification numbers, exam results, and reseller programme.',
    images: ['/og-image.png'],
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
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://topchart.store/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]),
  },
  icons: {
    icon: [
      {
        url: '/icon.png',
        type: 'image/png',
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
      <body className="font-sans antialiased">
        <AuthProvider>
          <PreloadWrapper>
            {children}
          </PreloadWrapper>
          <TawkChat />
        </AuthProvider>
        <Analytics />
        {/* Client-side error tracking disabled to prevent noise */}
      </body>
    </html>
  )
}
