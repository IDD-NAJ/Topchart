import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://topchart.gh'),
  title: {
    default: 'Topchart Ghana — Buy Airtime & Data Instantly',
    template: '%s | Topchart Ghana',
  },
  description: 'The fastest, most secure way to buy airtime and data bundles for MTN, Telecel, and AirtelTigo in Ghana. Instant delivery, 24/7 available.',
  applicationName: 'Topchart Ghana',
  keywords: ['airtime', 'data bundles', 'Ghana', 'MTN', 'Telecel', 'AirtelTigo', 'mobile top up', 'recharge', 'buy airtime online', 'buy data Ghana'],
  authors: [{ name: 'Topchart Ghana', url: 'https://topchart.gh' }],
  creator: 'Topchart Ghana',
  publisher: 'Topchart Ghana',
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
    url: 'https://topchart.gh',
    siteName: 'Topchart Ghana',
    title: 'Topchart Ghana — Buy Airtime & Data Instantly',
    description: 'The fastest, most secure way to buy airtime and data bundles for MTN, Telecel, and AirtelTigo in Ghana.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Topchart Ghana — Instant Airtime & Data Top-up',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@topchartgh',
    creator: '@topchartgh',
    title: 'Topchart Ghana — Buy Airtime & Data Instantly',
    description: 'The fastest, most secure way to buy airtime and data bundles for MTN, Telecel, and AirtelTigo in Ghana.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://topchart.gh',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Topchart Ghana',
      alternateName: 'Topchart',
      url: 'https://topchart.gh',
      logo: 'https://topchart.gh/logo.svg',
      description: 'Ghana\'s leading platform for instant airtime and data top-ups across MTN, Telecel, and AirtelTigo networks.',
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
    }),
  },
  icons: {
    icon: [
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSerifDisplay.variable} ${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
