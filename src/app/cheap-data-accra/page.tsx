import { Metadata } from 'next'
import Link from 'next/link'
import { Wifi, MapPin, Zap, Shield, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cheap Data Bundles Accra | Buy Data Online Accra Ghana',
  description: 'Buy cheap data bundles in Accra, Ghana. MTN, Telecel, AirtelTigo data bundles at lowest prices. Instant delivery via MoMo. Serving all Accra neighborhoods.',
  keywords: [
    'cheap data bundles Accra',
    'buy data online Accra',
    'MTN data Accra',
    'Telecel data Accra',
    'AirtelTigo data Accra',
    'cheap internet Accra',
    'data bundles Ghana',
    'Accra data deals',
    'buy MTN data Accra',
    'instant data delivery Accra',
    'non-expiry data Accra',
    'Accra digital services',
  ],
  alternates: { canonical: 'https://topchart.store/cheap-data-accra' },
  openGraph: {
    title: 'Cheap Data Bundles Accra | Buy Data Online Accra Ghana',
    description: 'Buy cheap data bundles in Accra, Ghana. MTN, Telecel, AirtelTigo data at lowest prices. Instant delivery via MoMo.',
    url: 'https://topchart.store/cheap-data-accra',
    type: 'website',
  },
}

export default function AccraDataLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <MapPin className="mr-2 h-4 w-4" />
                Accra, Ghana
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Cheap Data Bundles Accra
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy cheap data bundles in Accra, Ghana. MTN, Telecel, AirtelTigo data bundles at lowest prices. Instant delivery via MoMo. Serving all Accra neighborhoods including Osu, Labadi, Cantonments, Airport Residential, East Legon, and more.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/data"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Buy Data in Accra
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/verification"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-200 px-8 py-3 font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                >
                  Verification Numbers
                </Link>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accra Neighborhoods */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Serving All Accra Neighborhoods
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'Osu',
              'Labadi',
              'Cantonments',
              'Airport Residential',
              'East Legon',
              'Madina',
              'Tema',
              'Kasoa',
              'Achimota',
              'Dansoman',
              'Spintex',
              'Teshie',
            ].map((area, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 text-center font-semibold text-neutral-700">
                <MapPin className="mx-auto mb-2 h-5 w-5 text-primary" />
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Accra Residents Choose Topchart
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'Get your data bundle instantly after payment. No waiting.',
              },
              {
                icon: Shield,
                title: 'Lowest Prices',
                description: 'Cheapest data bundles in Accra. Lower than carrier rates.',
              },
              {
                icon: CheckCircle,
                title: 'All Networks',
                description: 'MTN, Telecel, and AirtelTigo data bundles available.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <feature.icon className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 bg-primary">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Buy Data in Accra?
          </h2>
          <Link
            href="/dashboard/data"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-primary transition-colors hover:bg-neutral-100"
          >
            Get Started Now
            <Wifi className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
