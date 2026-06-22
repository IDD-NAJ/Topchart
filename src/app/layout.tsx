import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { AuthLoadingScreen } from "@/components/auth-loading-screen"
import { PreloadWrapper } from '@/components/preload-wrapper'
import { TawkChat } from '@/components/tawk-chat'
import { WhatsAppFAB } from '@/components/whatsapp-fab'
import Script from 'next/script'
import '@fontsource-variable/inter'
import '@fontsource/dm-serif-display'
import '@fontsource/great-vibes/400.css'
import '@fontsource-variable/space-grotesk/index.css'
import './globals.css'

// Fallback standard CSS variable system for Great Vibes (fixes Turbopack internal/font compilation network flake issues)

export const metadata: Metadata = {
  metadataBase: new URL('https://topchart.store'),
  title: {
    default: 'Cheap Data Bundles Ghana | MTN, Telecel & AirtelTigo | Topchart Accra',
    template: '%s | Topchart Ghana',
  },
  description: 'Buy cheap MTN, Telecel & AirtelTigo data bundles instantly in Ghana. Lowest prices, non-expiry bundles, instant delivery via MoMo. Based in Accra, serving all of Ghana.',
  keywords: [
    'cheap data bundles Ghana',
    'MTN cheap data bundles Accra',
    'buy MTN data online Ghana',
    'Telecel cheap bundles Kumasi',
    'AirtelTigo cheap data Tema',
    'affordable internet bundles Ghana',
    'instant data delivery Ghana',
    'cheapest MTN bundles Ghana',
    'buy cheap data online Accra',
    'non expiry data bundles Ghana',
    'fast data bundles Ghana',
    'buy data with MoMo Ghana',
    'data reseller Ghana',
    'cheap internet Ghana',
    'Topchart Accra',
    'Ghana data bundles',
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
    title: 'Topchart — Cheap Data Bundles, Airtime & Foreign Numbers Ghana',
    description: 'Buy cheap MTN, Telecel & AirtelTigo data bundles instantly. Get virtual numbers for OTP & SMS verification in Ghana. Fast, secure & reliable.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Topchart Ghana — Cheap Data Bundles, Airtime & Foreign Numbers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@topchartgh',
    creator: '@topchartgh',
    title: 'Topchart — Cheap Data Bundles & Foreign Numbers Ghana',
    description: 'Buy cheap data bundles, airtime & OTP Foreign Numbers in Ghana instantly.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
        description: "Ghana's leading digital services platform for cheap data bundles, airtime, Foreign Numbers, result checkers, and bill payments. Instant delivery via MTN MoMo, Telecel Cash, and AirtelTigo Money.",
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
        '@type': 'LocalBusiness',
        name: 'Topchart Ghana',
        image: 'https://topchart.store/logo.svg',
        description: 'Buy cheap MTN, Telecel & AirtelTigo data bundles instantly in Ghana. Lowest prices, non-expiry bundles, instant delivery via MoMo.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'East Legon',
          addressLocality: 'Accra',
          addressRegion: 'Greater Accra',
          postalCode: '00233',
          addressCountry: 'GH',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '5.6037',
          longitude: '-0.1870',
        },
        areaServed: [
          {
            '@type': 'City',
            name: 'Accra',
          },
          {
            '@type': 'City',
            name: 'Kumasi',
          },
          {
            '@type': 'City',
            name: 'Tema',
          },
          {
            '@type': 'City',
            name: 'Takoradi',
          },
          {
            '@type': 'Country',
            name: 'Ghana',
          },
        ],
        url: 'https://topchart.store',
        telephone: '+233509122072',
        priceRange: 'GHS 1-500',
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: 'https://topchart.store',
        name: 'Topchart',
        description: 'Digital services platform for cheap data bundles, airtime, Foreign Numbers, result checkers, and bill payments in Ghana. Instant delivery.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://topchart.store/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Cheap MTN Data Bundles Ghana',
        description: 'Buy cheap MTN data bundles in Ghana with instant delivery. Daily, weekly, and monthly packages available at lowest prices.',
        image: 'https://topchart.store/mtn-ghana-logo.png',
        brand: {
          '@type': 'Brand',
          name: 'MTN Ghana',
        },
        offers: {
          '@type': 'Offer',
          url: 'https://topchart.store/dashboard/data',
          priceCurrency: 'GHS',
          price: '1',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Topchart Ghana',
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Cheap Telecel Data Bundles Ghana',
        description: 'Buy cheap Telecel data bundles in Ghana with instant delivery. Affordable daily, weekly, and monthly packages.',
        image: 'https://topchart.store/telecel-ghana-logo.jpg',
        brand: {
          '@type': 'Brand',
          name: 'Telecel Ghana',
        },
        offers: {
          '@type': 'Offer',
          url: 'https://topchart.store/dashboard/data',
          priceCurrency: 'GHS',
          price: '1',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Topchart Ghana',
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Cheap AirtelTigo Data Bundles Ghana',
        description: 'Buy cheap AirtelTigo data bundles in Ghana with instant delivery. Best prices on daily, weekly, and monthly internet packages.',
        image: 'https://topchart.store/airteltigo-ghana-logo.png',
        brand: {
          '@type': 'Brand',
          name: 'AirtelTigo Ghana',
        },
        offers: {
          '@type': 'Offer',
          url: 'https://topchart.store/dashboard/data',
          priceCurrency: 'GHS',
          price: '1',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Topchart Ghana',
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What are the cheapest data bundles in Ghana?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Topchart offers the cheapest MTN, Telecel, and AirtelTigo data bundles in Ghana with prices lower than direct carrier rates. We have daily, weekly, and monthly bundles with non-expiry options available.',
            },
          },
          {
            '@type': 'Question',
            name: 'How can I buy cheap MTN data bundles online in Ghana?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can buy cheap MTN data bundles online in Ghana through Topchart using MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, or Mastercard. Simply create an account, select your bundle, and pay securely. Delivery is instant.',
            },
          },
          {
            '@type': 'Question',
            name: 'Where can I find non-expiry data bundles in Ghana?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Topchart offers non-expiry data bundles for MTN and other networks in Ghana. These bundles do not expire and give you flexibility. Check our dashboard for current non-expiry bundle offers and pricing.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I become a data reseller in Ghana?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'To become a data reseller in Ghana, join the Topchart reseller programme. You can earn daily commissions reselling cheap data bundles, airtime, and Foreign Numbers under your own brand. Sign up on our dashboard and start earning today.',
            },
          },
          {
            '@type': 'Question',
            name: 'What payment methods work for buying data bundles in Ghana?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Topchart accepts MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, Mastercard, and wallet balance via Paystack for buying data bundles in Ghana. All payments are secure and instant.',
            },
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Topchart Popular Services',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Buy Cheap Data Bundles Ghana',
            item: 'https://topchart.store/dashboard/data',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Foreign Numbers Ghana',
            item: 'https://topchart.store/dashboard/verification',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Result Checkers Ghana',
            item: 'https://topchart.store/dashboard/result-checkers',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'Data Reseller Programme',
            item: 'https://topchart.store/about',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://topchart.store',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Data Bundles',
            item: 'https://topchart.store/dashboard/data',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Verification',
            item: 'https://topchart.store/dashboard/verification',
          },
        ],
      },
    ]),
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#146EF5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <AuthLoadingScreen />
          <PreloadWrapper>
            {children}
          </PreloadWrapper>
          <TawkChat />
          <WhatsAppFAB />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED !== "false" && (
          <>
            <Script
              id="gtag-base"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18200576208')}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);} 
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18200576208'}');
                `,
              }}
            />
          </>
        )}
        <Analytics />
        {/* Client-side error tracking disabled to prevent noise */}
      </body>
    </html>
  )
}
